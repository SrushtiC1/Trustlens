const Analysis = require('../models/Analysis');
const SampleEntity = require('../models/SampleEntity');
const { calculateTrustScore } = require('../utils/scoringEngine');
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
const path = require('path');
const aiService = require('../utils/aiService');
const mockDataService = require('../utils/mockDataService');

exports.analyzeEntity = async (req, res) => {
    try {
        const { entity, type } = req.body;
        const userId = req.user.id;

        // Search for entity in sample data to get simulated metrics
        let sampleData = await SampleEntity.findOne({ entity });

        // If not in sample data, generate heuristic-based metrics
        if (!sampleData) {
            sampleData = mockDataService.generateMockFeatures(entity, type);
        }

        // Execute Machine Learning Python Script (Using execFile for security)
        const execFile = util.promisify(require('child_process').execFile);
        let mlPrediction = null;
        try {
            const scriptPath = path.join(__dirname, '../../ml/predict.py');
            
            // Pass arguments as an array to prevent shell injection
            const { stdout } = await execFile('python', [scriptPath, '--type', type, '--entity', entity]);
            
            // Find the JSON block
            const outputLines = stdout.split('\n');
            let jsonString = '';
            for (let line of outputLines) {
                if (line.trim().startsWith('{')) {
                    jsonString = line.trim();
                    break;
                }
            }
            if(jsonString) {
                const results = JSON.parse(jsonString);
                if (results.success) {
                    mlPrediction = results.prediction;
                } else {
                    console.error("Python script returned soft error:", results.error);
                }
            }
        } catch (e) {
            console.error("ML Model script execution failed:", e);
        }

        // Inject ML output into entity features before calculating score
        // We use lean object representation to avoid Mongoose doc quirks
        const entityData = sampleData.toObject ? sampleData.toObject() : sampleData;
        entityData.mlPrediction = mlPrediction;

        const { score, riskLevel, breakdown } = calculateTrustScore(entityData);

        const newAnalysis = new Analysis({
            userId,
            entity,
            type,
            score,
            riskLevel,
            breakdown
        });

        await newAnalysis.save();

        res.status(200).json({
            success: true,
            data: {
                score,
                riskLevel,
                breakdown,
                entity,
                type
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await Analysis.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.status(200).json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAiInsight = async (req, res) => {
    try {
        const { entity, type, score, breakdown } = req.body;
        const aiInsight = await aiService.getRiskInsight(entity, type, score, breakdown);
        res.status(200).json({ success: true, aiInsight });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const response = await aiService.getChatResponse(history || [], message);
        
        res.status(200).json({
            success: true,
            response
        });
    } catch (err) {
        console.error("Chat Controller Error:", err);
        res.status(500).json({ success: false, message: "Failed to get AI response" });
    }
};

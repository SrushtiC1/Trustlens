const Analysis = require('../models/Analysis');
const SampleEntity = require('../models/SampleEntity');
const { calculateTrustScore } = require('../utils/scoringEngine');
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
const path = require('path');
const aiService = require('../utils/aiService');

exports.analyzeEntity = async (req, res) => {
    try {
        const { entity, type } = req.body;
        const userId = req.user.id;

        // Search for entity in sample data to get simulated metrics
        let sampleData = await SampleEntity.findOne({ entity });

        // If not in sample data, perform heuristic-based "Real-Time" simulation
        if (!sampleData) {
            // Generate deterministic "random" values based on the entity string
            let hash = 0;
            for (let i = 0; i < entity.length; i++) {
                hash = ((hash << 5) - hash) + entity.charCodeAt(i);
                hash |= 0;
            }
            const absHash = Math.abs(hash);

            const entityLower = entity.toLowerCase();
            const isUrl = type.toLowerCase() === 'url' || type.toLowerCase() === 'website';
            // Heuristic 1: TLD-based age (for URLs) or Randomized age
            let ageGuess = (absHash % 80) / 10; // 0 to 7.9 years
            if (isUrl) {
                const safeTlds = ['.com', '.org', '.net', '.edu', '.gov'];
                const suspiciousTlds = ['.xyz', '.top', '.icu', '.party', '.bid', '.gdn'];
                if (safeTlds.some(t => entityLower.endsWith(t))) ageGuess += 2.5;
                if (suspiciousTlds.some(t => entityLower.endsWith(t))) ageGuess *= 0.1;
            } else if (type.toLowerCase() === 'phone') {
                // For phones, age might represent registration duration
                ageGuess = (absHash % 50) / 10;
            }

            // Heuristic 2: Keywords
            const suspiciousWords = ['login', 'verify', 'update', 'banking', 'secure-verify', 'prize', 'gift'];
            const hasSuspiciousWords = suspiciousWords.some(word => entityLower.includes(word));

            sampleData = {
                entity,
                type,
                isHttps: entity.startsWith('https://'),
                domainAgeYears: ageGuess,
                isBlacklisted: (absHash % 100) < 8, // 8% chance of simulated blacklist
                complaintsCount: hasSuspiciousWords ? (3 + (absHash % 12)) : (absHash % 4),
                suspiciousKeywordsFound: hasSuspiciousWords
            };
        }

        // Execute Machine Learning Python Script
        let mlPrediction = null;
        try {
            const scriptPath = path.join(__dirname, '../../ml/predict.py');
            const safeEntity = entity.replace(/"/g, '\\"');
            
            const { stdout } = await execPromise(`python "${scriptPath}" --type "${type}" --entity "${safeEntity}"`);
            
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

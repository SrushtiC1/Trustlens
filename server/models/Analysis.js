const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    entity: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['URL', 'Email', 'Phone'],
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['Low Risk', 'Medium Risk', 'High Risk'],
        required: true
    },
    breakdown: [{
        factor: String,
        impact: Number,
        description: String
    }],
    aiInsight: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analysis', analysisSchema);

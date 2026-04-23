const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    entity: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);

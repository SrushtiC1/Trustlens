const mongoose = require('mongoose');

const sampleEntitySchema = new mongoose.Schema({
    entity: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['URL', 'Email', 'Phone', 'Website'],
        required: true
    },
    isHttps: {
        type: Boolean,
        default: false
    },
    domainAgeYears: {
        type: Number,
        default: 0
    },
    isBlacklisted: {
        type: Boolean,
        default: false
    },
    complaintsCount: {
        type: Number,
        default: 0
    },
    suspiciousKeywordsFound: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('SampleEntity', sampleEntitySchema);

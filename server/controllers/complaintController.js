const Complaint = require('../models/Complaint');
const SampleEntity = require('../models/SampleEntity');

exports.submitComplaint = async (req, res) => {
    try {
        const { entity, reason } = req.body;
        const reportedBy = req.user.id;

        const newComplaint = new Complaint({
            entity,
            reason,
            reportedBy
        });

        await newComplaint.save();

        // Increment complaint count in sample data if it exists
        await SampleEntity.findOneAndUpdate(
            { entity },
            { $inc: { complaintsCount: 1 } }
        );

        res.status(201).json({ success: true, message: 'Complaint submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const express = require('express');
const router = express.Router();
const { submitComplaint } = require('../controllers/complaintController');
const auth = require('../middleware/auth');

router.post('/submit', auth, submitComplaint);

module.exports = router;

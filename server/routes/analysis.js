const express = require('express');
const router = express.Router();
const { analyzeEntity, getHistory, getAiInsight, handleChat } = require('../controllers/analysisController');
const auth = require('../middleware/auth');

router.post('/analyze', auth, analyzeEntity);
router.get('/history', auth, getHistory);
router.post('/ai-insight', auth, getAiInsight);
router.post('/chat', handleChat);

module.exports = router;

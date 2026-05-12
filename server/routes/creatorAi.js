const express = require('express');
const router = express.Router();
const {
  analyzeThumbnail,
  optimizeTitle,
  generateSEO,
  predictEngagement,
  analyzeRetention,
  generateScript,
  analyzeTrends,
} = require('../controllers/creatorAiController');
const { protect } = require('../middleware/auth');

router.post('/analyze-thumbnail', protect, analyzeThumbnail);
router.post('/optimize-title', protect, optimizeTitle);
router.post('/seo', protect, generateSEO);
router.post('/predict-engagement', protect, predictEngagement);
router.post('/analyze-retention', protect, analyzeRetention);
router.post('/generate-script', protect, generateScript);
router.post('/analyze-trends', protect, analyzeTrends);

module.exports = router;

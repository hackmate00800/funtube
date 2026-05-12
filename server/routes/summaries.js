const express = require('express');
const router = express.Router();
const {
  getSummary,
  generateSummary,
  getSummaryStatus,
  regenerateLevel,
  downloadPDF,
} = require('../controllers/summaryController');
const { protect } = require('../middleware/auth');

router.get('/:videoId', protect, getSummary);
router.get('/:videoId/status', protect, getSummaryStatus);
router.post('/:videoId/generate', protect, generateSummary);
router.post('/:videoId/regenerate/:level', protect, regenerateLevel);
router.get('/:videoId/download-pdf', protect, downloadPDF);

module.exports = router;

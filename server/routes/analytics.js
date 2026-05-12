const express = require('express');
const router = express.Router();
const {
  getVideoAnalytics,
  getCreatorSummary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getCreatorSummary);
router.get('/video/:videoId', protect, getVideoAnalytics);

module.exports = router;

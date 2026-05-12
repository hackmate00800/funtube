const express = require('express');
const router = express.Router();
const {
  getProductivityInsights, getRealTimeAnalysis, getHourlyBreakdown,
  analyzeCategoryBreakdown, getWellnessScore,
} = require('../controllers/aiProductivityController');
const { protect } = require('../middleware/auth');

router.get('/insights', protect, getProductivityInsights);
router.get('/realtime', protect, getRealTimeAnalysis);
router.get('/hourly', protect, getHourlyBreakdown);
router.get('/categories', protect, analyzeCategoryBreakdown);
router.get('/wellness', protect, getWellnessScore);

module.exports = router;

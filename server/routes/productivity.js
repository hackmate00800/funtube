const express = require('express');
const router = express.Router();
const {
  trackEvent, endSession, getUsageSummary,
  getDailyReports, getProductivityInsights, setDailyGoal,
} = require('../controllers/productivityController');
const { protect } = require('../middleware/auth');

router.post('/track', protect, trackEvent);
router.post('/end-session', protect, endSession);
router.get('/usage', protect, getUsageSummary);
router.get('/reports', protect, getDailyReports);
router.get('/insights', protect, getProductivityInsights);
router.put('/goal', protect, setDailyGoal);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getDna,
  trackInteraction,
  analyzeConfusion,
  getKnowledgeGraph,
  assessCareerReadiness,
  getRecommendations,
} = require('../controllers/learningDnaController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDna);
router.post('/track', protect, trackInteraction);
router.get('/confusion/:videoId', protect, analyzeConfusion);
router.get('/knowledge-graph', protect, getKnowledgeGraph);
router.post('/career-readiness', protect, assessCareerReadiness);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;

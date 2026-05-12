const express = require('express');
const router = express.Router();
const {
  detectHighlights,
  generateShort,
  getUserShorts,
} = require('../controllers/shortsController');
const { protect } = require('../middleware/auth');

router.get('/highlights/:videoId', protect, detectHighlights);
router.post('/generate/:videoId', protect, generateShort);
router.get('/my-shorts', protect, getUserShorts);

module.exports = router;

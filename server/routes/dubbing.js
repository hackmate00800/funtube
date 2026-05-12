const express = require('express');
const router = express.Router();
const {
  getLanguages,
  getSubtitles,
  generateSubtitles,
  generateDubbedAudio,
} = require('../controllers/dubbingController');
const { protect } = require('../middleware/auth');

router.get('/languages', getLanguages);
router.get('/subtitles/:videoId', protect, getSubtitles);
router.post('/subtitles/:videoId/generate', protect, generateSubtitles);
router.post('/audio/:videoId/generate', protect, generateDubbedAudio);

module.exports = router;

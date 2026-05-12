const express = require('express');
const router = express.Router();
const {
  generateTitle,
  generateTags,
  generateThumbnailDescription,
  generateCaptions,
  moderateContent,
  chat,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/generate-title', protect, generateTitle);
router.post('/generate-tags', protect, generateTags);
router.post('/generate-thumbnail', protect, generateThumbnailDescription);
router.post('/generate-captions/:videoId', protect, generateCaptions);
router.post('/moderate', protect, moderateContent);
router.post('/chat', protect, chat);

module.exports = router;

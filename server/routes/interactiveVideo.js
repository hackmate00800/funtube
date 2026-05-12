const express = require('express');
const router = express.Router();
const { generateElements } = require('../controllers/interactiveVideoController');
const { protect } = require('../middleware/auth');

router.post('/generate/:videoId', protect, generateElements);

module.exports = router;

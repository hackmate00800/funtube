const express = require('express');
const router = express.Router();
const {
  indexVideo,
  search,
  getVideoContext,
} = require('../controllers/semanticSearchController');
const { protect } = require('../middleware/auth');

router.post('/index/:videoId', protect, indexVideo);
router.post('/search', protect, search);
router.get('/context/:videoId/:timestamp', protect, getVideoContext);

module.exports = router;

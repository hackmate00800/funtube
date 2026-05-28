const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  initUpload,
  completeUpload,
  getMyVideos,
  getVideo,
  updateVideo,
  deleteVideo,
} = require('../controllers/driveController');

router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', protect, handleCallback);
router.get('/status', protect, getStatus);
router.post('/disconnect', protect, disconnect);

router.post('/upload/init', protect, initUpload);
router.post('/upload/complete', protect, completeUpload);
router.get('/videos', protect, getMyVideos);
router.get('/videos/:id', protect, getVideo);
router.put('/videos/:id', protect, updateVideo);
router.delete('/videos/:id', protect, deleteVideo);

module.exports = router;

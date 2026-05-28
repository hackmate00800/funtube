const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  uploadVideo,
  getMyVideos,
  getVideo,
  updateVideo,
  deleteVideo,
} = require('../controllers/driveController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', protect, handleCallback);
router.get('/status', protect, getStatus);
router.post('/disconnect', protect, disconnect);

router.post('/upload', protect, upload.single('video'), uploadVideo);
router.get('/videos', protect, getMyVideos);
router.get('/videos/:id', protect, getVideo);
router.put('/videos/:id', protect, updateVideo);
router.delete('/videos/:id', protect, deleteVideo);

module.exports = router;

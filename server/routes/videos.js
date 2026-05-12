const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  uploadVideo,
  uploadThumbnail,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  likeVideo,
  dislikeVideo,
  getTrending,
  getRecommended,
  incrementShare,
  addToWatchLater,
  getCreatorVideos,
  streamVideo,
} = require('../controllers/videoController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadVideo: uploadVideoMiddleware, uploadThumbnail: uploadThumbnailMiddleware } = require('../middleware/upload');

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Upload limit reached, please try again later' },
});

router.get('/', getVideos);
router.get('/trending', getTrending);
router.get('/creator', protect, getCreatorVideos);
router.get('/:id', optionalAuth, getVideo);
router.get('/:id/recommended', getRecommended);
router.post('/', uploadLimiter, protect, uploadVideoMiddleware.single('video'), uploadVideo);
router.post('/:videoId/thumbnail', uploadLimiter, protect, uploadThumbnailMiddleware.single('thumbnail'), uploadThumbnail);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);
router.get('/:id/stream/:quality', streamVideo);
router.put('/:id/like', protect, likeVideo);
router.put('/:id/dislike', protect, dislikeVideo);
router.put('/:id/share', protect, incrementShare);
router.put('/:id/watch-later', protect, addToWatchLater);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserDetail,
  updateUserRole,
  deleteUser,
  getVideos,
  toggleVideoActive,
  deleteVideo,
  getAnalytics,
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/videos', getVideos);
router.put('/videos/:id/toggle', toggleVideoActive);
router.delete('/videos/:id', deleteVideo);

router.get('/analytics', getAnalytics);

module.exports = router;

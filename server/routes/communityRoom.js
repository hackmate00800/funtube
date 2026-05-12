const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  updateVideoState,
} = require('../controllers/communityRoomController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRooms);
router.get('/:id', protect, getRoom);
router.post('/', protect, createRoom);
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);
router.post('/:id/message', protect, sendMessage);
router.put('/:id/video-state', protect, updateVideoState);

module.exports = router;

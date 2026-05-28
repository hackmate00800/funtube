const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { streamByInvite, getVideoInfo } = require('../controllers/streamController');
const {
  createInviteLink,
  getInviteLinks,
  updateInviteLink,
  deleteInviteLink,
} = require('../controllers/inviteController');

router.get('/stream/:token', streamByInvite);
router.get('/info/:token', getVideoInfo);

router.post('/', protect, createInviteLink);
router.get('/', protect, getInviteLinks);
router.put('/:id', protect, updateInviteLink);
router.delete('/:id', protect, deleteInviteLink);

module.exports = router;

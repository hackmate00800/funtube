const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  addComment,
  deleteComment,
  likeComment,
  addReply,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentValidation } = require('../middleware/validate');

router.get('/', getComments);
router.post('/', protect, commentValidation, addComment);
router.delete('/:commentId', protect, deleteComment);
router.put('/:commentId/like', protect, likeComment);
router.post('/:commentId/reply', protect, addReply);

module.exports = router;

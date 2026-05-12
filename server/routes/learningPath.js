const express = require('express');
const router = express.Router();
const {
  getPaths,
  getPath,
  createPath,
  updatePath,
  deletePath,
  enroll,
  getProgress,
  updateProgress,
  submitQuiz,
  getEnrolledPaths,
} = require('../controllers/learningPathController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getPaths);
router.get('/enrolled', protect, getEnrolledPaths);
router.get('/:id', getPath);
router.post('/', protect, authorize('admin', 'creator'), createPath);
router.put('/:id', protect, updatePath);
router.delete('/:id', protect, deletePath);
router.post('/:id/enroll', protect, enroll);
router.get('/:id/progress', protect, getProgress);
router.put('/:id/progress', protect, updateProgress);
router.post('/:id/quiz', protect, submitQuiz);

module.exports = router;

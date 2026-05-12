const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  submitProject,
  reviewProject,
  deleteProject,
} = require('../controllers/projectReviewController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.post('/', protect, submitProject);
router.post('/:id/review', protect, reviewProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;

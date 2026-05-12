const express = require('express');
const router = express.Router();
const {
  getProjectIdeas,
  generateProjectStructure,
  generateBoilerplate,
} = require('../controllers/projectBuilderController');
const { protect } = require('../middleware/auth');

router.get('/ideas', protect, getProjectIdeas);
router.post('/structure', protect, generateProjectStructure);
router.post('/boilerplate', protect, generateBoilerplate);

module.exports = router;

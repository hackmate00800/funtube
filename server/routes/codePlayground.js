const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLanguages, getStarterCode, execute, runTests,
  getProjects, getProject, saveProject, deleteProject,
  debugCode, optimizeCode, explainCode, convertCode, generateUnitTests,
  getChallenges, getChallenge, generateChallenge, getCollaborationToken,
} = require('../controllers/codePlaygroundController');

router.get('/languages', protect, getLanguages);
router.get('/starter/:language', protect, getStarterCode);
router.post('/execute', protect, execute);
router.post('/run-tests', protect, runTests);

router.get('/projects', protect, getProjects);
router.get('/projects/:id', protect, getProject);
router.post('/projects/:id', protect, saveProject);
router.post('/projects', protect, saveProject);
router.delete('/projects/:id', protect, deleteProject);

router.post('/ai/debug', protect, debugCode);
router.post('/ai/optimize', protect, optimizeCode);
router.post('/ai/explain', protect, explainCode);
router.post('/ai/convert', protect, convertCode);
router.post('/ai/unit-tests', protect, generateUnitTests);

router.get('/challenges', protect, getChallenges);
router.get('/challenges/:id', protect, getChallenge);
router.post('/challenges/generate', protect, generateChallenge);

router.get('/collaborate/:id', protect, getCollaborationToken);

module.exports = router;

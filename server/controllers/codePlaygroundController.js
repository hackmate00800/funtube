const { CodeProject, Challenge } = require('../models/CodeProject');
const { SUPPORTED_LANGUAGES, STARTER_CODES, executeCode, runTests } = require('../services/codeExecutionService');
const aiCoding = require('../services/aiCodingService');
const ErrorResponse = require('../utils/errorResponse');

exports.getLanguages = async (req, res) => {
  res.json({ success: true, data: SUPPORTED_LANGUAGES });
};

exports.getStarterCode = async (req, res) => {
  const { language } = req.params;
  const code = STARTER_CODES[language] || '// Start coding\n';
  res.json({ success: true, data: { language, code } });
};

exports.execute = async (req, res, next) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code) return next(new ErrorResponse('Code is required', 400));
    if (!SUPPORTED_LANGUAGES[language]) return next(new ErrorResponse(`Unsupported language: ${language}`, 400));
    const result = await executeCode(code, language, stdin || '');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.runTests = async (req, res, next) => {
  try {
    const { code, language, challengeId } = req.body;
    if (!code || !challengeId) return next(new ErrorResponse('Code and challengeId required', 400));
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return next(new ErrorResponse('Challenge not found', 404));
    const results = await runTests(code, language, challenge.testCases);
    const passed = results.filter(r => r.passed).length;
    res.json({ success: true, data: { results, total: results.length, passed } });
  } catch (err) {
    next(err);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await CodeProject.find({ user: req.user.id }).sort({ lastEdited: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await CodeProject.findById(req.params.id);
    if (!project) return next(new ErrorResponse('Project not found', 404));
    if (project.user.toString() !== req.user.id && !project.isPublic) return next(new ErrorResponse('Not authorized', 403));
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

exports.saveProject = async (req, res, next) => {
  try {
    const { title, language, files } = req.body;
    let project = await CodeProject.findById(req.params.id);
    if (project) {
      if (project.user.toString() !== req.user.id) return next(new ErrorResponse('Not authorized', 403));
      project.title = title || project.title;
      project.language = language || project.language;
      if (files) project.files = files;
      project.lastEdited = Date.now();
      await project.save();
    } else {
      project = await CodeProject.create({
        user: req.user.id,
        title: title || 'Untitled Project',
        language: language || 'javascript',
        files: files || [{ name: `main.${SUPPORTED_LANGUAGES[language]?.ext || 'js'}`, content: STARTER_CODES[language] || '', language: language || 'javascript' }],
      });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await CodeProject.findById(req.params.id);
    if (!project) return next(new ErrorResponse('Project not found', 404));
    if (project.user.toString() !== req.user.id) return next(new ErrorResponse('Not authorized', 403));
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

exports.debugCode = async (req, res, next) => {
  try {
    const { code, language, error } = req.body;
    if (!code) return next(new ErrorResponse('Code is required', 400));
    const explanation = await aiCoding.debugCode(code, language, error || '');
    res.json({ success: true, data: { explanation } });
  } catch (err) {
    next(err);
  }
};

exports.optimizeCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    if (!code) return next(new ErrorResponse('Code is required', 400));
    const suggestion = await aiCoding.optimizeCode(code, language);
    res.json({ success: true, data: { suggestion } });
  } catch (err) {
    next(err);
  }
};

exports.explainCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    if (!code) return next(new ErrorResponse('Code is required', 400));
    const explanation = await aiCoding.explainCode(code, language);
    res.json({ success: true, data: { explanation } });
  } catch (err) {
    next(err);
  }
};

exports.convertCode = async (req, res, next) => {
  try {
    const { code, fromLanguage, toLanguage } = req.body;
    if (!code || !fromLanguage || !toLanguage) return next(new ErrorResponse('Code, fromLanguage, toLanguage required', 400));
    const result = await aiCoding.convertCode(code, fromLanguage, toLanguage);
    res.json({ success: true, data: { code: result } });
  } catch (err) {
    next(err);
  }
};

exports.generateUnitTests = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    if (!code) return next(new ErrorResponse('Code is required', 400));
    const tests = await aiCoding.generateUnitTests(code, language);
    res.json({ success: true, data: { tests } });
  } catch (err) {
    next(err);
  }
};

exports.getChallenges = async (req, res, next) => {
  try {
    const { difficulty, language } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    const challenges = await Challenge.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: challenges });
  } catch (err) {
    next(err);
  }
};

exports.getChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return next(new ErrorResponse('Challenge not found', 404));
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

exports.generateChallenge = async (req, res, next) => {
  try {
    const { topic, difficulty } = req.body;
    const aiResult = await aiCoding.generateChallenge(topic || 'algorithms', difficulty || 'medium');
    let parsed;
    try { parsed = JSON.parse(aiResult); } catch { parsed = { title: topic || 'Coding Challenge', description: aiResult, starterCode: '', testCases: [] }; }
    const challenge = await Challenge.create({ ...parsed, language: 'javascript', author: req.user.id, aiGenerated: true });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

exports.getCollaborationToken = async (req, res, next) => {
  try {
    const project = await CodeProject.findById(req.params.id);
    if (!project) return next(new ErrorResponse('Project not found', 404));
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    res.json({ success: true, data: { token, projectId: project._id } });
  } catch (err) {
    next(err);
  }
};

const LearningPath = require('../models/LearningPath');
const UserProgress = require('../models/UserProgress');
const ErrorResponse = require('../utils/errorResponse');

exports.getEnrolledPaths = async (req, res, next) => {
  try {
    const progress = await UserProgress.find({ user: req.user.id }).populate('path');
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch enrolled paths: ' + err.message, 500));
  }
};

exports.getPaths = async (req, res, next) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    const paths = await LearningPath.find(filter)
      .sort({ enrolledCount: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await LearningPath.countDocuments(filter);
    res.status(200).json({ success: true, data: paths, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch learning paths: ' + err.message, 500));
  }
};

exports.getPath = async (req, res, next) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return next(new ErrorResponse('Learning path not found', 404));
    res.status(200).json({ success: true, data: path });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch learning path: ' + err.message, 500));
  }
};

exports.createPath = async (req, res, next) => {
  try {
    req.body.author = req.user.id;
    const path = await LearningPath.create(req.body);
    res.status(201).json({ success: true, data: path });
  } catch (err) {
    next(new ErrorResponse('Failed to create learning path: ' + err.message, 500));
  }
};

exports.updatePath = async (req, res, next) => {
  try {
    let path = await LearningPath.findById(req.params.id);
    if (!path) return next(new ErrorResponse('Learning path not found', 404));
    if (path.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this path', 403));
    }
    path = await LearningPath.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: path });
  } catch (err) {
    next(new ErrorResponse('Failed to update learning path: ' + err.message, 500));
  }
};

exports.deletePath = async (req, res, next) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return next(new ErrorResponse('Learning path not found', 404));
    if (path.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this path', 403));
    }
    await UserProgress.deleteMany({ path: req.params.id });
    await LearningPath.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(new ErrorResponse('Failed to delete learning path: ' + err.message, 500));
  }
};

exports.enroll = async (req, res, next) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return next(new ErrorResponse('Learning path not found', 404));
    let progress = await UserProgress.findOne({ user: req.user.id, path: req.params.id });
    if (progress) return res.status(200).json({ success: true, data: progress });
    progress = await UserProgress.create({ user: req.user.id, path: req.params.id });
    path.enrolledCount += 1;
    await path.save();
    res.status(201).json({ success: true, data: progress });
  } catch (err) {
    next(new ErrorResponse('Failed to enroll: ' + err.message, 500));
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const progress = await UserProgress.findOne({ user: req.user.id, path: req.params.id });
    if (!progress) return next(new ErrorResponse('Not enrolled in this path', 404));
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch progress: ' + err.message, 500));
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    let progress = await UserProgress.findOne({ user: req.user.id, path: req.params.id });
    if (!progress) return next(new ErrorResponse('Not enrolled in this path', 404));
    const { moduleIndex, stepIndex, timeSpent, score, completed } = req.body;
    if (completed && stepIndex != null && moduleIndex != null) {
      const existing = progress.completedSteps.find(s => s.moduleIndex === moduleIndex && s.stepIndex === stepIndex);
      if (!existing) {
        progress.completedSteps.push({ moduleIndex, stepIndex, timeSpent, score });
      }
      const existingModule = progress.completedModules.find(m => m.moduleIndex === moduleIndex);
      if (!existingModule) {
        progress.completedModules.push({ moduleIndex, completedAt: new Date() });
      }
    }
    if (moduleIndex != null) progress.currentModule = moduleIndex;
    if (stepIndex != null) progress.currentStep = stepIndex;
    if (timeSpent) progress.totalTimeSpent += timeSpent;
    await progress.save();
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(new ErrorResponse('Failed to update progress: ' + err.message, 500));
  }
};

exports.submitQuiz = async (req, res, next) => {
  try {
    const { moduleIndex, score, total } = req.body;
    let progress = await UserProgress.findOne({ user: req.user.id, path: req.params.id });
    if (!progress) return next(new ErrorResponse('Not enrolled in this path', 404));
    progress.quizScores.push({ moduleIndex, score, total, attemptedAt: new Date() });
    await progress.save();
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(new ErrorResponse('Failed to submit quiz: ' + err.message, 500));
  }
};

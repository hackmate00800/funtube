const Project = require('../models/Project');
const projectReviewService = require('../services/projectReviewService');
const ErrorResponse = require('../utils/errorResponse');

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch projects: ' + err.message, 500));
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new ErrorResponse('Project not found', 404));
    if (project.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch project: ' + err.message, 500));
  }
};

exports.submitProject = async (req, res, next) => {
  try {
    const project = await projectReviewService.submitProject(req.user.id, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(new ErrorResponse('Failed to submit project: ' + err.message, 500));
  }
};

exports.reviewProject = async (req, res, next) => {
  try {
    const project = await projectReviewService.reviewProject(req.params.id);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(new ErrorResponse('Failed to review project: ' + err.message, 500));
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new ErrorResponse('Project not found', 404));
    if (project.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(new ErrorResponse('Failed to delete project: ' + err.message, 500));
  }
};

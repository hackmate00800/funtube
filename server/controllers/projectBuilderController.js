const projectBuilderService = require('../services/projectBuilderService');
const ErrorResponse = require('../utils/errorResponse');

exports.getProjectIdeas = async (req, res, next) => {
  try {
    const ideas = await projectBuilderService.generateProjectIdea(req.user.id);
    res.status(200).json({ success: true, data: ideas });
  } catch (err) {
    next(new ErrorResponse('Failed to generate project ideas: ' + err.message, 500));
  }
};

exports.generateProjectStructure = async (req, res, next) => {
  try {
    const { idea, techStack } = req.body;
    if (!idea) return next(new ErrorResponse('Project idea is required', 400));
    const structure = await projectBuilderService.generateProjectStructure(idea, techStack);
    res.status(200).json({ success: true, data: structure });
  } catch (err) {
    next(new ErrorResponse('Failed to generate project structure: ' + err.message, 500));
  }
};

exports.generateBoilerplate = async (req, res, next) => {
  try {
    const { projectStructure } = req.body;
    if (!projectStructure) return next(new ErrorResponse('Project structure is required', 400));
    const boilerplate = await projectBuilderService.generateBoilerplate(projectStructure);
    res.status(200).json({ success: true, data: boilerplate });
  } catch (err) {
    next(new ErrorResponse('Failed to generate boilerplate: ' + err.message, 500));
  }
};

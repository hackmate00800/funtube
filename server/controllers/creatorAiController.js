const creatorAiService = require('../services/creatorAiService');
const ErrorResponse = require('../utils/errorResponse');

exports.analyzeThumbnail = async (req, res, next) => {
  try {
    const { thumbnailUrl } = req.body;
    if (!thumbnailUrl) return next(new ErrorResponse('Thumbnail URL is required', 400));
    const result = await creatorAiService.analyzeThumbnail(thumbnailUrl);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Thumbnail analysis failed: ' + err.message, 500));
  }
};

exports.optimizeTitle = async (req, res, next) => {
  try {
    const { currentTitle, description, tags } = req.body;
    if (!currentTitle) return next(new ErrorResponse('Current title is required', 400));
    const result = await creatorAiService.optimizeTitle(currentTitle, description, tags);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Title optimization failed: ' + err.message, 500));
  }
};

exports.generateSEO = async (req, res, next) => {
  try {
    const { title, description, tags, category } = req.body;
    if (!title) return next(new ErrorResponse('Title is required', 400));
    const result = await creatorAiService.generateSEOSuggestions(title, description, tags, category);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('SEO generation failed: ' + err.message, 500));
  }
};

exports.predictEngagement = async (req, res, next) => {
  try {
    const { title, description, category, duration } = req.body;
    if (!title) return next(new ErrorResponse('Title is required', 400));
    const result = await creatorAiService.predictEngagement(title, description, category, duration);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Engagement prediction failed: ' + err.message, 500));
  }
};

exports.analyzeRetention = async (req, res, next) => {
  try {
    const result = await creatorAiService.analyzeRetention(req.body.reports);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Retention analysis failed: ' + err.message, 500));
  }
};

exports.generateScript = async (req, res, next) => {
  try {
    const { topic, tone, duration } = req.body;
    if (!topic) return next(new ErrorResponse('Topic is required', 400));
    const result = await creatorAiService.generateScript(topic, tone, duration);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Script generation failed: ' + err.message, 500));
  }
};

exports.analyzeTrends = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) return next(new ErrorResponse('Category is required', 400));
    const result = await creatorAiService.analyzeTrends(category);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Trend analysis failed: ' + err.message, 500));
  }
};

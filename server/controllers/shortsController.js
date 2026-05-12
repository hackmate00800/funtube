const shortsService = require('../services/shortsService');
const ErrorResponse = require('../utils/errorResponse');

exports.detectHighlights = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const highlights = await shortsService.detectHighlights(videoId);
    res.status(200).json({ success: true, data: highlights });
  } catch (err) {
    next(new ErrorResponse('Failed to detect highlights: ' + err.message, 500));
  }
};

exports.generateShort = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { highlight } = req.body;
    if (!highlight) return next(new ErrorResponse('Highlight data is required', 400));
    const short = await shortsService.generateShort(videoId, highlight);
    res.status(200).json({ success: true, data: short });
  } catch (err) {
    next(new ErrorResponse('Failed to generate short: ' + err.message, 500));
  }
};

exports.getUserShorts = async (req, res, next) => {
  try {
    const shorts = await shortsService.getUserShorts(req.user.id);
    res.status(200).json({ success: true, data: shorts });
  } catch (err) {
    next(new ErrorResponse('Failed to get shorts: ' + err.message, 500));
  }
};

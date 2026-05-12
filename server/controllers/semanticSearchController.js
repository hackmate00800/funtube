const semanticSearch = require('../services/semanticSearch');
const ErrorResponse = require('../utils/errorResponse');

exports.indexVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const result = await semanticSearch.indexVideo(videoId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Indexing failed: ' + err.message, 500));
  }
};

exports.search = async (req, res, next) => {
  try {
    const { query, videoId, category, limit } = req.body;
    if (!query) return next(new ErrorResponse('Search query is required', 400));
    const filters = {};
    if (videoId) filters.videoId = videoId;
    if (category) filters.category = category;
    if (limit) filters.limit = limit;
    const result = await semanticSearch.search(query, filters);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Search failed: ' + err.message, 500));
  }
};

exports.getVideoContext = async (req, res, next) => {
  try {
    const { videoId, timestamp } = req.params;
    const context = await semanticSearch.getVideoContext(videoId, parseFloat(timestamp));
    res.status(200).json({ success: true, data: context });
  } catch (err) {
    next(new ErrorResponse('Failed to get video context: ' + err.message, 500));
  }
};

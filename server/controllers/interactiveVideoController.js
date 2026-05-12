const interactiveVideoService = require('../services/interactiveVideoService');
const ErrorResponse = require('../utils/errorResponse');

exports.generateElements = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const elements = await interactiveVideoService.generateInteractiveElements(videoId);
    if (!elements) return next(new ErrorResponse('No transcript found for this video', 404));
    res.status(200).json({ success: true, data: elements });
  } catch (err) {
    next(new ErrorResponse('Interactive element generation failed: ' + err.message, 500));
  }
};

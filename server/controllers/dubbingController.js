const dubbingService = require('../services/dubbingService');
const ErrorResponse = require('../utils/errorResponse');

exports.getLanguages = async (req, res, next) => {
  try {
    const languages = await dubbingService.getSupportedLanguages();
    res.status(200).json({ success: true, data: languages });
  } catch (err) {
    next(new ErrorResponse('Failed to get languages: ' + err.message, 500));
  }
};

exports.getSubtitles = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { language } = req.query;
    const subtitles = await dubbingService.getSubtitles(videoId, language);
    if (!subtitles) return next(new ErrorResponse('Subtitles not found', 404));
    res.status(200).json({ success: true, data: subtitles });
  } catch (err) {
    next(new ErrorResponse('Failed to get subtitles: ' + err.message, 500));
  }
};

exports.generateSubtitles = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { language } = req.body;
    if (!language) return next(new ErrorResponse('Language code is required', 400));
    const subtitles = await dubbingService.generateSubtitles(videoId, language);
    res.status(200).json({ success: true, data: subtitles });
  } catch (err) {
    next(new ErrorResponse('Subtitle generation failed: ' + err.message, 500));
  }
};

exports.generateDubbedAudio = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { language } = req.body;
    const result = await dubbingService.generateDubbedAudio(videoId, language);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('Dubbed audio generation failed: ' + err.message, 500));
  }
};

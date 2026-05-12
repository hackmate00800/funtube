const learningDnaService = require('../services/learningDnaService');
const ErrorResponse = require('../utils/errorResponse');

exports.getDna = async (req, res, next) => {
  try {
    const dna = await learningDnaService.getOrCreateDna(req.user.id);
    res.status(200).json({ success: true, data: dna });
  } catch (err) {
    next(new ErrorResponse('Failed to get learning DNA: ' + err.message, 500));
  }
};

exports.trackInteraction = async (req, res, next) => {
  try {
    const dna = await learningDnaService.trackInteraction(req.user.id, req.body);
    res.status(200).json({ success: true, data: dna });
  } catch (err) {
    next(new ErrorResponse('Failed to track interaction: ' + err.message, 500));
  }
};

exports.analyzeConfusion = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const analysis = await learningDnaService.analyzeConfusion(req.user.id, videoId);
    res.status(200).json({ success: true, data: analysis });
  } catch (err) {
    next(new ErrorResponse('Failed to analyze confusion: ' + err.message, 500));
  }
};

exports.getKnowledgeGraph = async (req, res, next) => {
  try {
    const graph = await learningDnaService.generateKnowledgeGraph(req.user.id);
    res.status(200).json({ success: true, data: graph });
  } catch (err) {
    next(new ErrorResponse('Failed to generate knowledge graph: ' + err.message, 500));
  }
};

exports.assessCareerReadiness = async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const assessment = await learningDnaService.assessCareerReadiness(req.user.id, targetRole);
    res.status(200).json({ success: true, data: assessment });
  } catch (err) {
    next(new ErrorResponse('Failed to assess career readiness: ' + err.message, 500));
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const recs = await learningDnaService.getPersonalizedRecommendations(req.user.id);
    res.status(200).json({ success: true, data: recs });
  } catch (err) {
    next(new ErrorResponse('Failed to get recommendations: ' + err.message, 500));
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');
const LearningDna = require('../models/LearningDna');
const UserProgress = require('../models/UserProgress');
const UsageBehavior = require('../models/UsageBehavior');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

class LearningDnaService {
  async getOrCreateDna(userId) {
    let dna = await LearningDna.findOne({ user: userId });
    if (!dna) {
      dna = await LearningDna.create({ user: userId });
    }
    return dna;
  }

  async trackInteraction(userId, event) {
    const dna = await this.getOrCreateDna(userId);
    const { type, videoId, timestamp, topic } = event;

    if (topic && !dna.nodes.find(n => n.topic === topic)) {
      dna.nodes.push({
        topic,
        confidence: 10,
        timesReviewed: 1,
        lastReviewed: new Date(),
        strength: 'learning',
      });
    }

    if (type === 'rewind' || type === 'pause' || type === 'skip') {
      dna.confusionTriggers.push({
        videoId,
        timestamp,
        type,
        count: 1,
      });
      if (dna.confusionTriggers.length > 100) {
        dna.confusionTriggers = dna.confusionTriggers.slice(-100);
      }
    }

    if (type === 'complete') {
      const node = dna.nodes.find(n => n.topic === topic);
      if (node) {
        node.timesReviewed += 1;
        node.confidence = Math.min(100, node.confidence + 5);
        if (node.confidence >= 80) node.strength = 'mastered';
        else if (node.confidence >= 50) node.strength = 'strong';
        else if (node.confidence >= 20) node.strength = 'learning';
        node.lastReviewed = new Date();
      }
    }

    dna.weakTopics = dna.nodes.filter(n => n.strength === 'weak').map(n => n.topic);
    dna.strongTopics = dna.nodes.filter(n => n.strength === 'mastered' || n.strength === 'strong').map(n => n.topic);

    const weakCount = dna.weakTopics.length;
    const totalCount = dna.nodes.length;
    dna.learningSpeed = totalCount > 0
      ? Math.round(100 - (weakCount / totalCount) * 100)
      : 50;

    dna.lastUpdated = new Date();
    await dna.save();
    return dna;
  }

  async analyzeConfusion(userId, videoId) {
    const dna = await this.getOrCreateDna(userId);
    const videoTriggers = dna.confusionTriggers.filter(t =>
      t.videoId?.toString() === videoId?.toString()
    );

    const rewindCount = videoTriggers.filter(t => t.type === 'rewind').reduce((s, t) => s + t.count, 0);
    const pauseCount = videoTriggers.filter(t => t.type === 'pause').reduce((s, t) => s + t.count, 0);
    const skipCount = videoTriggers.filter(t => t.type === 'skip').reduce((s, t) => s + t.count, 0);

    const confusionLevel = rewindCount > 3 || pauseCount > 5 ? 'high'
      : rewindCount > 1 || pauseCount > 2 ? 'medium' : 'low';

    return {
      confusionLevel,
      rewindCount,
      pauseCount,
      skipCount,
      recommendation: confusionLevel === 'high'
        ? 'Consider rewatching earlier sections or trying a beginner-level explanation.'
        : confusionLevel === 'medium'
          ? 'You seem mildly confused. Try slowing down the playback speed.'
          : 'No significant confusion detected.',
    };
  }

  async generateKnowledgeGraph(userId) {
    const dna = await this.getOrCreateDna(userId);
    const nodes = dna.nodes.map(n => ({
      id: n.topic,
      label: n.topic,
      strength: n.strength,
      confidence: n.confidence,
    }));

    const edges = [];
    for (const node of dna.nodes) {
      for (const related of node.relatedTopics || []) {
        if (dna.nodes.find(n => n.topic === related)) {
          edges.push({ source: node.topic, target: related, weight: 1 });
        }
      }
    }

    return { nodes, edges };
  }

  async assessCareerReadiness(userId, targetRole) {
    const dna = await this.getOrCreateDna(userId);
    const progress = await UserProgress.find({ user: userId }).populate('path', 'skillsGained title');

    const relevantPaths = progress.filter(p => {
      const path = p.path;
      return path?.skillsGained?.some(s =>
        s.toLowerCase().includes((targetRole || '').toLowerCase())
      );
    });

    const completedModules = relevantPaths.reduce((s, p) => s + p.completedModules.length, 0);
    const totalModules = relevantPaths.reduce((s, p) => s + (p.path?.modules?.length || 0), 0);

    const conceptScore = dna.strongTopics.length > 0
      ? Math.round((dna.strongTopics.length / Math.max(dna.nodes.length, 1)) * 100)
      : 0;

    const readinessScore = Math.round((conceptScore * 0.6) + ((completedModules / Math.max(totalModules, 1)) * 100 * 0.4));

    const gaps = [];
    if (conceptScore < 40) gaps.push('Build stronger foundational knowledge');
    if (completedModules < 3) gaps.push('Complete more learning paths');
    if (!dna.strongTopics.includes('problem-solving')) gaps.push('Practice problem-solving skills');

    return {
      readinessScore,
      conceptScore,
      completedModules,
      totalModules,
      strongAreas: dna.strongTopics,
      weakAreas: dna.weakTopics,
      gaps,
      recommendedNext: gaps.slice(0, 3),
      targetRole: targetRole || 'Not specified',
    };
  }

  async getPersonalizedRecommendations(userId) {
    const dna = await this.getOrCreateDna(userId);

    const recs = [];

    if (dna.weakTopics.length > 0) {
      recs.push({
        type: 'weakness',
        title: 'Strengthen weak areas',
        description: `Focus on these topics: ${dna.weakTopics.slice(0, 3).join(', ')}`,
        priority: 1,
      });
    }

    if (dna.focusPattern.distractionProne) {
      recs.push({
        type: 'focus',
        title: 'Enable Focus Mode',
        description: 'You tend to get distracted. Focus Mode can help you stay on track.',
        action: '/focus',
        priority: 2,
      });
    }

    const bestHour = dna.focusPattern.bestHours[0];
    if (bestHour != null) {
      recs.push({
        type: 'timing',
        title: `Peak learning time: ${bestHour}:00`,
        description: 'Schedule your most important learning during this hour.',
        priority: 3,
      });
    }

    if (dna.learningSpeed < 40) {
      recs.push({
        type: 'pace',
        title: 'Try shorter sessions',
        description: 'Your learning speed suggests shorter, more focused sessions may help.',
        action: '/focus',
        priority: 4,
      });
    }

    recs.push({
      type: 'insight',
      title: 'Learning snapshot',
      description: `You've explored ${dna.nodes.length} topics with ${dna.strongTopics.length} mastered. Keep going!`,
      priority: 5,
    });

    return recs.sort((a, b) => a.priority - b.priority);
  }
}

module.exports = new LearningDnaService();

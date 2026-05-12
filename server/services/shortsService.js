const { GoogleGenerativeAI } = require('@google/generative-ai');
const Short = require('../models/Short');
const Summary = require('../models/Summary');
const Video = require('../models/Video');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

class ShortsService {
  async detectHighlights(videoId) {
    try {
      const summary = await Summary.findOne({ video: videoId });
      const video = await Video.findById(videoId);
      if (!summary?.transcript) throw new Error('No transcript available');

      if (!genAI) return this.fallbackHighlights(summary.transcript, video);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Analyze this video transcript and identify 3-5 highlight moments perfect for short-form content (TikTok/Reels/Shorts). Each highlight should be 15-60 seconds long, contain a complete thought, and be engaging standalone content.

Transcript: ${summary.transcript.slice(0, 8000)}

Return JSON: { highlights: [{ startTime (seconds), endTime (seconds), title, reason, engagementPotential (0-100) }] }` }],
        }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are a content creator expert who identifies viral-worthy moments in videos.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error('Highlight detection failed:', err);
      const video = await Video.findById(videoId);
      return this.fallbackHighlights(null, video);
    }
  }

  fallbackHighlights(transcript, video) {
    const duration = video?.duration || 600;
    const segments = [
      { startTime: 0, endTime: Math.min(30, duration), title: 'Introduction', reason: 'Opening hook of the video', engagementPotential: 75 },
      { startTime: Math.floor(duration * 0.3), endTime: Math.floor(duration * 0.3) + 30, title: 'Key Concept', reason: 'Main concept explanation', engagementPotential: 80 },
      { startTime: Math.floor(duration * 0.6), endTime: Math.floor(duration * 0.6) + 30, title: 'Practical Example', reason: 'Real-world application', engagementPotential: 85 },
    ];
    return { highlights: segments.filter(s => s.endTime <= duration) };
  }

  async generateShort(videoId, highlight) {
    try {
      const short = await Short.create({
        video: videoId,
        startTime: highlight.startTime,
        endTime: highlight.endTime,
        duration: highlight.endTime - highlight.startTime,
        title: highlight.title,
        status: 'processing',
      });

      if (!genAI) {
        short.captionText = highlight.title + ' - Check out the full video!';
        short.metadata.highlights = [{ text: highlight.title, score: highlight.engagementPotential }];
        short.status = 'completed';
        await short.save();
        return short;
      }

      const summary = await Summary.findOne({ video: videoId });
      const context = summary?.transcript ? summary.transcript.slice(highlight.startTime * 2, highlight.endTime * 2) : '';

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Generate short-form video content for a ${highlight.endTime - highlight.startTime} second clip. Context: ${context || highlight.title}. Return JSON: { caption, hashtags[], callToAction, suggestedVisualStyle }` }],
        }],
      });
      const text = result.response.text();
      const content = JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());

      short.captionText = content.caption || highlight.title;
      short.metadata.highlights = [{ text: highlight.title, score: highlight.engagementPotential }];
      short.status = 'completed';
      await short.save();
      return short;
    } catch (err) {
      logger.error('Short generation failed:', err);
      const short = await Short.findOne({ video: videoId, startTime: highlight.startTime });
      if (short) {
        short.status = 'failed';
        await short.save();
      }
      throw err;
    }
  }

  async getUserShorts(userId) {
    return Short.find({ user: userId }).sort({ createdAt: -1 });
  }
}

module.exports = new ShortsService();

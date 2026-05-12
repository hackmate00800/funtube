const { GoogleGenerativeAI } = require('@google/generative-ai');
const Summary = require('../models/Summary');
const Video = require('../models/Video');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

class InteractiveVideoService {
  async generateInteractiveElements(videoId) {
    try {
      const summary = await Summary.findOne({ video: videoId }).populate('video', 'title duration category');
      if (!summary?.transcript) return null;

      const { transcript, duration, video } = summary;
      const prompt = `Analyze this video transcript and generate interactive learning elements.

Transcript: ${transcript.slice(0, 8000)}
Duration: ${Math.floor((duration || 600) / 60)} minutes

For each interactive element, provide:
- type: "quiz" | "flashcard" | "code_checkpoint" | "expandable" | "practice"
- timestamp (seconds): when it should appear
- content: the question/code/task
- answer/hint
- difficulty: "easy" | "medium" | "hard"

Return JSON: { elements: [{ type, timestamp, content, answer?, hint?, difficulty, options? }] }
Generate 3-8 elements depending on content density.`;

      if (!genAI) return this.fallbackElements(duration, video);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are an instructional designer creating interactive learning elements for video content.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error('Interactive elements generation failed:', err);
      return null;
    }
  }

  fallbackElements(duration, video) {
    const third = Math.floor((duration || 600) / 3);
    return {
      elements: [
        { type: 'quiz', timestamp: third, content: 'What was the main concept introduced?', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0, difficulty: 'easy' },
        { type: 'flashcard', timestamp: third * 2, content: 'Review: Key terminology', answer: 'Check the earlier section of the video', difficulty: 'medium' },
        { type: 'practice', timestamp: third * 2 + 30, content: 'Try applying the concept yourself', hint: 'Start with the basic example shown', difficulty: 'medium' },
      ],
    };
  }
}

module.exports = new InteractiveVideoService();

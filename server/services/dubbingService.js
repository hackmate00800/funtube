const { GoogleGenerativeAI } = require('@google/generative-ai');
const Subtitle = require('../models/Subtitle');
const Summary = require('../models/Summary');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const SUPPORTED_LANGUAGES = {
  es: { name: 'Spanish', native: 'Español' },
  fr: { name: 'French', native: 'Français' },
  de: { name: 'German', native: 'Deutsch' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  ja: { name: 'Japanese', native: '日本語' },
  ko: { name: 'Korean', native: '한국어' },
  pt: { name: 'Portuguese', native: 'Português' },
  ru: { name: 'Russian', native: 'Русский' },
  ar: { name: 'Arabic', native: 'العربية' },
  zh: { name: 'Chinese', native: '中文' },
  en: { name: 'English', native: 'English' },
};

class DubbingService {
  async getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  async getSubtitles(videoId, language) {
    return Subtitle.findOne({ video: videoId, language: language || 'en' });
  }

  async generateSubtitles(videoId, targetLang) {
    try {
      const summary = await Summary.findOne({ video: videoId });
      if (!summary?.transcript) throw new Error('No transcript available');

      let subtitles = await Subtitle.findOne({ video: videoId, language: targetLang });
      if (subtitles) return subtitles;

      subtitles = await Subtitle.create({
        video: videoId,
        language: targetLang,
        label: SUPPORTED_LANGUAGES[targetLang]?.name || targetLang,
        status: 'processing',
      });

      const segments = this.parseTranscriptIntoSegments(summary.transcript);

      if (targetLang === 'en' || !genAI) {
        subtitles.segments = segments.map((s, i) => ({
          id: i, start: s.start, end: s.end, text: s.text, translatedText: s.text,
        }));
        subtitles.status = 'completed';
        subtitles.progress = 100;
        await subtitles.save();
        return subtitles;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const batchSize = 10;
      const translatedSegments = [];

      for (let i = 0; i < segments.length; i += batchSize) {
        const batch = segments.slice(i, i + batchSize);
        const texts = batch.map(s => s.text).join('\n---\n');

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: `Translate these video transcript segments to ${SUPPORTED_LANGUAGES[targetLang]?.name || targetLang}. Keep the same number of segments. Return JSON array: [{original, translated}].\n\n${texts}` }],
          }],
          systemInstruction: {
            role: 'user',
            parts: [{ text: 'You are a professional translator. Translate accurately and naturally. Preserve code snippets and technical terms.' }],
          },
        });

        const text = result.response.text();
        const translations = JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());

        batch.forEach((seg, j) => {
          translatedSegments.push({
            id: i + j,
            start: seg.start,
            end: seg.end,
            text: seg.text,
            translatedText: translations[j]?.translated || seg.text,
          });
        });

        subtitles.progress = Math.round(((i + batchSize) / segments.length) * 100);
        await subtitles.save();
      }

      subtitles.segments = translatedSegments;
      subtitles.status = 'completed';
      subtitles.progress = 100;
      await subtitles.save();
      return subtitles;
    } catch (err) {
      logger.error('Subtitle generation failed:', err);
      const subtitles = await Subtitle.findOne({ video: videoId, language: targetLang });
      if (subtitles) {
        subtitles.status = 'failed';
        await subtitles.save();
      }
      throw err;
    }
  }

  parseTranscriptIntoSegments(transcript) {
    const lines = transcript.split('\n').filter(l => l.trim());
    const segments = [];

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2}):(\d{2})\]\s*(.+)/);
      if (match) {
        const secs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
        segments.push({ start: secs, end: secs + 5, text: match[4] });
      } else if (segments.length > 0) {
        segments[segments.length - 1].text += ' ' + line;
      }
    }

    return segments.length > 0 ? segments : [{ start: 0, end: 5, text: transcript.slice(0, 500) }];
  }

  async generateDubbedAudio(videoId, language) {
    return { videoId, language, url: null, status: 'unavailable', message: 'AI dubbing requires audio processing pipeline setup' };
  }
}

module.exports = new DubbingService();

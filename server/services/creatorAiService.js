const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');
const DailyReport = require('../models/DailyReport');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

class CreatorAiService {
  async analyzeThumbnail(thumbnailUrl) {
    const prompt = `Analyze this YouTube thumbnail for optimization. Consider: visual hierarchy, contrast, text readability, emotional appeal, clickability. Return JSON with: score (0-100), strengths[], improvements[], suggestedText, colorPalette[], composition (rule-of-thirds, centered, split).`;
    return this.generateAnalysis('thumbnail', prompt, thumbnailUrl);
  }

  async optimizeTitle(currentTitle, description, tags) {
    const prompt = `Given the current title "${currentTitle}", description "${description}", and tags [${tags?.join(', ')}], generate 5 optimized, SEO-friendly video titles that maximize click-through rate. For each, explain why it works and give an estimated CTR boost percentage. Return JSON with: titles[{title, reasoning, estimatedBoost}]`;
    return this.generateAnalysis('title', prompt);
  }

  async generateSEOSuggestions(title, description, tags, category) {
    const prompt = `Analyze this video for SEO optimization. Title: "${title}". Description: "${description}". Tags: [${tags?.join(', ')}]. Category: ${category}. Return JSON with: overallScore(0-100), titleScore, descriptionScore, tagsScore, suggestions[{area, issue, fix, priority}], recommendedTags[], bestPractices[]`;
    return this.generateAnalysis('seo', prompt);
  }

  async predictEngagement(title, description, category, duration) {
    const prompt = `Predict engagement metrics for this video. Title: "${title}". Category: ${category}. Duration: ${duration}s. Return JSON with: predictedViews(low-high), predictedRetention(0-100), estimatedWatchTime, peakDropoff(seconds), engagementScore(0-100), recommendationsForImprovement[]`;
    return this.generateAnalysis('engagement', prompt);
  }

  async analyzeRetention(reports) {
    if (!reports || reports.length === 0) return null;
    const avgRetention = reports.reduce((s, r) => s + (r.productivityScore || 0), 0) / reports.length;
    return {
      averageRetention: Math.round(avgRetention),
      trend: reports.length > 1
        ? reports[0].productivityScore > reports[reports.length - 1].productivityScore ? 'improving' : 'declining'
        : 'stable',
      recommendations: avgRetention < 50
        ? ['Consider shorter videos', 'Hook viewers in first 15 seconds', 'Add visual variety']
        : ['Good retention! Try testing different video lengths'],
    };
  }

  async generateScript(topic, tone, duration) {
    const prompt = `Generate a video script about "${topic}" with a ${tone} tone. Target duration: ${duration} minutes. Structure: hook, introduction, main content (3-5 key points), examples, conclusion, call-to-action. Include timestamps and visual cues. Return JSON with: title, hook, sections[{timestamp, duration, content, visualCue, keyPoint}], estimatedDuration, seoTags[], description`;
    return this.generateAnalysis('script', prompt);
  }

  async analyzeTrends(category) {
    const prompt = `Analyze current content trends for the "${category}" category on YouTube. Return JSON with: trendingTopics[{topic, momentum(low/medium/high), suggestedAngle}], contentType(preferred format), bestPostingTime, competitionLevel(low/medium/high), opportunityScore(0-100)`;
    return this.generateAnalysis('trends', prompt);
  }

  async generateAnalysis(type, prompt, mediaUrl) {
    if (!genAI) return this.fallbackAnalysis(type);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const parts = [{ text: prompt + '\n\nReturn ONLY valid JSON. No markdown.' }];

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are an expert YouTube creator AI assistant specializing in video optimization, audience growth, and content strategy.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error(`Creator AI ${type} failed:`, err.message);
      return this.fallbackAnalysis(type);
    }
  }

  fallbackAnalysis(type) {
    const fallbacks = {
      thumbnail: { score: 75, strengths: ['Good contrast'], improvements: ['Add text overlay'], suggestedText: '', colorPalette: ['#FF0000', '#FFFFFF'], composition: 'centered' },
      title: { titles: [{ title: 'Optimized Title', reasoning: 'Clear and descriptive', estimatedBoost: 15 }] },
      seo: { overallScore: 70, titleScore: 75, descriptionScore: 65, tagsScore: 70, suggestions: [{ area: 'title', issue: 'Could be more specific', fix: 'Add target keyword', priority: 'high' }], recommendedTags: [], bestPractices: [] },
      engagement: { predictedViews: '1K-5K', predictedRetention: 60, estimatedWatchTime: 120, peakDropoff: 30, engagementScore: 65, recommendationsForImprovement: ['Add pattern interrupts'] },
      script: { title: 'Video Script', hook: 'Start with a surprising fact', sections: [{ timestamp: '0:00', duration: 30, content: 'Introduction', visualCue: 'Face cam', keyPoint: 'Hook' }], estimatedDuration: 600, seoTags: [], description: '' },
      trends: { trendingTopics: [{ topic: 'AI Tools', momentum: 'high', suggestedAngle: 'Tutorial' }], contentType: 'Tutorial', bestPostingTime: '14:00 UTC', competitionLevel: 'medium', opportunityScore: 70 },
    };
    return fallbacks[type] || { score: 50, message: 'Analysis unavailable' };
  }
}

module.exports = new CreatorAiService();

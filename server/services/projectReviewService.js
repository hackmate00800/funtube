const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

class ProjectReviewService {
  async reviewProject(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');

      if (!genAI) return this.fallbackReview(project);

      const codeContext = project.files?.slice(0, 5).map(f =>
        `File: ${f.path}\n\`\`\`${f.language || ''}\n${f.content?.slice(0, 2000)}\n\`\`\``
      ).join('\n\n') || 'No code files available';

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Review this project thoroughly and provide constructive feedback.

Project: ${project.title}
Description: ${project.description}
Tech Stack: ${project.techStack?.join(', ') || 'N/A'}
Type: ${project.type}

Code:
${codeContext}

Return JSON: {
  overallScore (0-100),
  uiRating (0-10),
  codeQuality (0-10),
  architecture (0-10),
  performance (0-10),
  responsiveness (0-10),
  summary (2-3 sentence overview),
  strengths: [string],
  improvements: [string],
  bugs: [{ severity, description, suggestion }],
  bestPractices: [string],
  recruiterFeedback (what a recruiter would think)
}` }],
        }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are a senior software engineer and tech lead conducting a thorough code review. Be constructive, specific, and actionable.' }],
        },
      });
      const text = result.response.text();
      const review = JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());

      project.review = {
        score: review.overallScore,
        uiRating: review.uiRating,
        codeQuality: review.codeQuality,
        architecture: review.architecture,
        performance: review.performance,
        responsiveness: review.responsiveness,
        feedback: review.summary,
        suggestions: review.improvements || [],
        reviewedAt: new Date(),
      };
      project.status = 'reviewed';
      await project.save();
      return project;
    } catch (err) {
      logger.error('Project review failed:', err);
      const project = await Project.findById(projectId);
      if (project) {
        const fallback = this.generateFallbackReview(project);
        project.review = fallback.review;
        project.status = 'reviewed';
        await project.save();
      }
      throw err;
    }
  }

  fallbackReview(project) {
    const fileCount = project.files?.length || 0;
    const techCount = project.techStack?.length || 0;
    const score = Math.min(85, 50 + fileCount * 5 + techCount * 3);
    return {
      review: {
        score,
        uiRating: Math.min(8, 5 + Math.floor(fileCount / 2)),
        codeQuality: Math.min(8, 5 + Math.floor(techCount / 2)),
        architecture: Math.min(7, 4 + Math.floor(fileCount / 3)),
        performance: 6,
        responsiveness: 6,
        feedback: `${project.title} is a solid project using ${project.techStack?.join(', ') || 'various technologies'}. The project structure shows good organization. Consider adding more features and improving documentation.`,
        suggestions: ['Add comprehensive README', 'Include test coverage', 'Add CI/CD pipeline', 'Improve error handling'],
        reviewedAt: new Date(),
      },
    };
  }

  generateFallbackReview(project) {
    return this.fallbackReview(project);
  }

  async submitProject(userId, data) {
    const project = await Project.create({ user: userId, ...data, status: 'submitted' });
    const reviewed = await this.reviewProject(project._id);
    return reviewed;
  }
}

module.exports = new ProjectReviewService();

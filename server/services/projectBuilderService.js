const { GoogleGenerativeAI } = require('@google/generative-ai');
const LearningDna = require('../models/LearningDna');
const UserProgress = require('../models/UserProgress');
const logger = require('../utils/logger');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const PROJECT_TEMPLATES = {
  mern: {
    name: 'MERN Stack',
    folders: ['client/', 'server/', 'shared/'],
    files: ['client/src/App.jsx', 'server/index.js', 'server/models/', 'server/routes/', '.env.example'],
  },
  dsa: {
    name: 'Data Structures & Algorithms',
    folders: ['src/', 'tests/', 'problems/'],
    files: ['src/index.js', 'src/sorting/', 'src/searching/', 'src/data-structures/', 'README.md'],
  },
  frontend: {
    name: 'Frontend App',
    folders: ['src/components/', 'src/pages/', 'src/hooks/', 'src/styles/', 'public/'],
    files: ['src/App.jsx', 'src/index.js', 'package.json', 'tailwind.config.js'],
  },
  backend: {
    name: 'Backend API',
    folders: ['src/routes/', 'src/controllers/', 'src/models/', 'src/middleware/', 'src/utils/'],
    files: ['src/index.js', 'package.json', '.env.example'],
  },
  mobile: {
    name: 'Mobile App',
    folders: ['app/', 'screens/', 'components/', 'navigation/', 'services/'],
    files: ['App.js', 'package.json', 'app.json', 'babel.config.js'],
  },
};

class ProjectBuilderService {
  async generateProjectIdea(userId) {
    const dna = await LearningDna.findOne({ user: userId });
    const strongTopics = dna?.strongTopics || [];
    const weakTopics = dna?.weakTopics || [];

    if (!genAI) return this.fallbackIdeas(strongTopics, weakTopics);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Generate 5 project ideas for a developer who knows: ${strongTopics.join(', ')} and is learning: ${weakTopics.join(', ')}. Return JSON: { ideas: [{ title, description, difficulty, techStack[], conceptsUsed[], estimatedHours }] }` }],
        }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are a project-based learning expert. Generate practical, portfolio-worthy project ideas that reinforce learning.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error('Project idea generation failed:', err);
      return this.fallbackIdeas(strongTopics, weakTopics);
    }
  }

  fallbackIdeas(strongTopics, weakTopics) {
    return {
      ideas: [
        { title: 'Task Management App', description: 'Build a full-stack task manager with authentication, CRUD operations, and real-time updates.', difficulty: 'intermediate', techStack: ['MongoDB', 'Express', 'React', 'Node.js'], conceptsUsed: ['CRUD', 'Auth', 'Real-time'], estimatedHours: 20 },
        { title: 'Portfolio Website', description: 'Create a personal portfolio showcasing your projects and skills.', difficulty: 'beginner', techStack: ['React', 'Tailwind CSS'], conceptsUsed: ['Components', 'Routing', 'Styling'], estimatedHours: 10 },
        { title: 'REST API Service', description: 'Design and implement a RESTful API for a blog platform.', difficulty: 'intermediate', techStack: ['Node.js', 'Express', 'MongoDB'], conceptsUsed: ['API Design', 'Database', 'Auth'], estimatedHours: 15 },
      ],
    };
  }

  async generateProjectStructure(idea, techStack) {
    const templateKey = techStack?.find(t => PROJECT_TEMPLATES[t.toLowerCase()])?.toLowerCase() || 'mern';
    const template = PROJECT_TEMPLATES[templateKey] || PROJECT_TEMPLATES.mern;

    if (!genAI) return this.fallbackStructure(idea, template);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Generate a detailed project structure for: "${idea}". Tech stack: ${techStack?.join(', ') || 'MERN'}. Return JSON: { projectName, description, architecture, folders: [{ path, purpose }], files: [{ path, description, estimatedLines }], dependencies: [], setup }` }],
        }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are a software architect. Generate production-ready project structures following best practices.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error('Project structure generation failed:', err);
      return this.fallbackStructure(idea, template);
    }
  }

  fallbackStructure(idea, template) {
    return {
      projectName: idea?.replace(/\s+/g, '-').toLowerCase() || 'my-project',
      description: `A project for ${idea}`,
      architecture: 'Standard project architecture following best practices',
      folders: template.folders.map(f => ({ path: f, purpose: `${f} directory` })),
      files: template.files.map(f => ({ path: f, description: `${f} file`, estimatedLines: 50 })),
      dependencies: ['express', 'mongoose', 'dotenv', 'cors'],
      setup: '1. Clone repo\n2. npm install\n3. Set up .env\n4. npm run dev',
    };
  }

  async generateBoilerplate(projectStructure) {
    if (!genAI) return this.fallbackBoilerplate(projectStructure);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Generate starter boilerplate code for this project: ${JSON.stringify(projectStructure)}. Return JSON: { files: [{ path, content }], setupInstructions }` }],
        }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: 'You are a code generator. Generate clean, production-ready boilerplate code following best practices.' }],
        },
      });
      const text = result.response.text();
      return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
    } catch (err) {
      logger.error('Boilerplate generation failed:', err);
      return this.fallbackBoilerplate(projectStructure);
    }
  }

  fallbackBoilerplate(structure) {
    return {
      files: [
        { path: 'package.json', content: JSON.stringify({ name: structure.projectName, version: '1.0.0', scripts: { start: 'node index.js', dev: 'nodemon index.js' }, dependencies: { express: '^4.18.0' } }, null, 2) },
        { path: '.env.example', content: 'PORT=5000\nMONGODB_URI=mongodb://localhost:27017/myapp\nJWT_SECRET=your-secret-key' },
      ],
      setupInstructions: '1. Copy .env.example to .env\n2. npm install\n3. npm run dev',
    };
  }
}

module.exports = new ProjectBuilderService();

const mongoose = require('mongoose');

const codeFileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
}, { _id: true });

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
  language: { type: String, default: 'javascript' },
  starterCode: { type: String, default: '' },
  solution: { type: String, default: '' },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false },
  }],
  aiGenerated: { type: Boolean, default: false },
  tags: [String],
  points: { type: Number, default: 10 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled Project' },
  language: { type: String, default: 'javascript' },
  files: [codeFileSchema],
  collaboratedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  isPublic: { type: Boolean, default: false },
  lastEdited: { type: Date, default: Date.now },
}, { timestamps: true });

projectSchema.index({ user: 1, updatedAt: -1 });

const CodeProject = mongoose.model('CodeProject', projectSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = { CodeProject, Challenge };

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  sourceRepo: { type: String },
  liveUrl: { type: String },
  techStack: [{ type: String }],
  type: { type: String, enum: ['web', 'mobile', 'api', 'cli', 'library', 'other'], default: 'web' },
  files: [{
    path: String,
    content: String,
    language: String,
  }],
  review: {
    score: { type: Number, min: 0, max: 100 },
    uiRating: { type: Number, min: 0, max: 10 },
    codeQuality: { type: Number, min: 0, max: 10 },
    architecture: { type: Number, min: 0, max: 10 },
    performance: { type: Number, min: 0, max: 10 },
    responsiveness: { type: Number, min: 0, max: 10 },
    feedback: { type: String },
    suggestions: [{ type: String }],
    reviewedAt: Date,
  },
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' },
  source: { type: String, enum: ['upload', 'ai-generated', 'github'], default: 'upload' },
}, { timestamps: true });

ProjectSchema.index({ user: 1 });
ProjectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', ProjectSchema);

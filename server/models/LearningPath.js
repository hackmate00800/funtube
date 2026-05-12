const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  order: { type: Number },
  estimatedMinutes: { type: Number },
  resources: [{ title: String, url: String }],
  quizzes: [{ question: String, options: [String], correctAnswer: Number }],
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number },
  steps: [StepSchema],
  icon: { type: String },
  color: { type: String },
}, { _id: false });

const LearningPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String },
  category: { type: String, enum: ['mern', 'dsa', 'android', 'ai-ml', 'devops', 'frontend', 'backend', 'mobile', 'other'] },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  icon: { type: String },
  color: { type: String },
  modules: [ModuleSchema],
  totalSteps: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
  skillsGained: [{ type: String }],
  prerequisites: [{ type: String }],
  certificateAvailable: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, default: 0 },
  enrolledCount: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

LearningPathSchema.index({ slug: 1 });
LearningPathSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('LearningPath', LearningPathSchema);

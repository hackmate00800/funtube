const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  path: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  completedModules: [{ moduleIndex: Number, completedAt: Date }],
  completedSteps: [{
    moduleIndex: Number,
    stepIndex: Number,
    completedAt: { type: Date, default: Date.now },
    timeSpent: Number,
    score: Number,
  }],
  currentModule: { type: Number, default: 0 },
  currentStep: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  certificateEarned: { type: Boolean, default: false },
  certificateUrl: String,
  quizScores: [{ moduleIndex: Number, score: Number, total: Number, attemptedAt: Date }],
  totalTimeSpent: { type: Number, default: 0 },
}, { timestamps: true });

UserProgressSchema.index({ user: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);

const mongoose = require('mongoose');

const DnaNodeSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  confidence: { type: Number, default: 0, min: 0, max: 100 },
  timesReviewed: { type: Number, default: 0 },
  lastReviewed: Date,
  strength: { type: String, enum: ['weak', 'learning', 'strong', 'mastered'], default: 'weak' },
  relatedTopics: [{ type: String }],
}, { _id: false });

const LearningDnaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  nodes: [DnaNodeSchema],
  learningSpeed: { type: Number, default: 50, min: 0, max: 100 },
  preferredContentType: {
    type: String,
    enum: ['video', 'reading', 'interactive', 'code', 'mixed'],
    default: 'mixed',
  },
  focusPattern: {
    bestHours: [{ type: Number }],
    avgSessionLength: { type: Number, default: 25 },
    distractionProne: { type: Boolean, default: false },
  },
  weakTopics: [{ type: String }],
  strongTopics: [{ type: String }],
  recommendedDifficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  confusionTriggers: [{
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    timestamp: Number,
    type: { type: String, enum: ['rewind', 'pause', 'skip', 'replay'] },
    count: Number,
  }],
  careerGoals: [{
    role: String,
    interested: { type: Boolean, default: true },
    readinessScore: { type: Number, default: 0 },
  }],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LearningDna', LearningDnaSchema);

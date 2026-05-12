const mongoose = require('mongoose');

const summaryLevelSchema = new mongoose.Schema({
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'], required: true },
  shortSummary: { type: String },
  detailedSummary: { type: String },
  bulletPoints: [{ type: String }],
  timestamps: [{
    time: { type: Number },
    label: { type: String },
    description: { type: String },
  }],
  faqs: [{
    question: { type: String },
    answer: { type: String },
  }],
  revisionNotes: [{ type: String }],
}, { _id: false });

const SummarySchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcript: { type: String },
  transcriptStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  summaryStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  levels: [summaryLevelSchema],
  duration: { type: Number },
  language: { type: String, default: 'en' },
  cached: { type: Boolean, default: false },
  cachedAt: { type: Date },
  error: { type: String },
}, { timestamps: true });

SummarySchema.index({ video: 1 });
SummarySchema.index({ user: 1 });

module.exports = mongoose.model('Summary', SummarySchema);

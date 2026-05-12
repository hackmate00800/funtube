const mongoose = require('mongoose');

const ShortSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  duration: { type: Number },
  captionText: { type: String },
  thumbnail: { type: String },
  videoUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    highlights: [{ text: String, score: Number }],
    captionStyle: { type: String, default: 'modern' },
    musicTrack: { type: String },
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
}, { timestamps: true });

ShortSchema.index({ video: 1 });
ShortSchema.index({ user: 1 });

module.exports = mongoose.model('Short', ShortSchema);

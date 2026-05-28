const mongoose = require('mongoose');

const DriveVideoSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    default: '',
  },
  driveFileId: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    default: 'video/mp4',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ['movie', 'web-series', 'episode', 'short', 'other'],
    default: 'other',
  },
  seriesName: {
    type: String,
    trim: true,
    default: '',
  },
  episodeNumber: {
    type: Number,
    default: 0,
  },
  access: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'unlisted',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

DriveVideoSchema.index({ uploader: 1, createdAt: -1 });
DriveVideoSchema.index({ driveFileId: 1 });

module.exports = mongoose.model('DriveVideo', DriveVideoSchema);

const mongoose = require('mongoose');

const UploadSessionSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: 'video/mp4',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'other',
  },
  seriesName: {
    type: String,
    default: '',
  },
  episodeNumber: {
    type: Number,
    default: 0,
  },
  access: {
    type: String,
    default: 'unlisted',
  },
  status: {
    type: String,
    enum: ['pending', 'uploading', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

module.exports = mongoose.model('UploadSession', UploadSessionSchema);

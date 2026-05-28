const mongoose = require('mongoose');

const DriveAnalyticsSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriveVideo',
    required: true,
  },
  inviteLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InviteLink',
    default: null,
  },
  viewerIP: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  watchDuration: {
    type: Number,
    default: 0,
  },
  bytesStreamed: {
    type: Number,
    default: 0,
  },
  country: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

DriveAnalyticsSchema.index({ video: 1, createdAt: -1 });
DriveAnalyticsSchema.index({ inviteLink: 1 });

module.exports = mongoose.model('DriveAnalytics', DriveAnalyticsSchema);

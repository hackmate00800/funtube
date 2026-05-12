const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    uniqueViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    watchTime: {
      type: Number,
      default: 0,
    },
    averageWatchDuration: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
    dailyStats: [
      {
        date: { type: Date },
        views: { type: Number, default: 0 },
        watchTime: { type: Number, default: 0 },
      },
    ],
    revenue: {
      type: Number,
      default: 0,
    },
    estimatedRevenue: {
      type: Number,
      default: 0,
    },
    cpm: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

AnalyticsSchema.index({ video: 1 });
AnalyticsSchema.index({ user: 1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);

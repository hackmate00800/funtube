const mongoose = require('mongoose');

const UsageBehaviorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  sessionStart: {
    type: Date,
    default: Date.now,
  },
  sessionEnd: Date,
  duration: {
    type: Number,
    default: 0,
  },
  events: [{
    type: { type: String, enum: ['scroll', 'page_view', 'video_watch', 'click', 'focus_enter', 'focus_exit', 'search'] },
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed,
  }],
  scrollCount: { type: Number, default: 0 },
  scrollDistance: { type: Number, default: 0 },
  pagesVisited: { type: Number, default: 0 },
  videosWatched: { type: Number, default: 0 },
  focusTime: { type: Number, default: 0 },
  doomscrollScore: { type: Number, default: 0, min: 0, max: 100 },
  isDoomscrolling: { type: Boolean, default: false },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop',
  },
}, { timestamps: true });

UsageBehaviorSchema.index({ user: 1, sessionStart: -1 });
UsageBehaviorSchema.index({ user: 1, 'events.timestamp': -1 });

module.exports = mongoose.model('UsageBehavior', UsageBehaviorSchema);

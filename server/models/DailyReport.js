const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  totalTime: { type: Number, default: 0 },
  focusTime: { type: Number, default: 0 },
  doomscrollTime: { type: Number, default: 0 },
  scrollCount: { type: Number, default: 0 },
  pagesVisited: { type: Number, default: 0 },
  videosWatched: { type: Number, default: 0 },
  sessionsCompleted: { type: Number, default: 0 },
  avgDoomscrollScore: { type: Number, default: 0 },
  peakDoomscrollScore: { type: Number, default: 0 },
  hourlyBreakdown: [{
    hour: Number,
    activity: { type: Number, default: 0 },
    doomscore: { type: Number, default: 0 },
  }],
  categoryBreakdown: [{
    category: String,
    time: { type: Number, default: 0 },
    visits: { type: Number, default: 0 },
  }],
  alertsTriggered: { type: Number, default: 0 },
  recommendationsFollowed: { type: Number, default: 0 },
  productivityScore: { type: Number, default: 50, min: 0, max: 100 },
  streakDay: { type: Number, default: 0 },
  goals: {
    timeLimit: { type: Number, default: 120 },
    timeUsed: { type: Number, default: 0 },
    goalMet: { type: Boolean, default: false },
  },
}, { timestamps: true });

DailyReportSchema.index({ user: 1, date: -1 });
DailyReportSchema.index({ user: 1 });

module.exports = mongoose.model('DailyReport', DailyReportSchema);

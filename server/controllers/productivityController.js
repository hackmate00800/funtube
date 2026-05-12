const UsageBehavior = require('../models/UsageBehavior');
const DailyReport = require('../models/DailyReport');
const ErrorResponse = require('../utils/errorResponse');

exports.trackEvent = async (req, res, next) => {
  try {
    const { sessionId, event } = req.body;
    if (!sessionId || !event) {
      return next(new ErrorResponse('sessionId and event are required', 400));
    }

    let session = await UsageBehavior.findOne({ sessionId, user: req.user._id });
    if (!session) {
      session = await UsageBehavior.create({
        user: req.user._id,
        sessionId,
        device: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      });
    }

    session.events.push({ ...event, timestamp: new Date() });

    if (event.type === 'scroll') {
      session.scrollCount += 1;
      session.scrollDistance += event.data?.distance || 0;
    } else if (event.type === 'page_view') {
      session.pagesVisited += 1;
    } else if (event.type === 'video_watch') {
      session.videosWatched += 1;
    } else if (event.type === 'focus_enter') {
      session.focusTime += event.data?.duration || 0;
    }

    const now = new Date();
    const sessionMinutes = (now - session.sessionStart) / 60000;
    const scrollsPerMin = session.scrollCount / Math.max(sessionMinutes, 0.1);

    if (scrollsPerMin > 15 && event.type === 'scroll') {
      session.doomscrollScore = Math.min(100, session.doomscrollScore + 5);
      session.isDoomscrolling = session.doomscrollScore > 40;
    } else if (event.type === 'focus_enter') {
      session.doomscrollScore = Math.max(0, session.doomscrollScore - 3);
      session.isDoomscrolling = false;
    } else if (session.doomscrollScore > 0 && event.type !== 'scroll') {
      session.doomscrollScore = Math.max(0, session.doomscrollScore - 1);
    }

    session.duration = Math.round((now - session.sessionStart) / 1000);
    await session.save();

    if (session.isDoomscrolling && session.doomscrollScore > 50) {
      await updateDailyReport(req.user._id, session);
    }

    res.json({ success: true, data: { doomscrollScore: session.doomscrollScore, isDoomscrolling: session.isDoomscrolling } });
  } catch (err) {
    next(err);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await UsageBehavior.findOne({ sessionId, user: req.user._id });
    if (session) {
      session.sessionEnd = new Date();
      session.duration = Math.round((session.sessionEnd - session.sessionStart) / 1000);
      await session.save();
      await updateDailyReport(req.user._id, session);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getUsageSummary = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const sessions = await UsageBehavior.find({ user: req.user._id, sessionStart: { $gte: since } }).sort({ sessionStart: -1 });

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalScrolls = sessions.reduce((sum, s) => sum + s.scrollCount, 0);
    const totalFocus = sessions.reduce((sum, s) => sum + s.focusTime, 0);
    const avgDoomscore = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.doomscrollScore, 0) / sessions.length : 0;
    const doomscrollSessions = sessions.filter((s) => s.isDoomscrolling).length;

    res.json({
      success: true,
      data: {
        sessions: sessions.length,
        totalTime,
        totalScrolls,
        totalFocus,
        avgDoomscrollScore: Math.round(avgDoomscore),
        doomscrollSessions,
        recentSessions: sessions.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDailyReports = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const dateStr = (d) => d.toISOString().split('T')[0];
    const startDate = dateStr(since);
    const reports = await DailyReport.find({ user: req.user._id, date: { $gte: startDate } }).sort({ date: -1 });

    const today = dateStr(new Date());
    const todayReport = reports.find((r) => r.date === today);
    const recentReports = reports.slice(0, parseInt(days));

    const totals = recentReports.reduce(
      (acc, r) => ({
        totalTime: acc.totalTime + r.totalTime,
        focusTime: acc.focusTime + r.focusTime,
        doomscrollTime: acc.doomscrollTime + r.doomscrollTime,
        scrollCount: acc.scrollCount + r.scrollCount,
        pagesVisited: acc.pagesVisited + r.pagesVisited,
        videosWatched: acc.videosWatched + r.videosWatched,
        avgScore: acc.avgScore + r.avgDoomscrollScore,
        alertsTriggered: acc.alertsTriggered + r.alertsTriggered,
      }),
      { totalTime: 0, focusTime: 0, doomscrollTime: 0, scrollCount: 0, pagesVisited: 0, videosWatched: 0, avgScore: 0, alertsTriggered: 0 }
    );
    const reportCount = recentReports.length || 1;

    res.json({
      success: true,
      data: {
        reports: recentReports,
        today: todayReport || null,
        totals: {
          totalTime: totals.totalTime,
          focusTime: totals.focusTime,
          doomscrollTime: totals.doomscrollTime,
          scrollCount: totals.scrollCount,
          pagesVisited: totals.pagesVisited,
          videosWatched: totals.videosWatched,
          avgDoomscrollScore: Math.round(totals.avgScore / reportCount),
          alertsTriggered: totals.alertsTriggered,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductivityInsights = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const dateStr = (d) => d.toISOString().split('T')[0];
    const reports = await DailyReport.find({ user: req.user._id, date: { $gte: dateStr(since) } }).sort({ date: -1 });

    const totalReports = reports.length;
    const goodDays = reports.filter((r) => r.productivityScore >= 60).length;
    const badDays = reports.filter((r) => r.productivityScore < 40).length;

    const currentStreak = calculateStreak(reports);
    const bestStreak = calculateBestStreak(reports);

    const peakHours = aggregatePeakHours(reports);
    const worstHours = aggregateWorstHours(reports);

    const topCategories = aggregateCategories(reports);

    res.json({
      success: true,
      data: {
        productivityScore: totalReports > 0 ? Math.round(reports.reduce((s, r) => s + r.productivityScore, 0) / totalReports) : 50,
        goodDays, badDays, totalReports,
        currentStreak, bestStreak,
        peakHours, worstHours,
        topCategories: topCategories.slice(0, 5),
        recommendations: generateRecommendations(reports),
        trends: {
          timeChange: calcTrend(reports, 'totalTime'),
          focusChange: calcTrend(reports, 'focusTime'),
          doomscrollChange: calcTrend(reports, 'doomscrollTime'),
          scoreChange: calcTrend(reports, 'productivityScore'),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.setDailyGoal = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    let report = await DailyReport.findOne({ user: req.user._id, date: today });
    if (!report) {
      report = await DailyReport.create({ user: req.user._id, date: today });
    }
    report.goals.timeLimit = minutes || 120;
    await report.save();

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

async function updateDailyReport(userId, session) {
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();

  let report = await DailyReport.findOne({ user: userId, date: today });
  if (!report) {
    const prev = await DailyReport.findOne({ user: userId }).sort({ date: -1 });
    const streakDay = prev && isConsecutiveDay(prev.date, today) ? prev.streakDay + 1 : 1;
    report = await DailyReport.create({ user: userId, date: today, streakDay });
  }

  report.totalTime += session.duration;
  report.scrollCount += session.scrollCount;
  report.pagesVisited += session.pagesVisited;
  report.videosWatched += session.videosWatched;
  report.focusTime += session.focusTime;
  report.doomscrollTime += session.isDoomscrolling ? session.duration * 0.3 : 0;

  const hourlyEntry = report.hourlyBreakdown.find((h) => h.hour === hour);
  if (hourlyEntry) {
    hourlyEntry.activity += 1;
    hourlyEntry.doomscore = Math.max(hourlyEntry.doomscore, session.doomscrollScore);
  } else {
    report.hourlyBreakdown.push({ hour, activity: 1, doomscore: session.doomscrollScore });
  }

  report.avgDoomscrollScore = Math.round(
    (report.avgDoomscrollScore * (report.hourlyBreakdown.length - 1) + session.doomscrollScore) / report.hourlyBreakdown.length
  );
  report.peakDoomscrollScore = Math.max(report.peakDoomscrollScore, session.doomscrollScore);
  report.goals.timeUsed = report.totalTime / 60;
  report.goals.goalMet = report.goals.timeUsed <= report.goals.timeLimit;

  const focusRatio = report.totalTime > 0 ? report.focusTime / report.totalTime : 0;
  const doomRatio = report.totalTime > 0 ? report.doomscrollTime / report.totalTime : 0;
  report.productivityScore = Math.round(Math.max(0, Math.min(100, (focusRatio * 80 + (1 - doomRatio) * 20))));

  await report.save();
}

function calculateStreak(reports) {
  if (reports.length === 0) return 0;
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let check = new Date(today);
  for (const report of reports) {
    const reportDate = new Date(report.date + 'T00:00:00');
    const diff = Math.round((check - reportDate) / 86400000);
    if (diff === streak) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (diff > streak) {
      break;
    }
  }
  return streak;
}

function calculateBestStreak(reports) {
  if (reports.length === 0) return 0;
  let best = 0, current = 1;
  const sorted = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1].date) - new Date(sorted[i].date)) / 86400000);
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return Math.max(best, 1);
}

function isConsecutiveDay(prevDate, today) {
  const prev = new Date(prevDate + 'T00:00:00');
  const curr = new Date(today + 'T00:00:00');
  return Math.round((curr - prev) / 86400000) === 1;
}

function aggregatePeakHours(reports) {
  const hours = {};
  for (const report of reports) {
    for (const h of report.hourlyBreakdown || []) {
      hours[h.hour] = (hours[h.hour] || 0) + h.activity;
    }
  }
  return Object.entries(hours)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function aggregateWorstHours(reports) {
  const hours = {};
  for (const report of reports) {
    for (const h of report.hourlyBreakdown || []) {
      if (h.doomscore > 50) {
        hours[h.hour] = (hours[h.hour] || 0) + 1;
      }
    }
  }
  return Object.entries(hours)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function aggregateCategories(reports) {
  const cats = {};
  for (const report of reports) {
    for (const c of report.categoryBreakdown || []) {
      cats[c.category] = (cats[c.category] || 0) + c.time;
    }
  }
  return Object.entries(cats)
    .map(([category, time]) => ({ category, time }))
    .sort((a, b) => b.time - a.time);
}

function calcTrend(reports, field) {
  if (reports.length < 2) return 0;
  const half = Math.floor(reports.length / 2);
  const first = reports.slice(0, half);
  const second = reports.slice(half);
  const avg1 = first.reduce((s, r) => s + (r[field] || 0), 0) / first.length;
  const avg2 = second.reduce((s, r) => s + (r[field] || 0), 0) / second.length;
  if (avg1 === 0) return 0;
  return Math.round(((avg2 - avg1) / avg1) * 100);
}

function generateRecommendations(reports) {
  const recs = [];
  const avgScore = reports.length > 0 ? reports.reduce((s, r) => s + r.productivityScore, 0) / reports.length : 50;
  const totalDoomTime = reports.reduce((s, r) => s + r.doomscrollTime, 0);
  const totalFocus = reports.reduce((s, r) => s + r.focusTime, 0);

  if (avgScore < 40) {
    recs.push({ type: 'alert', title: 'Productivity at risk', description: 'Your focus time is low. Try using Focus Mode to block distractions.', action: 'Enable Focus Mode' });
  }
  if (totalDoomTime > totalFocus && totalDoomTime > 0) {
    recs.push({ type: 'warning', title: 'Doomscrolling detected', description: 'You spend more time scrolling than learning. Set a daily time limit.', action: 'Set Limit' });
  }
  if (reports.length >= 3 && reports[0].productivityScore > reports[reports.length - 1].productivityScore) {
    recs.push({ type: 'positive', title: 'Improving trend', description: 'Your productivity score is trending up! Keep the momentum going.', action: 'View Progress' });
  }
  if (reports.length < 3) {
    recs.push({ type: 'info', title: 'More data needed', description: 'Keep using the platform to get personalized productivity insights.', action: 'Continue' });
  }

  const peak = aggregatePeakHours(reports);
  if (peak.length > 0) {
    recs.push({ type: 'tip', title: `Best time: ${peak[0].hour}:00`, description: 'You are most productive during this hour. Schedule important learning then.', action: 'Set Schedule' });
  }

  return recs;
}

const recommendationEngine = require('../services/recommendationEngine');
const DailyReport = require('../models/DailyReport');
const UsageBehavior = require('../models/UsageBehavior');

exports.getProductivityInsights = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const insights = await recommendationEngine.generateInsights(req.user._id, parseInt(days));
    res.json({ success: true, data: insights });
  } catch (err) {
    next(err);
  }
};

exports.getRealTimeAnalysis = async (req, res, next) => {
  try {
    const recentSessions = await UsageBehavior.find({ user: req.user._id })
      .sort({ sessionStart: -1 })
      .limit(5);

    const currentSession = recentSessions.find(s => !s.sessionEnd);
    const lastSession = recentSessions.find(s => s.sessionEnd);

    const analysis = {
      currentSessionActive: !!currentSession,
      sessionDuration: currentSession ? Math.round((Date.now() - currentSession.sessionStart) / 1000) : 0,
      doomscrollRisk: await calculateDoomscrollRisk(req.user._id),
      recommendation: await getQuickRecommendation(req.user._id),
    };

    if (lastSession) {
      analysis.lastSession = {
        duration: lastSession.duration,
        score: lastSession.doomscrollScore,
        wasDoomscrolling: lastSession.isDoomscrolling,
      };
    }

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
};

const calculateDoomscrollRisk = async (userId) => {
  const recent = await UsageBehavior.find({ user: userId, sessionStart: { $gte: new Date(Date.now() - 3600000) } });

  if (recent.length === 0) return { level: 'low', score: 0 };

  const totalScrolls = recent.reduce((s, r) => s + r.scrollCount, 0);
  const totalDuration = recent.reduce((s, r) => s + r.duration, 0);
  const avgScore = recent.reduce((s, r) => s + r.doomscrollScore, 0) / recent.length;

  const scrollsPerMin = totalDuration > 0 ? totalScrolls / (totalDuration / 60) : 0;

  let level = 'low';
  if (scrollsPerMin > 20 || avgScore > 70) level = 'critical';
  else if (scrollsPerMin > 10 || avgScore > 40) level = 'high';
  else if (scrollsPerMin > 5 || avgScore > 20) level = 'medium';

  return { level, score: Math.round(avgScore), scrollsPerMin: Math.round(scrollsPerMin) };
};
exports.calculateDoomscrollRisk = calculateDoomscrollRisk;

const getQuickRecommendation = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const todayReport = await DailyReport.findOne({ user: userId, date: today });
  const recentSessions = await UsageBehavior.find({ user: userId }).sort({ sessionStart: -1 }).limit(3);

  if (!todayReport && recentSessions.length === 0) {
    return {
      type: 'info',
      message: 'Start your learning journey! Try watching an educational video.',
      icon: 'lightbulb',
    };
  }

  if (todayReport && todayReport.doomscrollTime > todayReport.focusTime * 2) {
    return {
      type: 'warning',
      message: 'Your doomscrolling is high. Take a 5-min break and come back with intention.',
      icon: 'warning',
    };
  }

  if (todayReport && todayReport.productivityScore >= 80) {
    return {
      type: 'positive',
      message: 'Great focus today! You are in the zone. Keep going!',
      icon: 'star',
    };
  }

  const recentFocus = recentSessions.filter(s => s.focusTime > 0).length;
  if (recentFocus === 0 && recentSessions.length > 0) {
    return {
      type: 'tip',
      message: 'Try enabling Focus Mode to block distractions and track your learning time.',
      icon: 'shield',
      action: '/focus',
    };
  }

  return {
    type: 'neutral',
    message: 'Stay mindful of your browsing. Set a goal for what you want to learn today.',
    icon: 'mindfulness',
  };
};

exports.getQuickRecommendation = getQuickRecommendation;

exports.getHourlyBreakdown = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const reports = await DailyReport.find({
      user: req.user._id,
      date: { $gte: since.toISOString().split('T')[0] },
    }).sort({ date: -1 });

    const hourlyMap = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = { hour: i, activity: 0, doomscore: 0, count: 0 };
    }

    for (const r of reports) {
      for (const h of r.hourlyBreakdown || []) {
        if (hourlyMap[h.hour]) {
          hourlyMap[h.hour].activity += h.activity;
          hourlyMap[h.hour].doomscore += h.doomscore;
          hourlyMap[h.hour].count += 1;
        }
      }
    }

    const breakdown = Object.values(hourlyMap).map(h => ({
      hour: h.hour,
      activity: h.activity,
      avgDoomscore: h.count > 0 ? Math.round(h.doomscore / h.count) : 0,
    }));

    res.json({ success: true, data: breakdown });
  } catch (err) {
    next(err);
  }
};

exports.analyzeCategoryBreakdown = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const reports = await DailyReport.find({
      user: req.user._id,
      date: { $gte: since.toISOString().split('T')[0] },
    });

    const categoryMap = {};
    for (const r of reports) {
      for (const c of r.categoryBreakdown || []) {
        if (!categoryMap[c.category]) {
          categoryMap[c.category] = { category: c.category, time: 0, visits: 0 };
        }
        categoryMap[c.category].time += c.time;
        categoryMap[c.category].visits += c.visits;
      }
    }

    const breakdown = Object.values(categoryMap).sort((a, b) => b.time - a.time);

    res.json({ success: true, data: breakdown });
  } catch (err) {
    next(err);
  }
};

exports.getWellnessScore = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const reports = await DailyReport.find({
      user: req.user._id,
      date: { $gte: since.toISOString().split('T')[0] },
    });

    if (reports.length === 0) {
      return res.json({
        success: true,
        data: { wellnessScore: 50, insights: ['Not enough data. Keep using FunTube to get your wellness score.'] },
      });
    }

    const avgProductivity = reports.reduce((s, r) => s + r.productivityScore, 0) / reports.length;
    const totalDoomTime = reports.reduce((s, r) => s + r.doomscrollTime, 0);
    const totalTime = reports.reduce((s, r) => s + r.totalTime, 0);
    const doomRatio = totalTime > 0 ? totalDoomTime / totalTime : 0;

    const sessions = await UsageBehavior.find({
      user: req.user._id,
      sessionStart: { $gte: since },
    });
    const avgSessionTime = sessions.length > 0
      ? sessions.reduce((s, sess) => s + sess.duration, 0) / sessions.length
      : 0;

    const focusScore = (totalTime > 0 ? reports.reduce((s, r) => s + r.focusTime, 0) / totalTime : 0) * 100;
    const doomResistance = (1 - doomRatio) * 100;
    const balance = Math.max(0, Math.min(100, 50 + (avgProductivity - 50) * 0.5));

    const wellnessScore = Math.round((avgProductivity * 0.35 + focusScore * 0.25 + doomResistance * 0.25 + balance * 0.15));

    const insights = [];
    if (avgProductivity >= 80) insights.push('Exceptional productivity! Your learning habits are strong.');
    else if (avgProductivity >= 60) insights.push('Good productivity. Small improvements can make a big difference.');
    else insights.push('Your productivity could use a boost. Try the Focus Mode features.');

    if (doomRatio > 0.5) insights.push('You spend more time doomscrolling than focusing. Consider setting a daily limit.');
    if (avgSessionTime > 3600) insights.push('Sessions are longer than 1 hour on average. Regular breaks improve retention.');
    if (avgSessionTime < 300) insights.push('Sessions are very short. Try to focus for at least 10 minutes at a time.');

    res.json({
      success: true,
      data: {
        wellnessScore,
        components: {
          productivity: Math.round(avgProductivity),
          focus: Math.round(focusScore),
          doomResistance: Math.round(doomResistance),
          balance: Math.round(balance),
        },
        insights,
        averages: {
          avgSessionTime: Math.round(avgSessionTime),
          dailyTime: Math.round(totalTime / reports.length / 60),
          dailyDoomTime: Math.round(totalDoomTime / reports.length / 60),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

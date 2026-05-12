const DailyReport = require('../models/DailyReport');
const UsageBehavior = require('../models/UsageBehavior');

class RecommendationEngine {
  async generateInsights(userId, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const reports = await DailyReport.find({ user: userId, date: { $gte: since.toISOString().split('T')[0] } }).sort({ date: -1 });
    const sessions = await UsageBehavior.find({ user: userId, sessionStart: { $gte: since } }).sort({ sessionStart: -1 });

    const score = this.calculateProductivityScore(reports);
    const trends = this.calculateTrends(reports);
    const patterns = this.detectPatterns(reports, sessions);
    const recommendations = this.generateRecommendations(reports, sessions, score);
    const streaks = this.calculateStreaks(reports);
    const peakHours = this.aggregatePeakHours(reports);
    const worstHours = this.aggregateWorstHours(reports);

    return {
      productivityScore: score,
      trends,
      patterns,
      recommendations,
      streaks,
      peakHours,
      worstHours,
      totalSessions: sessions.length,
      totalReports: reports.length,
      summary: this.generateSummary(reports, sessions, score),
    };
  }

  calculateProductivityScore(reports) {
    if (reports.length === 0) return { overall: 50, focus: 50, doomscroll: 50, consistency: 50 };

    const totalTime = reports.reduce((s, r) => s + r.totalTime, 0);
    const totalFocus = reports.reduce((s, r) => s + r.focusTime, 0);
    const totalDoom = reports.reduce((s, r) => s + r.doomscrollTime, 0);
    const avgScore = reports.reduce((s, r) => s + r.productivityScore, 0) / reports.length;

    const focusRatio = totalTime > 0 ? totalFocus / totalTime : 0;
    const doomRatio = totalTime > 0 ? totalDoom / totalTime : 0;
    const goodDays = reports.filter(r => r.productivityScore >= 60).length;
    const consistency = reports.length > 0 ? (goodDays / reports.length) * 100 : 0;

    return {
      overall: Math.round(Math.max(0, Math.min(100, avgScore))),
      focus: Math.round(Math.max(0, Math.min(100, focusRatio * 100))),
      doomscroll: Math.round(Math.max(0, Math.min(100, (1 - doomRatio) * 100))),
      consistency: Math.round(consistency),
    };
  }

  calculateTrends(reports) {
    if (reports.length < 2) return { score: 0, focus: 0, doomscroll: 0, time: 0 };

    const half = Math.floor(reports.length / 2);
    const recent = reports.slice(0, half);
    const older = reports.slice(half);

    const calcTrend = (field) => {
      const avg1 = older.reduce((s, r) => s + (r[field] || 0), 0) / older.length;
      const avg2 = recent.reduce((s, r) => s + (r[field] || 0), 0) / recent.length;
      if (avg1 === 0) return 0;
      return Math.round(((avg2 - avg1) / avg1) * 100);
    };

    return {
      score: calcTrend('productivityScore'),
      focus: calcTrend('focusTime'),
      doomscroll: calcTrend('doomscrollTime'),
      time: calcTrend('totalTime'),
    };
  }

  detectPatterns(reports, sessions) {
    const patterns = [];

    const hourlyActivity = {};
    for (const r of reports) {
      for (const h of r.hourlyBreakdown || []) {
        if (!hourlyActivity[h.hour]) hourlyActivity[h.hour] = { activity: 0, doomscore: 0, count: 0 };
        hourlyActivity[h.hour].activity += h.activity;
        hourlyActivity[h.hour].doomscore += h.doomscore;
        hourlyActivity[h.hour].count += 1;
      }
    }

    const doomHours = Object.entries(hourlyActivity)
      .filter(([, v]) => v.count > 0 && (v.doomscore / v.count) > 50)
      .map(([hour]) => parseInt(hour));

    if (doomHours.length > 0) {
      patterns.push({
        type: 'doom_hours',
        severity: doomHours.length > 3 ? 'high' : 'medium',
        title: 'High-risk scrolling hours detected',
        description: `You tend to doomscroll most during hours: ${doomHours.sort().join(', ')}:00. Consider scheduling breaks then.`,
        hours: doomHours,
      });
    }

    const lateNightActivity = Object.entries(hourlyActivity)
      .filter(([hour]) => parseInt(hour) >= 22 || parseInt(hour) <= 5);

    if (lateNightActivity.length > 2) {
      patterns.push({
        type: 'late_night',
        severity: 'medium',
        title: 'Late-night browsing detected',
        description: 'Using FunTube late at night can affect sleep quality. Try setting a curfew.',
      });
    }

    const consecutiveBadDays = this.findConsecutiveBadDays(reports);
    if (consecutiveBadDays >= 3) {
      patterns.push({
        type: 'bad_streak',
        severity: 'high',
        title: 'Multiple low-productivity days',
        description: `You've had ${consecutiveBadDays} consecutive days with low productivity. Time to reset your habits.`,
        days: consecutiveBadDays,
      });
    }

    const scrollHeavy = sessions.filter(s => s.scrollCount > 100 && s.duration < 600);
    if (scrollHeavy.length > 3) {
      patterns.push({
        type: 'rapid_scrolling',
        severity: 'high',
        title: 'Rapid scrolling behavior',
        description: 'Frequent rapid scrolling suggests mindless browsing. Try using search to find what you need.',
      });
    }

    return patterns;
  }

  findConsecutiveBadDays(reports) {
    let streak = 0;
    let maxStreak = 0;
    for (const r of reports) {
      if (r.productivityScore < 40) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    return maxStreak;
  }

  generateRecommendations(reports, sessions, score) {
    const recs = [];

    if (score.overall < 40) {
      recs.push({
        type: 'critical',
        title: 'Productivity needs immediate attention',
        description: 'Your overall productivity score is critically low. Enable Focus Mode to block distractions and set a daily time limit.',
        action: { label: 'Enable Focus Mode', link: '/focus' },
        priority: 1,
      });
    }

    const totalDoom = reports.reduce((s, r) => s + r.doomscrollTime, 0);
    const totalFocus = reports.reduce((s, r) => s + r.focusTime, 0);
    if (totalDoom > totalFocus && totalDoom > 0) {
      recs.push({
        type: 'warning',
        title: 'Doomscrolling exceeds focus time',
        description: `You spent ${Math.round(totalDoom / 60)}min doomscrolling vs ${Math.round(totalFocus / 60)}min focusing. Try the Pomodoro technique: 25min focus, 5min break.`,
        action: { label: 'Start Pomodoro', link: '/focus' },
        priority: 2,
      });
    }

    if (reports.length >= 2) {
      const latest = reports[0].productivityScore;
      const previous = reports[1].productivityScore;
      if (latest > previous) {
        recs.push({
          type: 'positive',
          title: 'Productivity is improving!',
          description: `Your score increased from ${previous} to ${latest}. Keep up the great work!`,
          priority: 3,
        });
      }
    }

    const sessionsToday = sessions.filter(s => {
      const today = new Date().toISOString().split('T')[0];
      return s.sessionStart.toISOString().split('T')[0] === today;
    });

    if (sessionsToday.length > 5) {
      recs.push({
        type: 'info',
        title: 'Multiple sessions detected',
        description: `You've started ${sessionsToday.length} sessions today. Try consolidating into fewer, longer sessions for better focus.`,
        priority: 4,
      });
    }

    const longSessions = sessions.filter(s => s.duration > 7200);
    if (longSessions.length > 0) {
      recs.push({
        type: 'tip',
        title: 'Take regular breaks',
        description: 'Sessions longer than 2 hours reduce retention. Try the Pomodoro technique with regular breaks.',
        action: { label: 'Set Pomodoro', link: '/focus' },
        priority: 5,
      });
    }

    if (reports.length < 3) {
      recs.push({
        type: 'onboarding',
        title: 'More data for better insights',
        description: 'Keep using FunTube with Focus Mode enabled. We will generate personalized insights as we learn your habits.',
        priority: 6,
      });
    }

    if (score.doomscroll < 30) {
      recs.push({
        type: 'alert',
        title: 'High doomscroll activity',
        description: 'Your doomscroll resistance score is very low. Set a daily screen time goal to limit mindless browsing.',
        action: { label: 'Set Daily Goal', link: '/productivity' },
        priority: 2,
      });
    }

    if (score.consistency >= 80) {
      recs.push({
        type: 'achievement',
        title: 'Consistency master!',
        description: `You maintained good productivity for ${Math.round(score.consistency)}% of days. You are building a strong habit!`,
        priority: 1,
      });
    }

    const peak = this.aggregatePeakHours(reports);
    if (peak.length > 0) {
      recs.push({
        type: 'tip',
        title: `Best focus time: ${peak[0].hour}:00`,
        description: 'You are most productive during this hour. Schedule your most important learning then.',
        action: { label: 'View Analytics', link: '/productivity' },
        priority: 5,
      });
    }

    return recs.sort((a, b) => a.priority - b.priority).map(({ priority, ...r }) => r);
  }

  calculateStreaks(reports) {
    if (reports.length === 0) return { current: 0, best: 0 };

    let current = 0;
    let best = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = today;

    for (const report of reports) {
      if (report.date === checkDate) {
        current++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split('T')[0];
      } else if (report.date < checkDate) {
        break;
      }
    }

    let temp = 1;
    const sorted = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round((new Date(sorted[i - 1].date) - new Date(sorted[i].date)) / 86400000);
      if (diff === 1) {
        temp++;
        best = Math.max(best, temp);
      } else {
        temp = 1;
      }
    }

    return { current, best: Math.max(best, current, 1) };
  }

  aggregatePeakHours(reports) {
    const hours = {};
    for (const r of reports) {
      for (const h of r.hourlyBreakdown || []) {
        hours[h.hour] = (hours[h.hour] || 0) + h.activity;
      }
    }
    return Object.entries(hours)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  aggregateWorstHours(reports) {
    const hours = {};
    for (const r of reports) {
      for (const h of r.hourlyBreakdown || []) {
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

  generateSummary(reports, sessions, score) {
    const totalSessions = sessions.length;
    const totalScrolls = sessions.reduce((s, sess) => s + sess.scrollCount, 0);
    const totalTime = reports.reduce((s, r) => s + r.totalTime, 0);
    const totalFocus = reports.reduce((s, r) => s + r.focusTime, 0);

    const focusPercent = totalTime > 0 ? Math.round((totalFocus / totalTime) * 100) : 0;

    let verdict;
    if (score.overall >= 80) verdict = 'Exceptional focus and learning habits!';
    else if (score.overall >= 60) verdict = 'Good productivity with room to improve.';
    else if (score.overall >= 40) verdict = 'Moderate productivity. Try using focus tools.';
    else verdict = 'Low productivity detected. Consider setting boundaries.';

    return {
      totalTime: Math.round(totalTime / 60),
      focusTime: Math.round(totalFocus / 60),
      focusPercent,
      totalSessions,
      totalScrolls,
      avgScrollsPerSession: totalSessions > 0 ? Math.round(totalScrolls / totalSessions) : 0,
      score: score.overall,
      verdict,
    };
  }
}

module.exports = new RecommendationEngine();

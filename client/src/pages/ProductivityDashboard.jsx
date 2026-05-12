import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import {
  fetchUsageSummary, fetchDailyReports, fetchProductivityInsights,
  selectUsage, selectReports, selectInsights,
} from '../store/slices/usageSlice';
import {
  selectProductivity, selectStreak, selectTodayStats,
} from '../store/slices/productivitySlice';
import { productivityAPI } from '../services/productivityAPI';
import {
  HiChartBar, HiLightningBolt, HiClock, HiTrendingUp, HiShieldCheck,
  HiFire, HiCalendar, HiStar, HiExclamation, HiCheck, HiChartPie,
  HiRefresh, HiMenu,
} from 'react-icons/hi';
import Card from '../components/ui/Card';
import Progress from '../components/ui/Progress';
import Skeleton from '../components/ui/Skeleton';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-panel-strong rounded-xl px-4 py-3 border border-white/10 shadow-glass-xl text-xs">
      <p className="text-gray-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-gray-400">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-white font-medium">{p.value}{p.name === 'score' ? '' : p.name === 'doomscore' ? '' : 'm'}</span>
        </div>
      ))}
    </div>
  );
};

const ProductivityDashboard = () => {
  const dispatch = useDispatch();
  const { summary, reports, insights, loading, dailyGoal, sessionMinutes, focusMinutes } = useSelector(selectUsage);
  const { totalFocusMinutes, sessionsCompleted, focusScore, sessionHistory } = useSelector(selectProductivity);
  const { current: streak, best: bestStreak } = useSelector(selectStreak);
  const today = useSelector(selectTodayStats);

  const [aiInsights, setAiInsights] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [wellness, setWellness] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    dispatch(fetchUsageSummary(timeRange));
    dispatch(fetchDailyReports(timeRange));
    dispatch(fetchProductivityInsights(timeRange));
  }, [dispatch, timeRange]);

  useEffect(() => {
    setAiLoading(true);
    Promise.all([
      productivityAPI.getAIInsights(timeRange),
      productivityAPI.getHourlyBreakdown(timeRange),
      productivityAPI.getWellnessScore(timeRange),
    ]).then(([ins, hr, wel]) => {
      setAiInsights(ins.data.data);
      setHourlyData(hr.data.data);
      setWellness(wel.data.data);
    }).catch(() => {}).finally(() => setAiLoading(false));
  }, [timeRange]);

  const reportChartData = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].reverse().map(r => ({
      date: r.date?.slice(5),
      focus: Math.round(r.focusTime / 60),
      doomscroll: Math.round(r.doomscrollTime / 60),
      score: r.productivityScore,
    }));
  }, [reports]);

  const categoryData = useMemo(() => {
    if (!insights?.topCategories) return [];
    return insights.topCategories.map((c, i) => ({
      name: c.category || 'Unknown',
      value: c.time || 1,
      color: COLORS[i % COLORS.length],
    }));
  }, [insights]);

  const radarData = useMemo(() => {
    if (!wellness) return [];
    const c = wellness.components || {};
    return [
      { metric: 'Productivity', value: c.productivity || 50 },
      { metric: 'Focus', value: c.focus || 50 },
      { metric: 'Doom Resist', value: c.doomResistance || 50 },
      { metric: 'Balance', value: c.balance || 50 },
      { metric: 'Consistency', value: insights?.trends?.score ? Math.min(100, 50 + (insights.trends.score || 0)) : 50 },
    ];
  }, [wellness, insights]);

  const goalProgress = dailyGoal > 0 ? Math.min(100, Math.round((sessionMinutes / dailyGoal) * 100)) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <HiChartBar className="w-4 h-4 text-white" />
            </span>
            Productivity Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Track your focus, analyze your habits, and improve your learning</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                timeRange === d
                  ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                  : 'text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => Promise.all([
              dispatch(fetchUsageSummary(timeRange)),
              dispatch(fetchDailyReports(timeRange)),
              dispatch(fetchProductivityInsights(timeRange)),
            ])}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all"
          >
            <HiRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {wellness && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong rounded-2xl p-6 border border-primary-500/10 bg-gradient-to-br from-primary-500/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiStar className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-white">Wellness Score</h2>
            </div>
            <span className={`text-3xl font-bold ${
              wellness.wellnessScore >= 80 ? 'text-green-400' :
              wellness.wellnessScore >= 60 ? 'text-primary-400' :
              wellness.wellnessScore >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {wellness.wellnessScore}
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wellness.wellnessScore}%` }}
              className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(wellness.insights || []).slice(0, 4).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <HiLightningBolt className="w-3 h-3 text-primary-400 mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: HiClock, label: 'Today', value: `${today.minutes}m`, sub: `${today.sessions} sessions`, color: 'primary' },
          { icon: HiFire, label: 'Streak', value: `${streak} days`, sub: `Best: ${bestStreak}`, color: 'orange' },
          { icon: HiTrendingUp, label: 'Focus Score', value: `${focusScore}`, sub: focusScore >= 80 ? 'Great!' : focusScore >= 50 ? 'Okay' : 'Needs work', color: focusScore >= 80 ? 'green' : focusScore >= 50 ? 'yellow' : 'red' },
          { icon: HiShieldCheck, label: 'Goal', value: `${Math.round(sessionMinutes)}/${dailyGoal}m`, sub: `${goalProgress}% complete`, color: goalProgress >= 100 ? 'green' : 'primary' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-panel rounded-xl p-4 border border-white/5">
            <div className={`p-2 rounded-lg w-fit mb-2 ${
              stat.color === 'green' ? 'bg-green-500/10 text-green-400' :
              stat.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
              stat.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
              stat.color === 'red' ? 'bg-red-500/10 text-red-400' :
              'bg-primary-500/10 text-primary-400'
            }`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-panel-strong rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HiTrendingUp className="w-4 h-4 text-primary-400" />
              Daily Productivity Trend
            </h3>
          </div>
          {reportChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={reportChartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#818cf8" fill="url(#scoreGrad)" strokeWidth={2} name="score" />
                <Area type="monotone" dataKey="focus" stroke="#34d399" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="focus" />
                <Area type="monotone" dataKey="doomscroll" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="doomscroll" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">No data yet. Start using FunTube to see your productivity trends.</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-panel-strong rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HiChartPie className="w-4 h-4 text-primary-400" />
              Category Breakdown
            </h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}
                  dataKey="value">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">No category data yet.</div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel-strong rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <HiClock className="w-4 h-4 text-primary-400" />
            Hourly Activity Pattern
          </h3>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="activity" fill="#818cf8" radius={[4, 4, 0, 0]} name="activity" />
                <Bar dataKey="avgDoomscore" fill="#f87171" radius={[4, 4, 0, 0]} name="doomscore" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No hourly data yet.</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-panel-strong rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <HiShieldCheck className="w-4 h-4 text-primary-400" />
            Productivity Radar
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                <Radar dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">Loading radar data...</div>
          )}
        </motion.div>
      </div>

      {aiInsights?.recommendations?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <HiLightningBolt className="w-4 h-4 text-primary-400" />
            AI Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiInsights.recommendations.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                className={`glass-panel rounded-xl p-4 border ${
                  rec.type === 'critical' || rec.type === 'alert' ? 'border-red-500/20 bg-red-500/5' :
                  rec.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
                  rec.type === 'positive' || rec.type === 'achievement' ? 'border-green-500/20 bg-green-500/5' :
                  'border-white/5'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    rec.type === 'critical' || rec.type === 'alert' ? 'bg-red-500/10 text-red-400' :
                    rec.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                    rec.type === 'positive' || rec.type === 'achievement' ? 'bg-green-500/10 text-green-400' :
                    'bg-primary-500/10 text-primary-400'
                  }`}>
                    {rec.type === 'critical' || rec.type === 'alert' ? <HiExclamation className="w-4 h-4" /> :
                     rec.type === 'positive' || rec.type === 'achievement' ? <HiCheck className="w-4 h-4" /> :
                     <HiLightningBolt className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{rec.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                    {rec.action && (
                      <a href={rec.action.link || '#'}
                        className="inline-block mt-2 text-xs text-primary-400 hover:text-primary-300 font-medium">
                        {rec.action.label} &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {aiInsights?.patterns?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <HiExclamation className="w-4 h-4 text-yellow-400" />
            Behavioral Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.patterns.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                className={`glass-panel rounded-xl p-4 border ${
                  p.severity === 'high' ? 'border-red-500/20 bg-red-500/5' :
                  p.severity === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
                  'border-white/5'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    p.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                    p.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-primary-500/10 text-primary-400'
                  }`}>
                    <HiExclamation className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-panel-strong rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <HiMenu className="w-4 h-4 text-primary-400" />
            Usage Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: summary.sessions },
              { label: 'Total Time', value: `${Math.round(summary.totalTime / 60)}h ${Math.round(summary.totalTime % 60)}m` },
              { label: 'Total Scrolls', value: summary.totalScrolls?.toLocaleString() },
              { label: 'Avg Doomscore', value: summary.avgDoomscrollScore, suffix: '/100' },
              { label: 'Focus Time', value: `${Math.round(summary.totalFocus / 60)}m` },
              { label: 'Doomscroll Sessions', value: summary.doomscrollSessions },
            ].map((item) => (
              <div key={item.label} className="glass-panel rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-lg font-bold text-white">{item.value}{item.suffix || ''}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductivityDashboard;

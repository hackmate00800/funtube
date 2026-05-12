import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectProductivity } from '../../store/slices/productivitySlice';
import { HiChartBar, HiTrendingUp, HiClock, HiLightningBolt } from 'react-icons/hi';

const LearningAnalytics = ({ className = '' }) => {
  const { totalFocusMinutes, sessionsCompleted, focusScore, sessionHistory } = useSelector(selectProductivity);

  const thisWeekMinutes = Object.entries(
    sessionHistory.reduce((acc, s) => {
      const weekStart = getWeekStart(s.date);
      acc[weekStart] = (acc[weekStart] || 0) + s.duration;
      return acc;
    }, {})
  ).slice(-7).reduce((sum, [, v]) => sum + v, 0);

  const avgSession = sessionsCompleted > 0 ? Math.round(totalFocusMinutes / sessionsCompleted) : 0;
  const efficiency = focusScore >= 80 ? 'High' : focusScore >= 50 ? 'Medium' : 'Needs Improvement';

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const dayData = sessionHistory.filter((s) => s.date === ds);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      minutes: dayData.reduce((sum, s) => sum + s.duration, 0),
      sessions: dayData.length,
    };
  });

  const maxMin = Math.max(...weeklyData.map((d) => d.minutes), 1);

  return (
    <div className={`glass-panel-strong rounded-2xl p-5 border border-white/5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <HiChartBar className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-white">Learning Analytics</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: HiClock, label: 'Avg Session', value: `${avgSession}m`, color: 'primary' },
          { icon: HiLightningBolt, label: 'Efficiency', value: efficiency, color: focusScore >= 80 ? 'success' : focusScore >= 50 ? 'warning' : 'danger' },
          { icon: HiTrendingUp, label: 'This Week', value: `${thisWeekMinutes}m`, color: 'info' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-3 text-center border border-white/5">
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${
              stat.color === 'success' ? 'text-green-400' :
              stat.color === 'warning' ? 'text-yellow-400' :
              stat.color === 'danger' ? 'text-red-400' :
              stat.color === 'info' ? 'text-blue-400' :
              'text-primary-400'
            }`} />
            <p className="text-sm font-bold text-white">{stat.value}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">This Week</p>
        <div className="flex items-end gap-1.5 h-20">
          {weeklyData.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.minutes / maxMin) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="w-full rounded-t-lg relative group cursor-pointer"
                style={{
                  minHeight: d.minutes > 0 ? 4 : 2,
                  background: `linear-gradient(180deg, rgb(var(--color-primary-400)), rgb(var(--color-primary-600)))`,
                  opacity: d.minutes > 0 ? 0.6 + (d.minutes / maxMin) * 0.4 : 0.2,
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-gray-400 whitespace-nowrap bg-dark-800 px-1.5 py-0.5 rounded">
                  {d.minutes}m
                </div>
              </motion.div>
              <span className="text-[8px] text-gray-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Productivity Score</span>
          <span className={`font-medium ${
            focusScore >= 80 ? 'text-green-400' :
            focusScore >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {focusScore}/100
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${focusScore}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, rgb(var(--color-primary-400)), rgb(var(--color-primary-600)))`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const getWeekStart = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

export default LearningAnalytics;

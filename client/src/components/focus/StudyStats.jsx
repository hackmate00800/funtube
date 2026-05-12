import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectTodayStats, selectProductivity } from '../../store/slices/productivitySlice';
import { HiClock, HiFire, HiCalendar, HiTrendingUp, HiStar } from 'react-icons/hi';

const StudyStats = ({ className = '' }) => {
  const today = useSelector(selectTodayStats);
  const { totalFocusMinutes, sessionsCompleted, longestStreak } = useSelector(selectProductivity);

  const stats = [
    {
      icon: HiClock,
      label: 'Today',
      value: `${today.minutes}m`,
      subtitle: `${today.sessions} sessions`,
      color: 'primary',
    },
    {
      icon: HiFire,
      label: 'Total Focus Time',
      value: `${totalFocusMinutes > 60 ? `${(totalFocusMinutes / 60).toFixed(1)}h` : `${totalFocusMinutes}m`}`,
      subtitle: `${sessionsCompleted} sessions`,
      color: 'warning',
    },
    {
      icon: HiTrendingUp,
      label: 'Longest Streak',
      value: `${longestStreak} days`,
      subtitle: 'keep going!',
      color: 'success',
    },
    {
      icon: HiCalendar,
      label: 'Avg. Daily',
      value: `${sessionsCompleted > 0 ? Math.round(totalFocusMinutes / Math.max(sessionsCompleted, 1)) : 0}m`,
      subtitle: 'per session',
      color: 'info',
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <HiStar className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-white">Study Statistics</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel rounded-xl p-3 hover:bg-dark-800/80 transition-all border border-white/5"
          >
            <div className={`p-1.5 rounded-lg w-fit mb-2 ${
              stat.color === 'success' ? 'bg-green-500/10 text-green-400' :
              stat.color === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
              stat.color === 'info' ? 'bg-blue-500/10 text-blue-400' :
              'bg-primary-500/10 text-primary-400'
            }`}>
              <stat.icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StudyStats;

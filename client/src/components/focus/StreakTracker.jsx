import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectStreak, selectProductivity } from '../../store/slices/productivitySlice';
import { HiFire, HiBadgeCheck } from 'react-icons/hi';

const StreakTracker = ({ className = '' }) => {
  const { current, longest, lastDate } = useSelector(selectStreak);
  const { achievements } = useSelector(selectProductivity);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const getMilestone = (streak) => {
    if (streak >= 365) return { label: 'Year Warrior', icon: '🔥', color: 'text-yellow-400' };
    if (streak >= 100) return { label: 'Century Club', icon: '💯', color: 'text-green-400' };
    if (streak >= 50) return { label: 'Half Century', icon: '⭐', color: 'text-blue-400' };
    if (streak >= 30) return { label: 'Monthly Master', icon: '🏆', color: 'text-purple-400' };
    if (streak >= 14) return { label: 'Fortnight Focus', icon: '🎯', color: 'text-primary-400' };
    if (streak >= 7) return { label: 'Week Warrior', icon: '🔥', color: 'text-orange-400' };
    if (streak >= 3) return { label: 'Getting Started', icon: '🌱', color: 'text-green-400' };
    return null;
  };

  const milestone = getMilestone(current);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`glass-panel rounded-xl p-4 border border-white/5 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <HiFire className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Study Streak</h3>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {last7.map((date, i) => {
          const isToday = date === today;
          const isActive = lastDate === date;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-glow-sm'
                    : isToday
                      ? 'bg-white/10 text-gray-300 border border-white/10'
                      : 'bg-white/5 text-gray-500'
                } ${isActive ? 'scale-110' : ''}`}
              >
                {isActive ? '✓' : dayLabels[i]}
              </motion.div>
              <span className="text-[8px] text-gray-600">{['M','T','W','T','F','S','S'][i]}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <motion.p
            key={current}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-white tabular-nums"
          >
            {current}
            <span className="text-sm font-normal text-gray-400 ml-1">days</span>
          </motion.p>
          <p className="text-[10px] text-gray-500">Best: {longest} days</p>
        </div>
        {milestone && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-right"
          >
            <p className={`text-lg ${milestone.color}`}>{milestone.icon}</p>
            <p className="text-[10px] text-gray-400">{milestone.label}</p>
          </motion.div>
        )}
      </div>

      {achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {achievements.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-1 text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/20">
                <HiBadgeCheck className="w-3 h-3" />
                {a.title}
              </div>
            ))}
            {achievements.length > 4 && (
              <span className="text-[10px] text-gray-500">+{achievements.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;

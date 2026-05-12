import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  setDailyGoal, selectDailyGoal, selectSessionMinutes,
  selectUsage,
} from '../../store/slices/usageSlice';
import { HiTarget, HiCheckCircle, HiClock } from 'react-icons/hi';

const GOAL_OPTIONS = [30, 60, 90, 120, 180];

const DailyGoalCard = ({ className = '' }) => {
  const dispatch = useDispatch();
  const dailyGoal = useSelector(selectDailyGoal);
  const sessionMinutes = useSelector(selectSessionMinutes);
  const { focusMinutes } = useSelector(selectUsage);

  const progress = dailyGoal > 0 ? Math.min(100, Math.round((sessionMinutes / dailyGoal) * 100)) : 0;
  const isComplete = sessionMinutes >= dailyGoal;

  const getMotivationalText = () => {
    if (isComplete) return 'Goal completed! Amazing focus today!';
    if (progress >= 75) return 'Almost there! Just a little more!';
    if (progress >= 50) return 'Halfway there! Keep pushing!';
    if (progress >= 25) return 'Good start! You are making progress!';
    return 'Set your daily learning goal and start tracking!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-xl p-4 border border-white/5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <HiTarget className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-white">Daily Goal</h3>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Focus Time</span>
        <span className="text-sm font-bold text-white">
          {Math.round(sessionMinutes)} / {dailyGoal} min
        </span>
      </div>

      <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-primary-400 to-primary-600'
          }`}
        />
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <HiCheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      <p className="text-[10px] text-gray-500 mb-3">{getMotivationalText()}</p>

      <div className="flex gap-1.5">
        {GOAL_OPTIONS.map((min) => (
          <button
            key={min}
            onClick={() => dispatch(setDailyGoal(min))}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all border ${
              dailyGoal === min
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                : 'text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            {min}m
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <HiClock className="w-3 h-3" />
          Focus: {Math.round(focusMinutes)}m
        </span>
        <span>{100 - progress}% remaining</span>
      </div>
    </motion.div>
  );
};

export default DailyGoalCard;

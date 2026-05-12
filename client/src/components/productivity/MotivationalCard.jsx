import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectDoomscroll } from '../../store/slices/doomscrollSlice';
import { selectStreak } from '../../store/slices/productivitySlice';
import { HiLightningBolt, HiFire, HiStar, HiEmojiHappy, HiSparkles, HiHeart } from 'react-icons/hi';

const MOTIVATIONAL_MESSAGES = [
  { minScore: 0, messages: [
    'Every master was once a beginner. Keep going!',
    'Small steps lead to big results. Stay consistent!',
    'Your brain is building new connections right now.',
    'The only bad session is the one you did not start.',
  ]},
  { minScore: 30, messages: [
    'You are building momentum! Keep showing up.',
    'Progress, not perfection. You are doing great!',
    'Neural pathways are strengthening. Keep at it!',
    'Your future self will thank you for this effort.',
  ]},
  { minScore: 60, messages: [
    'You are in the zone! Great focus today.',
    'Productivity is a habit, and you are building it!',
    'Your consistency is paying off. Stay focused!',
    'You are not just watching — you are learning!',
  ]},
  { minScore: 80, messages: [
    'Exceptional focus! You are a learning machine!',
    'Your productivity is on fire! Keep blazing!',
    'Elite level focus detected. You are crushing it!',
    'You have unlocked high-performance mode!',
  ]},
];

const MILESTONES = [
  { days: 1, label: 'First Step', icon: '🌱' },
  { days: 3, label: 'Getting Started', icon: '🌿' },
  { days: 7, label: 'Week Warrior', icon: '🔥' },
  { days: 14, label: 'Fortnight Focus', icon: '🎯' },
  { days: 30, label: 'Monthly Master', icon: '🏆' },
  { days: 50, label: 'Half Century', icon: '⭐' },
  { days: 100, label: 'Century Club', icon: '💯' },
  { days: 365, label: 'Year Warrior', icon: '👑' },
];

const MotivationalCard = ({ className = '' }) => {
  const { doomscrollScore, isDoomscrolling } = useSelector(selectDoomscroll);
  const { current: streak } = useSelector(selectStreak);
  const [message, setMessage] = useState('');
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestone, setMilestone] = useState(null);

  const getMessage = useCallback(() => {
    const score = 100 - doomscrollScore;
    const tier = [...MOTIVATIONAL_MESSAGES].reverse().find(t => score >= t.minScore) || MOTIVATIONAL_MESSAGES[0];
    return tier.messages[Math.floor(Math.random() * tier.messages.length)];
  }, [doomscrollScore]);

  useEffect(() => {
    setMessage(getMessage());
    const interval = setInterval(() => {
      setMessage(getMessage());
    }, 30000);
    return () => clearInterval(interval);
  }, [getMessage]);

  useEffect(() => {
    const matched = [...MILESTONES].reverse().find(m => streak >= m.days && streak % m.days === 0);
    if (matched && streak > 0) {
      setMilestone(matched);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 5000);
    }
  }, [streak]);

  const score = 100 - doomscrollScore;
  const icon = score >= 80 ? <HiStar className="w-5 h-5 text-yellow-400" /> :
    score >= 60 ? <HiLightningBolt className="w-5 h-5 text-primary-400" /> :
    score >= 40 ? <HiSparkles className="w-5 h-5 text-orange-400" /> :
    <HiHeart className="w-5 h-5 text-red-400" />;

  return (
    <>
      <AnimatePresence>
        {showMilestone && milestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel-strong rounded-2xl p-6 border border-primary-500/30 shadow-glass-xl text-center"
          >
            <p className="text-4xl mb-2">{milestone.icon}</p>
            <p className="text-lg font-bold text-white">{milestone.label}</p>
            <p className="text-sm text-gray-400 mt-1">{streak} day streak!</p>
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: Math.min(streak, 5) }, (_, i) => (
                <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="text-lg">🔥</motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-panel rounded-xl p-4 border border-white/5 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            score >= 80 ? 'bg-yellow-500/10' :
            score >= 60 ? 'bg-primary-500/10' :
            score >= 40 ? 'bg-orange-500/10' : 'bg-red-500/10'
          }`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {isDoomscrolling ? 'Take a moment to reset' : 'Keep it up!'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{message}</p>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <HiFire className={`w-3 h-3 ${streak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
            <span className={streak > 0 ? 'text-orange-400 font-medium' : 'text-gray-600'}>{streak}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default MotivationalCard;

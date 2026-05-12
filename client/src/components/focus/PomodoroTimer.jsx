import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  selectTimer, selectTimeLeft, selectIsRunning,
  startTimer, pauseTimer, resetTimer, tick, switchMode, completeSession, syncTimer,
} from '../../store/slices/timerSlice';
import { logSession } from '../../store/slices/productivitySlice';
import { store } from '../../store/store';
import { HiPlay, HiPause, HiRefresh } from 'react-icons/hi';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const PomodoroTimer = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { mode, sessions, focusDuration, shortBreak, longBreak } = useSelector(selectTimer);
  const timeLeft = useSelector(selectTimeLeft);
  const isRunning = useSelector(selectIsRunning);
  const intervalRef = useRef(null);

  const totalTime = mode === 'focus' ? focusDuration
    : mode === 'shortBreak' ? shortBreak : longBreak;
  const percentage = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    dispatch(syncTimer());
  }, [dispatch]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const state = store.getState();
        if (state?.timer?.timeLeft <= 1) {
          clearInterval(intervalRef.current);
          dispatch(completeSession());
          if (mode === 'focus') {
            dispatch(logSession({ duration: totalTime, type: 'focus' }));
          }
        } else {
          dispatch(tick());
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, dispatch, mode, totalTime]);

  useEffect(() => {
    const handleVis = () => {
      if (document.hidden && isRunning) {
        clearInterval(intervalRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [isRunning]);

  const handleStart = () => {
    const state = store.getState();
    if (state?.timer?.timeLeft <= 0) {
      dispatch(resetTimer());
    }
    dispatch(startTimer());
  };

  const modes = [
    { id: 'focus', label: 'Focus', duration: focusDuration },
    { id: 'shortBreak', label: 'Short Break', duration: shortBreak },
    { id: 'longBreak', label: 'Long Break', duration: longBreak },
  ];

  return (
    <div className={`glass-panel-strong rounded-2xl p-6 border border-white/5 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
        <h3 className="text-sm font-semibold text-white">Focus Timer</h3>
      </div>

      <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl mb-6">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => !isRunning && dispatch(switchMode(m.id))}
            disabled={isRunning}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              mode === m.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                : 'text-gray-400 hover:text-white'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="115" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle
            cx="130" cy="130" r="115" fill="none"
            stroke={`rgb(var(--color-primary-500))`}
            strokeWidth="8" strokeLinecap="round"
            initial={{ strokeDashoffset: 2 * Math.PI * 115 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 115 * (1 - percentage / 100) }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ strokeDasharray: 2 * Math.PI * 115, opacity: 0.6 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timeLeft}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold text-white tabular-nums tracking-tight"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="text-xs text-gray-500 mt-1.5 capitalize">{mode.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRunning ? () => dispatch(pauseTimer()) : handleStart}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border ${
            isRunning
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
              : 'bg-primary-500 text-white border-primary-400/30 hover:bg-primary-400 shadow-glow-sm'
          }`}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <HiPause className="w-5 h-5" /> : <HiPlay className="w-5 h-5 ml-0.5" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => dispatch(resetTimer())}
          className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all"
          aria-label="Reset"
        >
          <HiRefresh className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-xs text-gray-500">
          Sessions completed: <span className="text-primary-400 font-medium">{sessions}</span>
        </p>
      </div>
    </div>
  );
};

export default PomodoroTimer;

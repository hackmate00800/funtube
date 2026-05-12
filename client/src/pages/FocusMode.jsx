import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import PomodoroTimer from '../components/focus/PomodoroTimer';
import StudyStats from '../components/focus/StudyStats';
import StreakTracker from '../components/focus/StreakTracker';
import AiDistractionDetector from '../components/focus/AiDistractionDetector';
import LearningAnalytics from '../components/focus/LearningAnalytics';
import FocusToggle from '../components/focus/FocusToggle';
import {
  selectFocus, setHideRecommendations, setHideComments,
  setDisableAutoplay, setHideShorts, setDistractionBlockLevel,
} from '../store/slices/focusSlice';
import { HiEyeOff, HiAdjustments, HiShieldCheck } from 'react-icons/hi';
import GlassSwitch from '../components/ui/Switch';

const FocusMode = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectFocus);

  const distractionLevels = [
    { value: 'low', label: 'Low', desc: 'Basic distraction blocking' },
    { value: 'medium', label: 'Medium', desc: 'Hide recommendations + comments' },
    { value: 'high', label: 'High', desc: 'Block everything, fullscreen mode' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <HiEyeOff className="w-4 h-4 text-white" />
            </span>
            Focus Mode
          </h1>
          <p className="text-sm text-gray-400 mt-1">Eliminate distractions and maximize your learning</p>
        </div>
        <FocusToggle className="w-full sm:w-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <PomodoroTimer />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <LearningAnalytics />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="glass-panel-strong rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <HiAdjustments className="w-4 h-4 text-primary-400" />
                <h3 className="text-sm font-semibold text-white">Blocking Settings</h3>
              </div>
              <div className="space-y-3">
                <GlassSwitch
                  checked={settings.hideRecommendations}
                  onChange={() => dispatch(setHideRecommendations(!settings.hideRecommendations))}
                  label="Hide Recommendations"
                  disabled={!settings.enabled}
                />
                <GlassSwitch
                  checked={settings.hideComments}
                  onChange={() => dispatch(setHideComments(!settings.hideComments))}
                  label="Hide Comments"
                  disabled={!settings.enabled}
                />
                <GlassSwitch
                  checked={settings.disableAutoplay}
                  onChange={() => dispatch(setDisableAutoplay(!settings.disableAutoplay))}
                  label="Disable Autoplay"
                  disabled={!settings.enabled}
                />
                <GlassSwitch
                  checked={settings.hideShorts}
                  onChange={() => dispatch(setHideShorts(!settings.hideShorts))}
                  label="Hide Shorts"
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <StreakTracker />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StudyStats />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <AiDistractionDetector />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <HiShieldCheck className="w-4 h-4 text-primary-400" />
                <h3 className="text-sm font-semibold text-white">Block Level</h3>
              </div>
              <div className="space-y-2">
                {distractionLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => dispatch(setDistractionBlockLevel(level.value))}
                    disabled={!settings.enabled}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 border ${
                      settings.distractionBlockLevel === level.value
                        ? 'bg-primary-500/10 border-primary-500/20'
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      level.value === 'high' ? 'bg-red-400' :
                      level.value === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div>
                      <p className="text-xs font-medium text-white">{level.label}</p>
                      <p className="text-[10px] text-gray-500">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default FocusMode;

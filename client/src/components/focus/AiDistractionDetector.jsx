import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  logDistraction, logDistractionBlocked, addAiSuggestion,
  selectFocusScore,
} from '../../store/slices/productivitySlice';
import { selectFocusEnabled } from '../../store/slices/focusSlice';
import { HiShieldCheck, HiLightningBolt, HiExclamation, HiX } from 'react-icons/hi';

const AiDistractionDetector = ({ className = '' }) => {
  const dispatch = useDispatch();
  const focusEnabled = useSelector(selectFocusEnabled);
  const focusScore = useSelector(selectFocusScore);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (!focusEnabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        dispatch(logDistraction());
        const msgs = [
          'Stay focused! You left the tab.',
          'Distraction detected! Come back to learning.',
          'Your study session is waiting...',
        ];
        setAlertMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 4000);
      }
    };

    const handleMouseLeave = (e) => {
      if (e.clientY < 0) {
        dispatch(logDistraction());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('mouseleave', handleMouseLeave);

    const suggestionTimer = setInterval(() => {
      dispatch(addAiSuggestion({
        title: 'Stay on track',
        text: focusScore < 50
          ? 'Your focus score is dropping. Try a shorter session.'
          : 'Great focus! Keep up the momentum.',
        type: focusScore < 50 ? 'warning' : 'tip',
      }));
    }, 120000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(suggestionTimer);
    };
  }, [focusEnabled, dispatch, focusScore]);

  const handleBlockDistraction = () => {
    dispatch(logDistractionBlocked());
    setShowAlert(false);
  };

  return (
    <div className={className}>
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[60] glass-panel-strong rounded-xl p-4 border border-yellow-500/30 shadow-glass-xl min-w-[320px]"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 flex-shrink-0">
                <HiExclamation className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Distraction Detected</p>
                <p className="text-xs text-gray-400 mt-0.5">{alertMessage}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleBlockDistraction}
                    className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-400 transition-colors"
                  >
                    <HiShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                    Block & Continue
                  </button>
                  <button
                    onClick={() => setShowAlert(false)}
                    className="text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={() => setShowAlert(false)} className="p-1 hover:bg-white/5 rounded-lg">
                <HiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel rounded-xl p-3 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HiLightningBolt className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-medium text-white">AI Focus Shield</span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            focusScore >= 80 ? 'bg-green-500/10 text-green-400' :
            focusScore >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-red-500/10 text-red-400'
          }`}>
            Score: {focusScore}
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${focusScore}%` }}
            className="h-full rounded-full transition-all duration-500"
            style={{
              background: focusScore >= 80
                ? 'linear-gradient(90deg, rgb(var(--color-primary-400)), rgb(var(--color-primary-600)))'
                : focusScore >= 50
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #ef4444, #dc2626)',
            }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5">
          {focusEnabled ? 'Monitoring for distractions' : 'Enable focus mode to activate'}
        </p>
      </div>
    </div>
  );
};

export default AiDistractionDetector;

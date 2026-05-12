import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setFullscreenLearning, selectFocus } from '../../store/slices/focusSlice';
import { selectTimer, startTimer, pauseTimer } from '../../store/slices/timerSlice';
import { HiX, HiArrowsExpand } from 'react-icons/hi';

const FocusOverlay = ({ children, onClose }) => {
  const dispatch = useDispatch();
  const { fullscreenLearning } = useSelector(selectFocus);
  const { mode, timeLeft, isRunning } = useSelector(selectTimer);

  useEffect(() => {
    if (fullscreenLearning) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [fullscreenLearning]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {fullscreenLearning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-dark-950 flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-dark-950/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-primary-400">Focus Mode</span>
                  <span className="text-xs text-gray-500">|</span>
                  <span className="text-xs text-gray-400 capitalize">{mode.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`text-sm font-bold tabular-nums ${isRunning ? 'text-primary-400' : 'text-gray-400'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(setFullscreenLearning(false))}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    aria-label="Exit fullscreen"
                  >
                    <HiArrowsExpand className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      dispatch(setFullscreenLearning(false));
                      onClose?.();
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    aria-label="Close focus mode"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-5xl">{children}</div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-950/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch(isRunning ? pauseTimer() : startTimer())}
                  className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl text-sm font-medium border border-primary-500/20 hover:bg-primary-500/30 transition-all"
                >
                  {isRunning ? 'Pause Session' : 'Start Session'}
                </motion.button>
                {!isRunning && mode !== 'focus' && (
                  <p className="text-xs text-gray-500">Break time! Step away for a moment.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FocusOverlay;

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toggleFocusMode, selectFocusEnabled } from '../../store/slices/focusSlice';
import { HiEyeOff, HiEye } from 'react-icons/hi';

const FocusToggle = ({ className = '' }) => {
  const dispatch = useDispatch();
  const enabled = useSelector(selectFocusEnabled);

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => dispatch(toggleFocusMode())}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 border ${
        enabled
          ? 'bg-primary-500/10 text-primary-400 border-primary-500/20 shadow-glow-sm'
          : 'glass-panel text-gray-400 hover:text-white border-white/5 hover:border-white/10'
      } ${className}`}
      aria-label={enabled ? 'Disable focus mode' : 'Enable focus mode'}
      aria-pressed={enabled}
    >
      <motion.div
        animate={enabled ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {enabled ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
      </motion.div>
      <div className="text-left">
        <p className="font-medium">{enabled ? 'Focus Mode On' : 'Focus Mode'}</p>
        <p className="text-[10px] opacity-60">{enabled ? 'Distractions blocked' : 'Stay focused'}</p>
      </div>
      <motion.div
        animate={enabled ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: enabled ? Infinity : 0, duration: 2 }}
        className={`w-2 h-2 rounded-full ${enabled ? 'bg-primary-400' : 'bg-gray-600'}`}
      />
    </motion.button>
  );
};

export default FocusToggle;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiChevronDown, HiClock } from 'react-icons/hi';

const SummarySection = ({ title, content, timestamp, onSeek, index }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-panel rounded-xl overflow-hidden border border-white/5"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <HiChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        {timestamp && (
          <button
            onClick={(e) => { e.stopPropagation(); onSeek?.(timestamp); }}
            className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 bg-primary-500/10 px-2 py-0.5 rounded-full transition-colors"
          >
            <HiClock className="w-3 h-3" />
            {formatTime(timestamp)}
          </button>
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="px-4 pb-3"
        >
          <p className="text-xs text-gray-300 leading-relaxed">{content}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default SummarySection;

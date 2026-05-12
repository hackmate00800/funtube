import React from 'react';
import { motion } from 'framer-motion';

const levels = [
  { id: 'beginner', label: 'Beginner', description: 'Simple overview' },
  { id: 'intermediate', label: 'Intermediate', description: 'Detailed insights' },
  { id: 'expert', label: 'Expert', description: 'Deep analysis' },
];

const SummaryLevelSelector = ({ level, onChange }) => (
  <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
    {levels.map((l) => (
      <button
        key={l.id}
        onClick={() => onChange(l.id)}
        className={`relative flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
          level === l.id ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        {level === l.id && (
          <motion.div
            layoutId="summary-level"
            className="absolute inset-0 bg-primary-500/20 rounded-md border border-primary-500/30"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex flex-col items-center">
          <span>{l.label}</span>
          <span className="text-[9px] text-gray-500 mt-0.5">{l.description}</span>
        </span>
      </button>
    ))}
  </div>
);

export default SummaryLevelSelector;

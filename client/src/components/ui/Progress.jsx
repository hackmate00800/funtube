import React from 'react';
import { motion } from 'framer-motion';

const GlassProgress = ({ value = 0, max = 100, label, showValue = false, size = 'md', color = 'primary', className = '' }) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showValue && <span className="text-sm text-gray-400">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${sizes[size] || sizes.md}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, rgb(var(--color-primary-400)), rgb(var(--color-primary-600)))` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer opacity-30" />
        </motion.div>
      </div>
    </div>
  );
};

export default GlassProgress;

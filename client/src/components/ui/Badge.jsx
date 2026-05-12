import React from 'react';
import { motion } from 'framer-motion';

const colors = {
  primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gray: 'bg-white/5 text-gray-400 border-white/10',
  glass: 'badge-glass',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const GlassBadge = ({ children, color = 'primary', size = 'md', dot = false, pulse = false, className = '' }) => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colors[color] || colors.primary} ${sizes[size] || sizes.md} ${className}`}
  >
    {dot && (
      <span className={`relative w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-ping-slow' : ''}`} />
    )}
    {children}
  </motion.span>
);

export default GlassBadge;

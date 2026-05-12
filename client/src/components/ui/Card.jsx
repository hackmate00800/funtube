import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = false, glow = false, elevated = false, onClick, ...props }) => {
  const base = elevated ? 'glass-card-elevated' : 'glass-panel rounded-xl overflow-hidden';
  const hoverStyles = hover ? 'hover:bg-dark-800/80 hover:border-white/10 cursor-pointer hover:shadow-glow-sm' : '';
  const glowStyles = glow ? 'shadow-glow-sm border-primary-500/10' : '';
  const transition = 'transition-all duration-300';

  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { scale: 1.01, y: -2 },
    whileTap: { scale: 0.99 },
    onClick,
  } : {};

  return (
    <Component
      className={`${base} ${hoverStyles} ${glowStyles} ${transition} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const GlassCardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-white/5 ${className}`}>{children}</div>
);

export const GlassCardBody = ({ children, className = '' }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

export const GlassCardFooter = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-t border-white/5 ${className}`}>{children}</div>
);

export default GlassCard;

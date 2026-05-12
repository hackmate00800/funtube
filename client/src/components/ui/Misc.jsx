import React from 'react';
import { motion } from 'framer-motion';

const GlassDivider = ({ label, className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`} role="separator">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    {label && (
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
    )}
    {!label && <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
  </div>
);

export const GlassStat = ({ icon: Icon, label, value, color = 'primary', trend, subtitle, className = '' }) => {
  const colors = {
    primary: 'text-primary-400 bg-primary-500/10',
    success: 'text-green-400 bg-green-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    danger: 'text-red-400 bg-red-500/10',
    info: 'text-blue-400 bg-blue-500/10',
    white: 'text-white bg-white/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-5 hover:bg-dark-800/80 hover:border-white/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color] || colors.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        {trend !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              trend >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            }`}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </motion.span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
};

export const GlassEmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    {Icon && (
      <div className="p-4 rounded-2xl bg-white/5 mb-4 ring-1 ring-white/10">
        <Icon className="w-10 h-10 text-gray-500" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-1">{title || 'Nothing here'}</h3>
    <p className="text-sm text-gray-400 max-w-sm mb-6">{description || ''}</p>
    {action}
  </motion.div>
);

export default GlassDivider;

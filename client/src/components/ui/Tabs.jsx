import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'videos', label: 'Videos' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'about', label: 'About' },
];

const GlassTabs = ({ tabs = TABS, active, onChange, className = '', variant = 'pills' }) => {
  if (variant === 'underline') {
    return (
      <div className={`flex gap-0 border-b border-white/5 ${className}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={active === tab.id}
            className={`relative px-5 py-3 text-sm font-medium transition-all duration-200 ${
              active === tab.id ? 'text-primary-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            {active === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 p-1 glass-panel rounded-xl w-fit ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={active === tab.id}
          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            active === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 bg-primary-500/20 rounded-lg border border-primary-500/30"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs text-gray-500">({tab.count})</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export default GlassTabs;

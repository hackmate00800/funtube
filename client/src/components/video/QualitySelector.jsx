import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCog, HiCheck } from 'react-icons/hi';

const QualitySelector = ({ resolutions = [], currentQuality, onQualityChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!resolutions.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors border border-white/10"
      >
        <HiCog className="w-3.5 h-3.5" />
        {currentQuality}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute bottom-full right-0 mb-2 glass-panel-strong rounded-xl shadow-glass-xl py-1.5 min-w-[120px] border border-white/10"
          >
            {resolutions.map((res) => (
              <button
                key={res}
                onClick={() => { onQualityChange(res); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  res === currentQuality
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{res}</span>
                {res === currentQuality && <HiCheck className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QualitySelector;

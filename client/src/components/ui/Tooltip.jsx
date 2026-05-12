import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlassTooltip = ({ children, content, position = 'top', className = '' }) => {
  const [show, setShow] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const animations = {
    top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.div
            initial={{ opacity: 0, ...animations[position].initial }}
            animate={{ opacity: 1, ...animations[position].animate }}
            exit={{ opacity: 0, ...animations[position].initial }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positions[position]} pointer-events-none`}
            role="tooltip"
          >
            <div className="bg-dark-700/95 backdrop-blur-xl text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg whitespace-nowrap">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassTooltip;

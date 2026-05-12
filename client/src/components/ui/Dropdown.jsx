import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlassDropdown = ({ trigger, children, align = 'right', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)} aria-expanded={open} aria-haspopup="true">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} min-w-[200px] glass-panel-strong rounded-xl shadow-glass-xl py-1.5 z-50`}
            role="menu"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ children, icon: Icon, onClick, danger = false, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    } ${className}`}
    role="menuitem"
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

export const DropdownDivider = () => <div className="my-1 border-t border-white/5" />;

export default GlassDropdown;

import React from 'react';
import { motion } from 'framer-motion';

const GlassSwitch = ({ checked, onChange, label, disabled = false, className = '' }) => {
  const id = React.useId();

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          aria-checked={checked}
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 border ${checked ? 'bg-primary-500/30 border-primary-500/30' : 'bg-white/[0.08] border-white/10'}`}
        >
          <motion.div
            animate={{ x: checked ? 16 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 rounded-full bg-white shadow-sm mt-[-1px] ml-[-1px]"
          />
        </div>
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
};

export default GlassSwitch;

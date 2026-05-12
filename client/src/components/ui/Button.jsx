import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  glass: 'btn-glass',
  gradient: 'btn-gradient',
  danger: 'btn-danger',
  icon: 'btn-icon',
};

const sizes = {
  sm: 'py-1.5 px-3 text-xs gap-1.5',
  md: 'py-2.5 px-5 text-sm gap-2',
  lg: 'py-3 px-7 text-base gap-2.5',
  xl: 'py-3.5 px-8 text-lg gap-3',
};

const GlassButton = ({ variant = 'primary', size = 'md', icon: Icon, children, className = '', loading, disabled, onClick, type = 'button', ...props }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.97 }}
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-label="Loading">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : Icon ? <Icon className="w-4 h-4" aria-hidden="true" /> : null}
    {variant === 'gradient' ? <span>{children}</span> : children}
  </motion.button>
);

export default GlassButton;

import React from 'react';
import { motion } from 'framer-motion';

const colors = {
  primary: 'ring-primary-500/30 bg-primary-500/20 text-primary-400',
  success: 'ring-green-500/30 bg-green-500/20 text-green-400',
  warning: 'ring-yellow-500/30 bg-yellow-500/20 text-yellow-400',
  danger: 'ring-red-500/30 bg-red-500/20 text-red-400',
  info: 'ring-blue-500/30 bg-blue-500/20 text-blue-400',
};

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
};

const GlassAvatar = ({ src, name, color = 'primary', size = 'md', status, glow = false, className = '' }) => {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [isDark, setIsDark] = React.useState(true);
  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative flex-shrink-0 ${sizes[size] || sizes.md} ${glow ? 'shadow-glow-sm rounded-full' : ''} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          className={`w-full h-full rounded-full object-cover ring-2 ${colors[color]?.split(' ')[0] || 'ring-primary-500/30'}`}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-semibold ring-2 ${colors[color] || colors.primary}`}
          aria-label={name || 'User avatar'}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
            isDark ? 'border-dark-950' : 'border-white'
          } ${
            status === 'online' ? 'bg-green-500 shadow-sm shadow-green-500/50' :
            status === 'away' ? 'bg-yellow-500 shadow-sm shadow-yellow-500/50' :
            status === 'busy' ? 'bg-red-500 shadow-sm shadow-red-500/50' :
            'bg-gray-500'
          }`}
          aria-label={`Status: ${status}`}
        />
      )}
    </motion.div>
  );
};

export default GlassAvatar;

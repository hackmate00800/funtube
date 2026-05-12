import React from 'react';
import { motion } from 'framer-motion';

const GlassSkeleton = ({ className = '', count = 1, type = 'text' }) => {
  const types = {
    text: 'h-4 w-full rounded-lg',
    title: 'h-6 w-3/4 rounded-lg',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    thumbnail: 'aspect-video w-full rounded-xl',
    stat: 'h-24 w-full rounded-xl',
    button: 'h-10 w-24 rounded-xl',
    badge: 'h-6 w-16 rounded-full',
    circle: 'w-12 h-12 rounded-full',
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {items.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`skeleton ${types[type] || types.text} ${className}`}
        />
      ))}
    </div>
  );
};

export default GlassSkeleton;

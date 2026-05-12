import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const CategoryBar = ({ categories, selected, onSelect }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-dark-950/90 backdrop-blur-sm hover:bg-dark-800 rounded-xl transition-colors border border-white/5"
        aria-label="Scroll left"
      >
        <HiChevronLeft className="text-lg text-gray-400" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-2"
      >
        {categories.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => onSelect(cat)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
              selected === cat
                ? 'bg-primary-500 text-white border-primary-500 shadow-glow-sm'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-dark-950/90 backdrop-blur-sm hover:bg-dark-800 rounded-xl transition-colors border border-white/5"
        aria-label="Scroll right"
      >
        <HiChevronRight className="text-lg text-gray-400" />
      </button>
    </div>
  );
};

export default CategoryBar;

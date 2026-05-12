import React, { useRef, useCallback } from 'react';

const GlassSlider = ({ value = 0, min = 0, max = 100, step = 1, onChange, label, className = '' }) => {
  const percent = ((value - min) / (max - min)) * 100;
  const trackRef = useRef(null);

  const handleClick = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const newVal = Math.round((min + x * (max - min)) / step) * step;
    onChange?.(Math.min(max, Math.max(min, newVal)));
  }, [min, max, step, onChange]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{label}</span>
          <span className="text-sm text-gray-300 font-medium">{value}</span>
        </div>
      )}
      <div
        ref={trackRef}
        onClick={handleClick}
        className="relative h-2 bg-white/5 rounded-full cursor-pointer group"
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange?.(Math.min(max, value + step));
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange?.(Math.max(min, value - step));
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, rgb(var(--color-primary-400)), rgb(var(--color-primary-600)))`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-dark-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default GlassSlider;

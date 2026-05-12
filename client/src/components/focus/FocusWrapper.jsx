import React from 'react';
import { useSelector } from 'react-redux';
import { selectFocusEnabled, selectFocus } from '../../store/slices/focusSlice';

const FocusWrapper = ({ children, type = 'recommendations' }) => {
  const enabled = useSelector(selectFocusEnabled);
  const settings = useSelector(selectFocus);

  if (!enabled) return children;

  const shouldHide =
    (type === 'recommendations' && settings.hideRecommendations) ||
    (type === 'comments' && settings.hideComments) ||
    (type === 'shorts' && settings.hideShorts);

  if (!shouldHide) return children;

  return (
    <div className="relative group">
      <div className="relative blur-[2px] opacity-30 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass-panel-strong rounded-xl px-5 py-3 text-center border border-primary-500/20 shadow-glow-sm">
          <p className="text-sm font-medium text-primary-400">Focus Mode Active</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {type === 'recommendations' ? 'Recommendations are hidden while in focus mode' :
             type === 'comments' ? 'Comments are hidden while in focus mode' :
             type === 'shorts' ? 'Shorts are hidden while in focus mode' :
             'Content hidden in focus mode'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FocusWrapper;

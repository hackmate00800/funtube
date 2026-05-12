import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectDoomscroll } from '../store/slices/doomscrollSlice';
import { tickSession } from '../store/slices/usageSlice';
import { productivityAPI } from '../services/productivityAPI';

const useBehaviorTracking = (enabled = true) => {
  const dispatch = useDispatch();
  const { sessionId, sessionActive } = useSelector(selectDoomscroll);
  const tickRef = useRef(null);
  const lastTrackRef = useRef(0);

  const trackBehavior = useCallback((type, data = {}) => {
    if (!enabled || !sessionId) return;

    const now = Date.now();
    if (now - lastTrackRef.current < 2000) return;
    lastTrackRef.current = now;

    productivityAPI.trackEvent(sessionId, { type, data, timestamp: now })
      .catch(() => {});
  }, [enabled, sessionId]);

  useEffect(() => {
    if (!enabled || !sessionActive) return;

    tickRef.current = setInterval(() => {
      dispatch(tickSession());
    }, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') return;
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const pageViewTracked = new Set();

    const observer = new MutationObserver(() => {
      const main = document.querySelector('main');
      if (main && !pageViewTracked.has(window.location.pathname)) {
        pageViewTracked.add(window.location.pathname);
        trackBehavior('page_view', { path: window.location.pathname });
        setTimeout(() => pageViewTracked.delete(window.location.pathname), 30000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
    };
  }, [enabled, sessionActive, dispatch, trackBehavior]);

  const trackPageView = useCallback((path) => {
    trackBehavior('page_view', { path });
  }, [trackBehavior]);

  const trackVideoWatch = useCallback((videoId, duration) => {
    trackBehavior('video_watch', { videoId, duration });
  }, [trackBehavior]);

  const trackFocusEnter = useCallback((duration) => {
    trackBehavior('focus_enter', { duration });
  }, [trackBehavior]);

  const trackSearch = useCallback((query) => {
    trackBehavior('search', { query });
  }, [trackBehavior]);

  const trackClick = useCallback((target, label) => {
    trackBehavior('click', { target, label });
  }, [trackBehavior]);

  return {
    trackPageView,
    trackVideoWatch,
    trackFocusEnter,
    trackSearch,
    trackClick,
  };
};

export default useBehaviorTracking;

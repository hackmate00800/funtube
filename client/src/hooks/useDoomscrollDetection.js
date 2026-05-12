import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startSession, endSession, trackScroll, showAlert,
  resetDoomscore, incrementSessionCount, selectDoomscroll,
} from '../store/slices/doomscrollSlice';

const SCROLL_THROTTLE = 100;
const DOOMSCROLL_ALERT_THRESHOLD = 45;
const DOOMSCROLL_CRITICAL_THRESHOLD = 70;

const ALERT_MESSAGES = [
  { message: "You're scrolling very fast. Take a breath and find something intentional to watch.", level: 'warning' },
  { message: 'Mindless scrolling detected! Remember why you opened FunTube.', level: 'warning' },
  { message: 'Your doomscore is rising. Try searching for a specific topic instead.', level: 'warning' },
  { message: 'Time to break the scroll loop! Stand up and stretch for 30 seconds.', level: 'critical' },
  { message: 'Critical: You are deep in a doomscroll. Close this tab and take a walk.', level: 'critical' },
  { message: 'Your brain is on autopilot. Type what you want to learn in the search bar now.', level: 'warning' },
];

const useDoomscrollDetection = (enabled = true) => {
  const dispatch = useDispatch();
  const lastEventRef = useRef({ time: 0, position: 0 });
  const intervalRef = useRef(null);
  const alertCooldownRef = useRef(0);
  const { sessionActive, sessionId, doomscrollScore, alertsShown } = useSelector(selectDoomscroll);

  const getRandomAlert = () => ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)];

  const handleScroll = useCallback(() => {
    if (!enabled || !sessionActive) return;

    const now = Date.now();
    const elapsed = now - lastEventRef.current.time;
    if (elapsed < SCROLL_THROTTLE) return;

    const currentPos = window.scrollY || window.pageYOffset;
    const distance = Math.abs(currentPos - lastEventRef.current.position);
    const velocity = elapsed > 0 ? Math.round((distance / elapsed) * 1000) : 0;

    lastEventRef.current = { time: now, position: currentPos };

    dispatch(trackScroll({ velocity, distance, timestamp: now }));

    const state = window.__store?.getState();
    const currentScore = state?.doomscroll?.doomscrollScore || 0;

    if (currentScore >= DOOMSCROLL_ALERT_THRESHOLD && now - alertCooldownRef.current > 15000) {
      alertCooldownRef.current = now;
      dispatch(showAlert());
      const alert = getRandomAlert();
      const event = new CustomEvent('doomscroll-alert', {
        detail: { score: currentScore, message: alert.message, level: alert.level },
      });
      window.dispatchEvent(event);
    }

    if (currentScore >= DOOMSCROLL_CRITICAL_THRESHOLD && now - alertCooldownRef.current > 30000) {
      alertCooldownRef.current = now;
      const alert = getRandomAlert();
      const event = new CustomEvent('doomscroll-critical', {
        detail: { score: currentScore, message: alert.message },
      });
      window.dispatchEvent(event);
    }
  }, [enabled, sessionActive, dispatch]);

  useEffect(() => {
    if (!enabled) return;

    lastEventRef.current = { time: Date.now(), position: window.scrollY || 0 };
    dispatch(startSession());
    dispatch(incrementSessionCount());

    window.addEventListener('scroll', handleScroll, { passive: true });

    intervalRef.current = setInterval(() => {
      const state = window.__store?.getState();
      const score = state?.doomscroll?.doomscrollScore || 0;
      if (score > 0 && sessionActive) {
        dispatch(trackScroll({ velocity: 0, distance: 0, timestamp: Date.now() }));
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sessionActive) {
        dispatch(endSession());
      }
    };
  }, [enabled, dispatch, handleScroll, sessionActive]);

  const resetDoomscoreHandler = useCallback(() => {
    dispatch(resetDoomscore());
    alertCooldownRef.current = 0;
  }, [dispatch]);

  return {
    doomscrollScore,
    sessionActive,
    sessionId,
    alertsShown,
    resetDoomscore: resetDoomscoreHandler,
    isAlerting: doomscrollScore >= DOOMSCROLL_ALERT_THRESHOLD,
    isCritical: doomscrollScore >= DOOMSCROLL_CRITICAL_THRESHOLD,
  };
};

export default useDoomscrollDetection;

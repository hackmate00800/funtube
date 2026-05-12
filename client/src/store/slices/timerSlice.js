import { createSlice } from '@reduxjs/toolkit';

const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const loadState = () => {
  try {
    const saved = localStorage.getItem('funtime-timer');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const initialState = loadState() || {
  mode: 'focus',
  timeLeft: FOCUS_DURATION,
  isRunning: false,
  sessions: 0,
  completedSessions: 0,
  focusDuration: FOCUS_DURATION,
  shortBreak: SHORT_BREAK,
  longBreak: LONG_BREAK,
  longBreakInterval: 4,
  startedAt: null,
  lastTick: null,
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.isRunning = true;
      state.startedAt = Date.now();
      state.lastTick = Date.now();
    },
    pauseTimer: (state) => {
      state.isRunning = false;
      state.startedAt = null;
      state.lastTick = null;
    },
    resetTimer: (state) => {
      state.isRunning = false;
      state.timeLeft = state.mode === 'focus' ? state.focusDuration
        : state.mode === 'shortBreak' ? state.shortBreak : state.longBreak;
      state.startedAt = null;
      state.lastTick = null;
    },
    tick: (state) => {
      if (state.isRunning && state.timeLeft > 0) {
        state.timeLeft -= 1;
        state.lastTick = Date.now();
      }
    },
    switchMode: (state, action) => {
      state.mode = action.payload;
      state.isRunning = false;
      state.startedAt = null;
      state.lastTick = null;
      if (action.payload === 'focus') {
        state.timeLeft = state.focusDuration;
      } else if (action.payload === 'shortBreak') {
        state.timeLeft = state.shortBreak;
      } else if (action.payload === 'longBreak') {
        state.timeLeft = state.longBreak;
      }
    },
    completeSession: (state) => {
      state.completedSessions += 1;
      state.sessions += 1;
      state.isRunning = false;
      state.startedAt = null;
      state.lastTick = null;
      const isLongBreak = state.sessions % state.longBreakInterval === 0;
      state.mode = isLongBreak ? 'longBreak' : 'shortBreak';
      state.timeLeft = isLongBreak ? state.longBreak : state.shortBreak;
    },
    setFocusDuration: (state, action) => {
      state.focusDuration = action.payload;
      if (state.mode === 'focus' && !state.isRunning) {
        state.timeLeft = action.payload;
      }
    },
    setShortBreak: (state, action) => {
      state.shortBreak = action.payload;
      if (state.mode === 'shortBreak' && !state.isRunning) {
        state.timeLeft = action.payload;
      }
    },
    setLongBreak: (state, action) => {
      state.longBreak = action.payload;
      if (state.mode === 'longBreak' && !state.isRunning) {
        state.timeLeft = action.payload;
      }
    },
    syncTimer: (state) => {
      if (state.isRunning && state.lastTick) {
        const elapsed = Math.floor((Date.now() - state.lastTick) / 1000);
        state.timeLeft = Math.max(0, state.timeLeft - elapsed);
        state.lastTick = Date.now();
      }
    },
  },
});

export const {
  startTimer, pauseTimer, resetTimer, tick, switchMode,
  completeSession, setFocusDuration, setShortBreak, setLongBreak, syncTimer,
} = timerSlice.actions;

export const selectTimer = (state) => state.timer;
export const selectTimeLeft = (state) => state.timer.timeLeft;
export const selectIsRunning = (state) => state.timer.isRunning;
export const selectMode = (state) => state.timer.mode;

export default timerSlice.reducer;

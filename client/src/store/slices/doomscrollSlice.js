import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const saved = localStorage.getItem('funtime-doomscroll');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const initialState = loadState() || {
  isDoomscrolling: false,
  doomscrollScore: 0,
  sessionCount: 0,
  alertsShown: 0,
  lastAlertTime: null,
  scrollEvents: [],
  sessionActive: false,
  sessionStart: null,
  sessionId: null,
  scrollVelocity: 0,
  consecutiveFastScrolls: 0,
};

const doomscrollSlice = createSlice({
  name: 'doomscroll',
  initialState,
  reducers: {
    startSession: (state) => {
      state.sessionActive = true;
      state.sessionStart = Date.now();
      state.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      state.scrollEvents = [];
      state.scrollVelocity = 0;
      state.consecutiveFastScrolls = 0;
    },
    endSession: (state) => {
      state.sessionActive = false;
      state.sessionStart = null;
      state.isDoomscrolling = false;
    },
    trackScroll: (state, action) => {
      const { velocity, distance, timestamp } = action.payload;
      state.scrollVelocity = velocity;
      state.scrollEvents.push({ velocity, distance, timestamp });
      if (state.scrollEvents.length > 100) {
        state.scrollEvents = state.scrollEvents.slice(-100);
      }
      if (velocity > 800) {
        state.consecutiveFastScrolls += 1;
      } else {
        state.consecutiveFastScrolls = Math.max(0, state.consecutiveFastScrolls - 1);
      }
      if (state.consecutiveFastScrolls > 5) {
        state.doomscrollScore = Math.min(100, state.doomscrollScore + 5);
        if (state.doomscrollScore > 40) {
          state.isDoomscrolling = true;
        }
      } else if (state.doomscrollScore > 0) {
        state.doomscrollScore = Math.max(0, state.doomscrollScore - 1);
        if (state.doomscrollScore <= 40) {
          state.isDoomscrolling = false;
        }
      }
    },
    showAlert: (state) => {
      state.alertsShown += 1;
      state.lastAlertTime = Date.now();
    },
    resetDoomscore: (state) => {
      state.doomscrollScore = 0;
      state.isDoomscrolling = false;
      state.consecutiveFastScrolls = 0;
      state.scrollVelocity = 0;
    },
    incrementSessionCount: (state) => {
      state.sessionCount += 1;
    },
  },
});

export const {
  startSession, endSession, trackScroll, showAlert,
  resetDoomscore, incrementSessionCount,
} = doomscrollSlice.actions;

export const selectDoomscroll = (state) => state.doomscroll;
export const selectIsDoomscrolling = (state) => state.doomscroll.isDoomscrolling;
export const selectDoomscore = (state) => state.doomscroll.doomscrollScore;

export default doomscrollSlice.reducer;

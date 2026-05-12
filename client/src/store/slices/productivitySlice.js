import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const saved = localStorage.getItem('funtime-productivity');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const today = () => new Date().toISOString().split('T')[0];
const thisWeek = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return start.toISOString().split('T')[0];
};

const initialState = loadState() || {
  totalFocusMinutes: 0,
  sessionsCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  dailyLog: {},
  weeklyLog: {},
  distractionsDetected: 0,
  distractionsBlocked: 0,
  focusScore: 100,
  aiSuggestions: [],
  achievements: [],
  sessionHistory: [],
};

const productivitySlice = createSlice({
  name: 'productivity',
  initialState,
  reducers: {
    logSession: (state, action) => {
      const { duration, type = 'focus' } = action.payload;
      const minutes = Math.round(duration / 60);
      const date = today();
      const week = thisWeek();

      state.totalFocusMinutes += minutes;
      state.sessionsCompleted += 1;

      if (!state.dailyLog[date]) {
        state.dailyLog[date] = { minutes: 0, sessions: 0, distractions: 0 };
      }
      state.dailyLog[date].minutes += minutes;
      state.dailyLog[date].sessions += 1;

      if (!state.weeklyLog[week]) {
        state.weeklyLog[week] = { minutes: 0, sessions: 0, daysActive: new Set() };
      }
      state.weeklyLog[week].minutes += minutes;
      state.weeklyLog[week].sessions += 1;
      state.weeklyLog[week].daysActive.add(date);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (state.lastStudyDate === yesterdayStr || !state.lastStudyDate) {
        state.currentStreak += 1;
        if (state.currentStreak > state.longestStreak) {
          state.longestStreak = state.currentStreak;
        }
      } else if (state.lastStudyDate !== date) {
        state.currentStreak = 1;
      }
      state.lastStudyDate = date;

      state.sessionHistory.push({
        date,
        duration: minutes,
        type,
        timestamp: Date.now(),
      });

      if (state.sessionHistory.length > 100) {
        state.sessionHistory = state.sessionHistory.slice(-100);
      }
    },

    logDistraction: (state) => {
      state.distractionsDetected += 1;
      const date = today();
      if (state.dailyLog[date]) {
        state.dailyLog[date].distractions += 1;
      }
      state.focusScore = Math.max(0, state.focusScore - 2);
    },

    logDistractionBlocked: (state) => {
      state.distractionsBlocked += 1;
    },

    addAiSuggestion: (state, action) => {
      state.aiSuggestions.unshift({
        id: Date.now(),
        ...action.payload,
        timestamp: Date.now(),
      });
      if (state.aiSuggestions.length > 20) {
        state.aiSuggestions = state.aiSuggestions.slice(0, 20);
      }
    },

    clearAiSuggestions: (state) => {
      state.aiSuggestions = [];
    },

    recalculateFocusScore: (state) => {
      const todayData = state.dailyLog[today()];
      if (todayData && todayData.minutes > 0) {
        const distractionRatio = todayData.distractions / todayData.sessions;
        state.focusScore = Math.max(0, Math.min(100, 100 - distractionRatio * 25));
      }
    },

    addAchievement: (state, action) => {
      const exists = state.achievements.some((a) => a.id === action.payload.id);
      if (!exists) {
        state.achievements.push({ ...action.payload, unlockedAt: Date.now() });
      }
    },

    resetProductivity: () => initialState,
  },
});

export const {
  logSession, logDistraction, logDistractionBlocked,
  addAiSuggestion, clearAiSuggestions, recalculateFocusScore,
  addAchievement, resetProductivity,
} = productivitySlice.actions;

export const selectProductivity = (state) => state.productivity;
export const selectStreak = (state) => ({
  current: state.productivity.currentStreak,
  longest: state.productivity.longestStreak,
  lastDate: state.productivity.lastStudyDate,
});
export const selectTodayStats = (state) => {
  const date = today();
  return state.productivity.dailyLog[date] || { minutes: 0, sessions: 0, distractions: 0 };
};
export const selectFocusScore = (state) => state.productivity.focusScore;

export default productivitySlice.reducer;

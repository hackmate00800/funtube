import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const saved = localStorage.getItem('funtime-focus');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const initialState = loadState() || {
  enabled: false,
  hideRecommendations: true,
  hideComments: true,
  disableAutoplay: true,
  hideShorts: true,
  fullscreenLearning: false,
  distractionBlockLevel: 'medium',
};

const focusSlice = createSlice({
  name: 'focus',
  initialState,
  reducers: {
    toggleFocusMode: (state) => { state.enabled = !state.enabled; },
    setFocusMode: (state, action) => { state.enabled = action.payload; },
    setHideRecommendations: (state, action) => { state.hideRecommendations = action.payload; },
    setHideComments: (state, action) => { state.hideComments = action.payload; },
    setDisableAutoplay: (state, action) => { state.disableAutoplay = action.payload; },
    setHideShorts: (state, action) => { state.hideShorts = action.payload; },
    setFullscreenLearning: (state, action) => { state.fullscreenLearning = action.payload; },
    setDistractionBlockLevel: (state, action) => { state.distractionBlockLevel = action.payload; },
    resetFocusSettings: () => ({
      enabled: false, hideRecommendations: true, hideComments: true,
      disableAutoplay: true, hideShorts: true, fullscreenLearning: false,
      distractionBlockLevel: 'medium',
    }),
  },
});

export const {
  toggleFocusMode, setFocusMode, setHideRecommendations, setHideComments,
  setDisableAutoplay, setHideShorts, setFullscreenLearning,
  setDistractionBlockLevel, resetFocusSettings,
} = focusSlice.actions;

export const selectFocus = (state) => state.focus;
export const selectFocusEnabled = (state) => state.focus.enabled;

export default focusSlice.reducer;

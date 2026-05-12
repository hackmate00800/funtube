import { configureStore } from '@reduxjs/toolkit';
import focusReducer from './slices/focusSlice';
import timerReducer from './slices/timerSlice';
import productivityReducer from './slices/productivitySlice';
import doomscrollReducer from './slices/doomscrollSlice';
import usageReducer from './slices/usageSlice';

const persistMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  try {
    localStorage.setItem('funtime-focus', JSON.stringify(state.focus));
    localStorage.setItem('funtime-timer', JSON.stringify(state.timer));
    localStorage.setItem('funtime-productivity', JSON.stringify(state.productivity));
    localStorage.setItem('funtime-doomscroll', JSON.stringify(state.doomscroll));
    localStorage.setItem('funtime-usage', JSON.stringify(state.usage));
  } catch { /* storage full */ }
  return result;
};

export const store = configureStore({
  reducer: {
    focus: focusReducer,
    timer: timerReducer,
    productivity: productivityReducer,
    doomscroll: doomscrollReducer,
    usage: usageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['doomscroll/trackScroll'],
      },
    }).concat(persistMiddleware),
});

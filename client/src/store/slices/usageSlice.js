import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productivityAPI } from '../../services/productivityAPI';

export const fetchUsageSummary = createAsyncThunk('usage/fetchSummary', async (days = 7) => {
  const { data } = await productivityAPI.getUsageSummary(days);
  return data.data;
});

export const fetchDailyReports = createAsyncThunk('usage/fetchReports', async (days = 7) => {
  const { data } = await productivityAPI.getDailyReports(days);
  return data.data;
});

export const fetchProductivityInsights = createAsyncThunk('usage/fetchInsights', async (days = 7) => {
  const { data } = await productivityAPI.getProductivityInsights(days);
  return data.data;
});

const loadState = () => {
  try {
    const saved = localStorage.getItem('funtime-usage');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const initialState = loadState() || {
  dailyGoal: 120,
  sessionMinutes: 0,
  focusMinutes: 0,
  summary: null,
  reports: [],
  insights: null,
  loading: false,
  error: null,
};

const usageSlice = createSlice({
  name: 'usage',
  initialState,
  reducers: {
    tickSession: (state) => {
      state.sessionMinutes += 1;
    },
    addFocusMinutes: (state, action) => {
      state.focusMinutes += action.payload;
    },
    setDailyGoal: (state, action) => {
      state.dailyGoal = action.payload;
    },
    resetDaily: (state) => {
      state.sessionMinutes = 0;
      state.focusMinutes = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsageSummary.pending, (state) => { state.loading = true; })
      .addCase(fetchUsageSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.loading = false;
      })
      .addCase(fetchUsageSummary.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(fetchDailyReports.fulfilled, (state, action) => {
        state.reports = action.payload.reports || [];
        state.today = action.payload.today;
        state.totals = action.payload.totals;
      })
      .addCase(fetchProductivityInsights.fulfilled, (state, action) => {
        state.insights = action.payload;
      });
  },
});

export const { tickSession, addFocusMinutes, setDailyGoal, resetDaily } = usageSlice.actions;
export const selectUsage = (state) => state.usage;
export const selectDailyGoal = (state) => state.usage.dailyGoal;
export const selectSessionMinutes = (state) => state.usage.sessionMinutes;
export const selectInsights = (state) => state.usage.insights;
export const selectReports = (state) => state.usage.reports;

export default usageSlice.reducer;

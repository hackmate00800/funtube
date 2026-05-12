import api from './api';

const API_BASE = '/productivity';
const AI_BASE = '/ai-productivity';

export const productivityAPI = {
  trackEvent: (sessionId, event) =>
    api.post(`${API_BASE}/track`, { sessionId, event }),

  endSession: (sessionId) =>
    api.post(`${API_BASE}/end-session`, { sessionId }),

  getUsageSummary: (days = 7) =>
    api.get(`${API_BASE}/usage?days=${days}`),

  getDailyReports: (days = 7) =>
    api.get(`${API_BASE}/reports?days=${days}`),

  getProductivityInsights: (days = 7) =>
    api.get(`${API_BASE}/insights?days=${days}`),

  setDailyGoal: (minutes) =>
    api.put(`${API_BASE}/goal`, { minutes }),

  getAIInsights: (days = 7) =>
    api.get(`${AI_BASE}/insights?days=${days}`),

  getRealTimeAnalysis: () =>
    api.get(`${AI_BASE}/realtime`),

  getHourlyBreakdown: (days = 7) =>
    api.get(`${AI_BASE}/hourly?days=${days}`),

  getCategoryBreakdown: (days = 7) =>
    api.get(`${AI_BASE}/categories?days=${days}`),

  getWellnessScore: (days = 7) =>
    api.get(`${AI_BASE}/wellness?days=${days}`),
};

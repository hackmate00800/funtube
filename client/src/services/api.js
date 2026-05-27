import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let navigateToLogin = null;
export const setNavigateCallback = (fn) => { navigateToLogin = fn; };

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : '';
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method !== 'get' && config.method !== 'head' && config.method !== 'options') {
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken) config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (navigateToLogin && window.location.pathname !== '/login') {
        navigateToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  getChannel: (id) => api.get(`/auth/channel/${id}`),
  subscribe: (id) => api.put(`/auth/subscribe/${id}`),
  updatePreferences: (data) => api.put('/auth/preferences', data),
  createChannel: (formData) => api.put('/auth/create-channel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const videosAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  uploadVideo: (formData, onProgress) =>
    api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  uploadThumbnail: (videoId, formData) =>
    api.post(`/videos/${videoId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  likeVideo: (id) => api.put(`/videos/${id}/like`),
  dislikeVideo: (id) => api.put(`/videos/${id}/dislike`),
  getTrending: () => api.get('/videos/trending'),
  getRecommended: (id) => api.get(`/videos/${id}/recommended`),
  addToWatchLater: (id) => api.put(`/videos/${id}/watch-later`),
  getCreatorVideos: () => api.get('/videos/creator'),
};

export const commentsAPI = {
  getComments: (videoId, params) => api.get(`/videos/${videoId}/comments`, { params }),
  addComment: (videoId, text) => api.post(`/videos/${videoId}/comments`, { text }),
  deleteComment: (videoId, commentId) => api.delete(`/videos/${videoId}/comments/${commentId}`),
  likeComment: (videoId, commentId) => api.put(`/videos/${videoId}/comments/${commentId}/like`),
  addReply: (videoId, commentId, text) =>
    api.post(`/videos/${videoId}/comments/${commentId}/reply`, { text }),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const analyticsAPI = {
  getVideoAnalytics: (videoId) => api.get(`/analytics/video/${videoId}`),
  getCreatorSummary: () => api.get('/analytics/summary'),
};

export const summaryAPI = {
  getSummary: (videoId) => api.get(`/summaries/${videoId}`),
  getStatus: (videoId) => api.get(`/summaries/${videoId}/status`),
  generate: (videoId, levels) => api.post(`/summaries/${videoId}/generate`, { levels }),
  regenerateLevel: (videoId, level) => api.post(`/summaries/${videoId}/regenerate/${level}`),
  downloadPDF: (videoId) => api.get(`/summaries/${videoId}/download-pdf`, { responseType: 'blob' }),
};

export const aiAPI = {
  generateTitle: (data) => api.post('/ai/generate-title', data),
  generateTags: (data) => api.post('/ai/generate-tags', data),
  generateThumbnail: (data) => api.post('/ai/generate-thumbnail', data),
  generateCaptions: (videoId) => api.post(`/ai/generate-captions/${videoId}`),
  moderateContent: (text) => api.post('/ai/moderate', { text }),
  chat: (messages) => api.post('/ai/chat', { messages }),
};

export const notesAPI = {
  listNotes: (params) => api.get('/notes', { params }),
  getNotes: (videoId) => api.get(`/notes/${videoId}`),
  getStatus: (videoId) => api.get(`/notes/${videoId}/status`),
  generate: (videoId, options = {}) => api.post(`/notes/${videoId}/generate`, options),
  update: (notesId, data) => api.put(`/notes/${notesId}`, data),
  updateFlashcard: (notesId, data) => api.put(`/notes/${notesId}/flashcard`, data),
  delete: (notesId) => api.delete(`/notes/${notesId}`),
  exportMarkdown: (notesId) => api.get(`/notes/${notesId}/export/markdown`, { responseType: 'blob' }),
};

export const dubbingAPI = {
  getLanguages: () => api.get('/dubbing/languages'),
  getSubtitles: (videoId, language) => api.get(`/dubbing/subtitles/${videoId}`, { params: { language } }),
  generateSubtitles: (videoId, language) => api.post(`/dubbing/subtitles/${videoId}/generate`, { language }),
};

export const projectBuilderAPI = {
  getIdeas: () => api.get('/project-builder/ideas'),
  generateStructure: (data) => api.post('/project-builder/structure', data),
  generateBoilerplate: (data) => api.post('/project-builder/boilerplate', data),
};

export const shortsAPI = {
  detectHighlights: (videoId) => api.get(`/shorts/highlights/${videoId}`),
  generateShort: (videoId, highlight) => api.post(`/shorts/generate/${videoId}`, { highlight }),
  getMyShorts: () => api.get('/shorts/my-shorts'),
};

export const projectReviewAPI = {
  getProjects: () => api.get('/project-review'),
  getProject: (id) => api.get(`/project-review/${id}`),
  submitProject: (data) => api.post('/project-review', data),
  reviewProject: (id) => api.post(`/project-review/${id}/review`),
  deleteProject: (id) => api.delete(`/project-review/${id}`),
};

export default api;

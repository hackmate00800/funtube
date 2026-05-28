import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
let _csrfToken = '';

const getCsrf = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/auth/csrf`, { withCredentials: true });
    if (data.token) _csrfToken = data.token;
  } catch {}
};

const driveApi = axios.create({ baseURL: API_URL, withCredentials: true });

driveApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.method !== 'get') {
    if (_csrfToken) config.headers['X-XSRF-TOKEN'] = _csrfToken;
  }
  return config;
});

const CHUNK_SIZE = 10 * 1024 * 1024;

export async function uploadFileToGoogle(uploadUrl, file, onProgress) {
  const totalSize = file.size;
  let uploaded = 0;
  let attempt = 0;

  while (uploaded < totalSize) {
    const end = Math.min(uploaded + CHUNK_SIZE, totalSize);
    const chunk = file.slice(uploaded, end);

    const headers = {
      'Content-Range': `bytes ${uploaded}-${end - 1}/${totalSize}`,
      'Content-Length': String(end - uploaded),
    };

    let resp;
    try {
      resp = await fetch(uploadUrl, { method: 'PUT', headers, body: chunk });
    } catch (err) {
      attempt++;
      if (attempt > 3) throw new Error('Upload failed after 3 retries');
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }

    if (resp.status === 201 || resp.status === 200) {
      const meta = await resp.json();
      onProgress(100);
      return meta;
    }

    if (resp.status === 308) {
      uploaded = end;
      onProgress((uploaded / totalSize) * 100);
      attempt = 0;
      continue;
    }

    attempt++;
    if (attempt > 3) throw new Error(`Upload failed: HTTP ${resp.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }

  const resp = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Length': '0', 'Content-Range': `bytes */${totalSize}` } });
  if (resp.status === 200 || resp.status === 201) return resp.json();
  throw new Error('Upload finalization failed');
}

export const driveAPI = {
  getAuthUrl: () => driveApi.get('/drive/auth-url'),
  handleCallback: (code) => driveApi.get(`/drive/callback?code=${code}`),
  getStatus: () => driveApi.get('/drive/status'),
  disconnect: () => driveApi.post('/drive/disconnect'),
  initUpload: (data) => driveApi.post('/drive/upload/init', data),
  completeUpload: (data) => driveApi.post('/drive/upload/complete', data),
  getMyVideos: (params) => driveApi.get('/drive/videos', { params }),
  getVideo: (id) => driveApi.get(`/drive/videos/${id}`),
  updateVideo: (id, data) => driveApi.put(`/drive/videos/${id}`, data),
  deleteVideo: (id) => driveApi.delete(`/drive/videos/${id}`),
};

export const inviteAPI = {
  create: (data) => driveApi.post('/invite', data),
  list: (params) => driveApi.get('/invite', { params }),
  update: (id, data) => driveApi.put(`/invite/${id}`, data),
  delete: (id) => driveApi.delete(`/invite/${id}`),
  stream: (token) => `${API_URL}/invite/stream/${token}`,
  info: (token) => driveApi.get(`/invite/info/${token}`),
};

export const adminAPI = {
  getUsers: (params) => driveApi.get('/admin/users', { params }),
  getUserDetail: (id) => driveApi.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => driveApi.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => driveApi.delete(`/admin/users/${id}`),
  getVideos: (params) => driveApi.get('/admin/videos', { params }),
  toggleVideo: (id) => driveApi.put(`/admin/videos/${id}/toggle`),
  deleteVideo: (id) => driveApi.delete(`/admin/videos/${id}`),
  getAnalytics: () => driveApi.get('/admin/analytics'),
};

getCsrf();

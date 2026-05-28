import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/driveAPI';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await adminAPI.getAnalytics();
      setAnalytics(data.data);
    } catch {
      toast.error('Failed to load analytics');
    }
  }, []);

  const loadUsers = useCallback(async (query = '') => {
    try {
      const { data } = await adminAPI.getUsers({ search: query, limit: 100 });
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to load users');
    }
  }, []);

  const loadVideos = useCallback(async () => {
    try {
      const { data } = await adminAPI.getVideos({ limit: 100 });
      setVideos(data.data || []);
    } catch {
      toast.error('Failed to load videos');
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAnalytics(), loadUsers(), loadVideos()]);
    setLoading(false);
  }, [loadAnalytics, loadUsers, loadVideos]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRoleChange = async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleVideo = async (videoId) => {
    try {
      const { data } = await adminAPI.toggleVideo(videoId);
      setVideos((prev) => prev.map((v) => (v._id === videoId ? data.data : v)));
      toast.success(data.data.isActive ? 'Video enabled' : 'Video disabled');
    } catch {
      toast.error('Failed to toggle video');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video and all associated invites?')) return;
    try {
      await adminAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  const tabs = ['overview', 'users', 'videos'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      <div className="flex gap-2 border-b border-dark-700 pb-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass border border-dark-700 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Total Videos</p>
            <p className="text-3xl font-bold text-white mt-1">{analytics.totalVideos}</p>
          </div>
          <div className="glass border border-dark-700 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Active Invites</p>
            <p className="text-3xl font-bold text-white mt-1">{analytics.activeInvites}</p>
          </div>
          <div className="glass border border-dark-700 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Total Views</p>
            <p className="text-3xl font-bold text-white mt-1">{analytics.totalViewCount}</p>
          </div>

          {analytics.videosPerDay?.length > 0 && (
            <div className="glass border border-dark-700 rounded-xl p-6 md:col-span-3">
              <h3 className="text-lg font-semibold text-white mb-3">Uploads per Day (Last 30)</h3>
              <div className="flex items-end gap-1 h-32">
                {analytics.videosPerDay.map((d, i) => {
                  const max = Math.max(...analytics.videosPerDay.map((x) => x.count), 1);
                  const h = (d.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{d.count}</span>
                      <div className="w-full bg-primary-500 rounded-t transition-all" style={{ height: `${h}%` }} />
                      <span className="text-xs text-gray-600 truncate w-full text-center">{d._id.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analytics.recentAnalytics?.length > 0 && (
            <div className="glass border border-dark-700 rounded-xl p-6 md:col-span-3">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analytics.recentAnalytics.map((a) => (
                  <div key={a._id} className="flex justify-between text-sm text-gray-400">
                    <span>{a.video?.title || 'Unknown video'}</span>
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); loadUsers(e.target.value); }}
            className="input-field max-w-md" placeholder="Search users by name or email..." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-dark-700">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Drive</th>
                  <th className="text-left py-3 px-2">Joined</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-dark-800 hover:bg-dark-800/50">
                    <td className="py-3 px-2 text-white">{user.username}</td>
                    <td className="py-3 px-2 text-gray-400">{user.email}</td>
                    <td className="py-3 px-2">
                      <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-dark-800 text-gray-300 rounded px-2 py-1 text-xs border border-dark-700">
                        <option value="user">User</option>
                        <option value="creator">Creator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs ${user.hasDriveConnected ? 'text-green-400' : 'text-gray-600'}`}>
                        {user.hasDriveConnected ? 'Connected' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => handleDeleteUser(user._id)}
                        className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'videos' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-dark-700">
                  <th className="text-left py-3 px-2">Title</th>
                  <th className="text-left py-3 px-2">Uploader</th>
                  <th className="text-left py-3 px-2">Category</th>
                  <th className="text-left py-3 px-2">Views</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id} className="border-b border-dark-800 hover:bg-dark-800/50">
                    <td className="py-3 px-2 text-white max-w-xs truncate">{video.title}</td>
                    <td className="py-3 px-2 text-gray-400">{video.uploader?.username || 'Unknown'}</td>
                    <td className="py-3 px-2 text-gray-400 capitalize">{video.category}</td>
                    <td className="py-3 px-2 text-gray-400">{video.viewCount}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs ${video.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {video.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{new Date(video.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button onClick={() => handleToggleVideo(video._id)}
                        className={`text-xs ${video.isActive ? 'text-yellow-400' : 'text-green-400'} hover:opacity-80`}>
                        {video.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDeleteVideo(video._id)}
                        className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

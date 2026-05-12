import React, { useState, useEffect } from 'react';
import { videosAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiTrash, HiShieldCheck, HiExclamation } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

const AdminPanel = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('videos');

  useEffect(() => {
    fetchAllVideos();
  }, []);

  const fetchAllVideos = async () => {
    try {
      const { data } = await videosAPI.getVideos({ limit: 100 });
      setVideos(data.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Delete this video permanently?')) return;
    try {
      await videosAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <HiShieldCheck className="text-primary-400" />
        Admin Panel
      </h1>

      <div className="flex gap-4 border-b border-dark-700 mb-6">
        {[{ id: 'videos', label: 'All Videos' }, { id: 'reported', label: 'Reported' }, { id: 'users', label: 'Users' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              tab === t.id
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'videos' && (
        <div className="card">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-dark-700">
                  <th className="p-4 font-medium">Video</th>
                  <th className="p-4 font-medium">Creator</th>
                  <th className="p-4 font-medium">Views</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Uploaded</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id} className="border-b border-dark-700/50 hover:bg-dark-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 max-w-xs">
                        <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded" />
                        <span className="text-sm text-white truncate">{video.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{video.user?.username}</td>
                    <td className="p-4 text-sm text-gray-300">{video.views}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        video.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                        video.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{video.status}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(video._id)}
                        className="p-1.5 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <HiTrash className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab !== 'videos' && (
        <div className="text-center py-20 text-gray-500">
          <HiExclamation className="text-4xl mx-auto mb-2" />
          <p>Section under development</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

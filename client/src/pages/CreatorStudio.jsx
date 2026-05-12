import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { analyticsAPI, videosAPI } from '../services/api';
import GlassCard, { GlassCardHeader, GlassCardBody } from '../components/ui/Card';
import GlassTabs from '../components/ui/Tabs';
import GlassSkeleton from '../components/ui/Skeleton';
import GlassTooltip from '../components/ui/Tooltip';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  HiEye, HiThumbUp, HiVideoCamera, HiClock, HiTrendingUp,
  HiUpload, HiChartBar, HiPhotograph, HiTag, HiGlobe,
  HiLockClosed, HiDotsHorizontal, HiPencil, HiTrash,
  HiPlay, HiStatusOnline,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'content', label: 'Content', icon: HiVideoCamera },
  { id: 'analytics', label: 'Analytics', icon: HiChartBar },
  { id: 'comments', label: 'Comments', icon: HiStatusOnline },
  { id: 'settings', label: 'Settings', icon: HiLockClosed },
];

const CreatorStudio = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [videos, setVideos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, videosRes] = await Promise.all([
        analyticsAPI.getCreatorSummary(),
        videosAPI.getCreatorVideos(),
      ]);
      setSummary(summaryRes.data.data);
      setVideos(videosRes.data.data);
    } catch (err) {
      console.error('Failed to fetch studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassSkeleton type="title" className="w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <GlassSkeleton key={i} type="stat" />)}
        </div>
        <GlassSkeleton type="card" className="h-96" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Studio</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your content and channel</p>
        </div>
        <Link to="/upload" className="btn-primary text-sm flex items-center gap-2">
          <HiUpload className="w-4 h-4" />
          Upload Video
        </Link>
      </motion.div>

      <motion.div variants={staggerItem}>
        <GlassTabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Views (28d)', value: formatViews(summary?.totalViews || 0), icon: HiEye, change: '+12%', up: true },
          { label: 'Likes (28d)', value: formatViews(summary?.totalLikes || 0), icon: HiThumbUp, change: '+8%', up: true },
          { label: 'Videos', value: summary?.totalVideos || 0, icon: HiVideoCamera, change: '--', up: true },
          { label: 'Watch Time', value: '--', icon: HiClock, change: '--', up: true },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                <stat.icon className="w-4 h-4" />
              </div>
              {stat.change !== '--' && (
                <span className={`text-xs font-medium ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {activeTab === 'content' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Video Manager</h2>
            <div className="flex items-center gap-2">
              <select className="input-field py-1.5 px-3 text-xs w-auto">
                <option>All videos</option>
                <option>Public</option>
                <option>Private</option>
                <option>Unlisted</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {videos.map((video, i) => (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-xl p-4 hover:bg-dark-800/80 transition-all border border-white/5 hover:border-white/10 group"
              >
                <div className="flex gap-4">
                  <Link to={`/watch/${video._id}`} className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail || '/thumbnails/default-thumbnail.png'}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <HiPlay className="w-8 h-8 text-white" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <Link to={`/watch/${video._id}`} className="text-sm font-medium text-white hover:text-primary-400 transition-colors line-clamp-1">
                          {video.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <HiEye className="w-3.5 h-3.5" /> {formatViews(video.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiThumbUp className="w-3.5 h-3.5" /> {video.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiClock className="w-3.5 h-3.5" /> {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {video.description && (
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{video.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            video.status === 'ready' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            video.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              video.status === 'ready' ? 'bg-green-400' :
                              video.status === 'processing' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                            }`} />
                            {video.status}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <HiGlobe className="w-3 h-3" /> Public
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <GlassTooltip content="Edit">
                          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <HiPencil className="w-4 h-4" />
                          </button>
                        </GlassTooltip>
                        <GlassTooltip content="Delete">
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this video permanently?')) {
                                videosAPI.deleteVideo(video._id).then(() => {
                                  setVideos(prev => prev.filter(v => v._id !== video._id));
                                  toast.success('Video deleted');
                                }).catch(() => toast.error('Failed to delete'));
                              }
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </GlassTooltip>
                        <GlassTooltip content="More">
                          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <HiDotsHorizontal className="w-4 h-4" />
                          </button>
                        </GlassTooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {videos.length === 0 && (
              <div className="glass-panel rounded-xl p-12 text-center">
                <HiVideoCamera className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium text-white mb-1">No videos yet</p>
                <p className="text-sm text-gray-400 mb-6">Upload your first video to get started</p>
                <Link to="/upload" className="btn-primary">Upload Video</Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <HiChartBar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium text-white mb-1">Analytics Dashboard</p>
          <p className="text-sm text-gray-400">Detailed analytics with charts and insights coming soon</p>
        </motion.div>
      )}

      {activeTab === 'comments' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <HiStatusOnline className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium text-white mb-1">Comment Management</p>
          <p className="text-sm text-gray-400">Review and manage comments on your videos</p>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <HiLockClosed className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium text-white mb-1">Channel Settings</p>
          <p className="text-sm text-gray-400">Manage your channel preferences and defaults</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CreatorStudio;

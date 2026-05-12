import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { analyticsAPI, videosAPI } from '../services/api';
import GlassSkeleton from '../components/ui/Skeleton';
import GlassTooltip from '../components/ui/Tooltip';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  HiEye, HiThumbUp, HiVideoCamera, HiCurrencyDollar, HiTrash, HiPencil,
  HiTrendingUp, HiClock, HiUpload, HiChartBar,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CreatorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, videosRes] = await Promise.all([
        analyticsAPI.getCreatorSummary(),
        videosAPI.getCreatorVideos(),
      ]);
      setSummary(summaryRes.data.data);
      setVideos(videosRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
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
    } catch { toast.error('Failed to delete'); }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <GlassSkeleton key={i} type="stat" />
          ))}
        </div>
        <GlassSkeleton type="card" className="h-64" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Views', value: formatViews(summary?.totalViews || 0), icon: HiEye, color: 'primary', trend: 12 },
    { label: 'Total Likes', value: formatViews(summary?.totalLikes || 0), icon: HiThumbUp, color: 'success', trend: 8 },
    { label: 'Total Videos', value: summary?.totalVideos || 0, icon: HiVideoCamera, color: 'info' },
    { label: 'Revenue', value: '$0', icon: HiCurrencyDollar, color: 'warning' },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here&apos;s your channel overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/studio" className="btn-glass text-sm">
            <HiChartBar className="w-4 h-4" />
            Creator Studio
          </Link>
          <Link to="/upload" className="btn-primary text-sm">
            <HiUpload className="w-4 h-4" />
            Upload Video
          </Link>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2, scale: 1.01 }}
            className="glass-panel rounded-xl p-5 hover:bg-dark-800/80 hover:border-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${
                stat.color === 'success' ? 'bg-green-500/10 text-green-400' :
                stat.color === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                stat.color === 'info' ? 'bg-blue-500/10 text-blue-400' :
                'bg-primary-500/10 text-primary-400'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend !== undefined && (
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                  +{stat.trend}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="glass-card border border-white/5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiVideoCamera className="w-5 h-5 text-primary-400" />
            Your Videos
          </h2>
          <span className="text-xs text-gray-500">{videos.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/5 uppercase tracking-wider">
                <th className="p-4 font-medium">Video</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Likes</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, i) => (
                <motion.tr
                  key={video._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <Link to={`/watch/${video._id}`} className="flex items-center gap-3 group">
                      <img
                        src={video.thumbnail || '/thumbnails/default-thumbnail.png'}
                        alt=""
                        className="w-32 h-18 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <span className="text-sm text-white group-hover:text-primary-400 transition-colors line-clamp-2 font-medium">
                        {video.title}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{formatViews(video.views)}</td>
                  <td className="p-4 text-sm text-gray-300">{video.likes?.length || 0}</td>
                  <td className="p-4 text-sm text-gray-400">
                    {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      video.status === 'ready' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      video.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        video.status === 'ready' ? 'bg-green-400' :
                        video.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                        'bg-red-400'
                      }`} />
                      {video.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <GlassTooltip content="Edit">
                        <Link
                          to={`/watch/${video._id}`}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <HiPencil className="text-sm" />
                        </Link>
                      </GlassTooltip>
                      <GlassTooltip content="Delete">
                        <button
                          onClick={() => handleDelete(video._id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <HiTrash className="text-sm" />
                        </button>
                      </GlassTooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-500">
                    <HiVideoCamera className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                    <p className="text-sm">No videos uploaded yet.</p>
                    <Link to="/upload" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                      Upload your first video
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreatorDashboard;

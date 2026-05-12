import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI, videosAPI, analyticsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import toast from 'react-hot-toast';
import {
  HiUserAdd, HiCheck, HiCog, HiEye, HiThumbUp, HiVideoCamera,
  HiTrash, HiPencil, HiUpload,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

const Channel = () => {
  const { id } = useParams();
  const { user, subscribe } = useContext(AuthContext);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('videos');
  const [analytics, setAnalytics] = useState(null);
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetchChannel();
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (channel && channel._id === user?.id && tab === 'dashboard') {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, channel?._id]);

  const fetchChannel = async () => {
    try {
      const { data } = await authAPI.getChannel(id);
      setChannel(data.data);
      setIsSubscribed(data.data.subscribers?.some(s => String(s._id || s) === String(user?.id)));
    } catch (err) {
      toast.error('Channel not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data } = await videosAPI.getVideos({ user: id, limit: 50 });
      setVideos(data.data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [summaryRes, videosRes] = await Promise.all([
        analyticsAPI.getCreatorSummary(),
        videosAPI.getCreatorVideos(),
      ]);
      setAnalytics(summaryRes.data.data);
      setCreatorVideos(videosRes.data.data);
    } catch {
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video permanently?')) return;
    try {
      await videosAPI.deleteVideo(videoId);
      setCreatorVideos((prev) => prev.filter((v) => v._id !== videoId));
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const handleSubscribe = async () => {
    try {
      const { data } = await subscribe(id);
      setIsSubscribed(data.isSubscribed);
      setChannel((prev) => ({
        ...prev,
        subscribers: data.isSubscribed
          ? [...(prev.subscribers || []), user.id]
          : (prev.subscribers || []).filter((s) => s !== user.id),
      }));
      toast.success(data.isSubscribed ? 'Subscribed!' : 'Unsubscribed');
    } catch (err) {
      toast.error('Failed to subscribe');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="skeleton h-64 rounded-2xl mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return <div className="text-center py-20 text-gray-500 text-2xl">Channel not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-900 via-dark-800 to-dark-900" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        {channel.avatar ? (
          <img src={channel.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-dark-800" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary-500/20 border-4 border-dark-800 flex items-center justify-center text-3xl text-primary-400 font-bold">
            {channel.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{channel.username}</h1>
          <p className="text-sm text-gray-400">
            {channel.subscribers?.length || 0} subscribers • {videos.length} videos
          </p>
          {channel.channelDescription && (
            <p className="text-sm text-gray-500 mt-1">{channel.channelDescription}</p>
          )}
        </div>
        <div className="flex gap-2">
          {channel._id !== user?.id && (
            <button
              onClick={handleSubscribe}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isSubscribed
                  ? 'bg-dark-700 text-white hover:bg-dark-600'
                  : 'bg-white text-dark-950 hover:bg-gray-200'
              }`}
            >
              {isSubscribed ? (
                <><HiCheck className="text-lg" /> Subscribed</>
              ) : (
                <><HiUserAdd className="text-lg" /> Subscribe</>
              )}
            </button>
          )}
          {channel._id === user?.id && (
            <button className="btn-secondary flex items-center gap-2">
              <HiCog className="text-lg" /> Customize Channel
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-dark-700 mb-6">
        {['videos', 'playlists', 'about', ...(channel._id === user?.id ? ['dashboard'] : [])].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-4 text-sm font-medium capitalize transition-colors relative ${
              tab === t
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'videos' && (
        videos.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No videos uploaded yet</p>
        ) : (
          <div className="video-grid">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        )
      )}

      {tab === 'about' && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
          <p className="text-gray-400">{channel.channelDescription || 'No description'}</p>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-white">{channel.subscribers?.length || 0}</p>
                <p className="text-sm text-gray-400">Subscribers</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-white">{videos.length}</p>
                <p className="text-sm text-gray-400">Videos</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {videos.reduce((sum, v) => sum + (v.views || 0), 0)}
                </p>
                <p className="text-sm text-gray-400">Total Views</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'dashboard' && channel._id === user?.id && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Channel Dashboard</h2>
            <Link to="/upload" className="btn-primary flex items-center gap-2 text-sm">
              <HiUpload className="text-lg" /> Upload Video
            </Link>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Views', value: formatViews(analytics?.totalViews || videos.reduce((s, v) => s + (v.views || 0), 0)), icon: HiEye, color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Total Likes', value: formatViews(analytics?.totalLikes || 0), icon: HiThumbUp, color: 'text-green-400 bg-green-500/10' },
                { label: 'Subscribers', value: channel.subscribers?.length || 0, icon: HiUserAdd, color: 'text-purple-400 bg-purple-500/10' },
                { label: 'Videos', value: creatorVideos.length || videos.length, icon: HiVideoCamera, color: 'text-yellow-400 bg-yellow-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="card p-5">
                  <div className={`p-2.5 rounded-lg inline-flex ${stat.color} mb-3`}>
                    <stat.icon className="text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="p-5 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">Your Videos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-dark-700">
                    <th className="p-4 font-medium">Video</th>
                    <th className="p-4 font-medium">Views</th>
                    <th className="p-4 font-medium">Likes</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(creatorVideos.length ? creatorVideos : videos).map((video) => (
                    <tr key={video._id} className="border-b border-dark-700/50 hover:bg-dark-800/50 transition-colors">
                      <td className="p-4">
                        <Link to={`/watch/${video._id}`} className="flex items-center gap-3 group">
                          <img
                            src={video.thumbnail || '/thumbnails/default-thumbnail.png'}
                            alt=""
                            className="w-32 h-18 object-cover rounded-lg"
                          />
                          <span className="text-sm text-white group-hover:text-primary-400 transition-colors line-clamp-2">
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
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          video.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                          video.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {video.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/watch/${video._id}`}
                            className="p-1.5 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <HiPencil className="text-sm" />
                          </Link>
                          <button
                            onClick={() => handleDeleteVideo(video._id)}
                            className="p-1.5 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <HiTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!creatorVideos.length && !videos.length && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-500">
                        No videos yet.{' '}
                        <Link to="/upload" className="text-primary-400 hover:text-primary-300">Upload your first video</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;

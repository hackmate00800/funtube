import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { videosAPI, authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import GlassTabs from '../components/ui/Tabs';
import GlassSkeleton from '../components/ui/Skeleton';
import GlassTooltip from '../components/ui/Tooltip';
import GlassAvatar from '../components/ui/Avatar';
import { staggerContainer, staggerItem } from '../utils/animations';
import {
  HiCheck, HiUserAdd, HiCog, HiShare, HiCalendar,
  HiVideoCamera, HiEye, HiThumbUp, HiGlobe,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const tabs = [
  { id: 'videos', label: 'Videos', icon: HiVideoCamera },
  { id: 'playlists', label: 'Playlists', icon: HiGlobe },
  { id: 'about', label: 'About', icon: HiCalendar },
];

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [subscriberCount, setSubscriberCount] = useState(0);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await videosAPI.getUserVideos(id);
      setProfile(data.user || data.data);
      setVideos(data.data || []);
      setSubscriberCount(data.user?.subscribers?.length || 0);
      if (currentUser) {
        setSubscribed(data.user?.subscribers?.some(
          (s) => String(s._id || s) === String(currentUser.id)
        ));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const { data } = await authAPI.subscribe(id);
      setSubscribed(data.isSubscribed);
      setSubscriberCount((prev) => data.isSubscribed ? prev + 1 : prev - 1);
    } catch { toast.error('Failed to subscribe'); }
  };

  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="h-48 skeleton" />
          <div className="p-6 -mt-16 flex items-end gap-6">
            <GlassSkeleton type="avatar" className="w-28 h-28 ring-4 ring-dark-950" />
            <div className="flex-1 space-y-2 pb-2">
              <GlassSkeleton type="title" className="w-48" />
              <GlassSkeleton type="text" className="w-32" />
            </div>
          </div>
        </div>
        <div className="video-grid">
          {[...Array(8)].map((_, i) => (
            <GlassSkeleton key={i} type="card" className="aspect-video" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl text-gray-500">User not found</p>
      </div>
    );
  }

  const channelStats = [
    { icon: HiVideoCamera, label: 'Videos', value: profile.videoCount || videos.length || 0 },
    { icon: HiEye, label: 'Views', value: formatCount(profile.totalViews || 0) },
    { icon: HiThumbUp, label: 'Likes', value: formatCount(profile.totalLikes || 0) },
    { icon: HiCalendar, label: 'Joined', value: profile.createdAt ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true }) : 'Recently' },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto"
    >
      <motion.div variants={staggerItem} className="glass-panel-strong rounded-2xl overflow-hidden border border-white/5">
        <div className="relative h-48 bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-dark-800 overflow-hidden">
          <div className="absolute inset-0 bg-mesh" />
          {profile.coverImage && (
            <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <GlassAvatar
              src={profile.avatar}
              name={profile.username || profile.name}
              size="2xl"
              glow
              className="ring-4 ring-dark-950"
            />
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-white">{profile.username || profile.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-300">{formatCount(subscriberCount)} subscribers</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span>{profile.videoCount || videos.length || 0} videos</span>
              </div>
              {profile.bio && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{profile.bio}</p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-4 sm:pt-0">
              {isOwnProfile ? (
                <>
                  <GlassTooltip content="Settings">
                    <Link to="/settings" className="btn-icon rounded-full">
                      <HiCog className="w-5 h-5" />
                    </Link>
                  </GlassTooltip>
                  <Link to="/studio" className="btn-glass text-sm">
                    <HiVideoCamera className="w-4 h-4" />
                    Studio
                  </Link>
                </>
              ) : (
                <>
                  <GlassTooltip content="Share">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied!');
                      }}
                      className="btn-icon rounded-full"
                    >
                      <HiShare className="w-5 h-5" />
                    </button>
                  </GlassTooltip>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubscribe}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      subscribed
                        ? 'glass-panel text-gray-300 hover:text-white border border-white/10'
                        : 'bg-primary-500 text-white hover:bg-primary-400 shadow-glow-sm'
                    }`}
                  >
                    {subscribed ? (
                      <span className="flex items-center gap-1.5"><HiCheck className="w-4 h-4" /> Subscribed</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><HiUserAdd className="w-4 h-4" /> Subscribe</span>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <GlassTabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {channelStats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-4 text-center hover:bg-dark-800/80 transition-all">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 inline-flex">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {activeTab === 'videos' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {videos.length === 0 ? (
            <div className="glass-panel rounded-xl p-16 text-center">
              <HiVideoCamera className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium text-white mb-1">No videos yet</p>
              <p className="text-sm text-gray-400">This channel hasn&apos;t uploaded any videos</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((video, i) => (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <VideoCard video={video} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'playlists' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-16 text-center"
        >
          <HiGlobe className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium text-white mb-1">No playlists yet</p>
          <p className="text-sm text-gray-400">Playlists will appear here</p>
        </motion.div>
      )}

      {activeTab === 'about' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-6 space-y-4"
        >
          {profile.bio && (
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Bio</h3>
              <p className="text-sm text-gray-400">{profile.bio}</p>
            </div>
          )}
          <div className="divider" />
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Stats</h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {channelStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 text-sm">
                  <stat.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300">{stat.value}</span>
                  <span className="text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="divider" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <HiCalendar className="w-4 h-4" />
            <span>Joined {profile.createdAt ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true }) : 'recently'}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Profile;

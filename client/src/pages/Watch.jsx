import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { videosAPI, authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { joinVideoRoom, leaveVideoRoom } from '../services/socket';
import VideoCard from '../components/video/VideoCard';
import QualitySelector from '../components/video/QualitySelector';
import CommentSection from '../components/comments/CommentSection';
import SummaryPanel from '../components/summary/SummaryPanel';
import NotesPanel from '../components/notes/NotesPanel';
import GlassSkeleton from '../components/ui/Skeleton';
import GlassTooltip from '../components/ui/Tooltip';
import {
  HiThumbUp, HiThumbDown, HiShare, HiDownload, HiBookmark,
  HiSparkles, HiCheck, HiDotsHorizontal, HiBookOpen,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const Watch = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [video, setVideo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState('720p');
  const [inWatchLater, setInWatchLater] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const playerRef = useRef(null);

  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await videosAPI.getVideo(id);
      setVideo(data.data);
      setLikesCount(data.data.likes?.length || 0);
      const res = data.data.videoResolutions;
      if (res && res.length > 0) setQuality(res[res.length - 1]);
      if (user) {
        setLiked(data.data.likes?.includes(user.id));
        setDisliked(data.data.dislikes?.includes(user.id));
        setSubscribed(data.data.user?.subscribers?.some(s => String(s._id || s) === String(user.id)));
        setInWatchLater(user.watchLater?.some(v => String(v._id || v) === String(id)));
      }
      joinVideoRoom(id);
      const rec = await videosAPI.getRecommended(id);
      setRecommended(rec.data.data);
    } catch (err) {
      console.error('Failed to fetch video:', err);
      toast.error('Video not found');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchVideo();
    return () => leaveVideoRoom(id);
  }, [id, fetchVideo]);

  const handleSeek = (seconds) => {
    playerRef.current?.seekTo(seconds, 'seconds');
  };

  const handleToggleSummary = () => {
    setShowSummary(prev => !prev);
    setShowNotes(false);
  };

  const handleToggleNotes = () => {
    setShowNotes(prev => !prev);
    setShowSummary(false);
  };

  const handleLike = async () => {
    try {
      const { data } = await videosAPI.likeVideo(id);
      setLiked(data.isLiked);
      setDisliked(false);
      setLikesCount(data.likes);
    } catch { toast.error('Failed to like video'); }
  };

  const handleDislike = async () => {
    try {
      const { data } = await videosAPI.dislikeVideo(id);
      setDisliked(data.isDisliked);
      setLiked(false);
      setLikesCount(data.likes);
    } catch { toast.error('Failed to dislike video'); }
  };

  const handleSubscribe = async () => {
    try {
      const { data } = await authAPI.subscribe(video.user._id);
      setSubscribed(data.isSubscribed);
    } catch { toast.error('Failed to subscribe'); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch { toast.error('Failed to copy link'); }
  };

  const handleWatchLater = async () => {
    try {
      const { data } = await videosAPI.addToWatchLater(id);
      setInWatchLater(data.isInWatchLater);
      toast.success(data.isInWatchLater ? 'Added to Watch Later' : 'Removed from Watch Later');
    } catch { toast.error('Failed to update Watch Later'); }
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassSkeleton type="thumbnail" className="rounded-xl" />
            <div className="mt-4 space-y-3">
              <GlassSkeleton type="title" className="h-8 w-3/4" />
              <GlassSkeleton type="text" className="w-1/4" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <GlassSkeleton type="" className="w-40 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <GlassSkeleton type="title" />
                  <GlassSkeleton type="text" className="w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl text-gray-500">Video not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden group shadow-glow-sm border border-white/5">
            <ReactPlayer
              ref={playerRef}
              url={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/videos/${video._id}/stream/${quality}`}
              width="100%"
              height="100%"
              controls
              playing
              config={{
                file: { attributes: { controlsList: 'nodownload' } },
              }}
            />
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <QualitySelector
                resolutions={video.videoResolutions || []}
                currentQuality={quality}
                onQualityChange={setQuality}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-white leading-snug">{video.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1.5">
                <span>{formatViews(video.views)} views</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span>{video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Link to={`/channel/${video.user?._id}`} className="flex items-center gap-3 group">
                  {video.user?.avatar ? (
                    <img src={video.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/20" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-primary-200 font-medium ring-2 ring-primary-500/20">
                      {video.user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                      {video.user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatViews(video.user?.subscribers?.length || 0)} subscribers
                    </p>
                  </div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubscribe}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    subscribed
                      ? 'glass-panel text-gray-300 hover:text-white border-white/10'
                      : 'bg-white text-dark-950 hover:bg-gray-100 shadow-lg'
                  }`}
                >
                  {subscribed ? (
                    <span className="flex items-center gap-1.5"><HiCheck className="w-4 h-4" /> Subscribed</span>
                  ) : 'Subscribe'}
                </motion.button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center glass-panel rounded-full overflow-hidden border border-white/5">
                  <GlassTooltip content="Like">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-4 py-2 transition-all duration-200 ${
                        liked ? 'text-primary-400 bg-primary-500/10' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <HiThumbUp className={`text-lg ${liked ? 'scale-110' : ''}`} />
                      <span className="text-sm">{formatViews(likesCount)}</span>
                    </button>
                  </GlassTooltip>
                  <div className="w-px h-5 bg-white/5" />
                  <GlassTooltip content="Dislike">
                    <button
                      onClick={handleDislike}
                      className={`px-4 py-2 transition-all duration-200 ${
                        disliked ? 'text-primary-400 bg-primary-500/10' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <HiThumbDown className="text-lg" />
                    </button>
                  </GlassTooltip>
                </div>

                <GlassTooltip content={inWatchLater ? 'Remove from Watch Later' : 'Watch Later'}>
                  <button
                    onClick={handleWatchLater}
                    className={`btn-icon rounded-full ${
                      inWatchLater ? 'text-primary-400 bg-primary-500/10' : ''
                    }`}
                  >
                    <HiBookmark className={`text-lg ${inWatchLater ? 'fill-current' : ''}`} />
                  </button>
                </GlassTooltip>

                <GlassTooltip content="AI Summary">
                  <button
                    onClick={handleToggleSummary}
                    className={`btn-icon rounded-full ${
                      showSummary ? 'text-primary-400 bg-primary-500/10' : ''
                    }`}
                  >
                    <HiSparkles className="text-lg" />
                  </button>
                </GlassTooltip>
                <GlassTooltip content="AI Notes">
                  <button
                    onClick={handleToggleNotes}
                    className={`btn-icon rounded-full ${
                      showNotes ? 'text-primary-400 bg-primary-500/10' : ''
                    }`}
                  >
                    <HiBookOpen className="text-lg" />
                  </button>
                </GlassTooltip>

                <GlassTooltip content="Share">
                  <button onClick={handleShare} className="btn-icon rounded-full">
                    <HiShare className="text-lg" />
                  </button>
                </GlassTooltip>

                {video.isDownloadable && (
                  <GlassTooltip content="Download">
                    <button className="btn-icon rounded-full">
                      <HiDownload className="text-lg" />
                    </button>
                  </GlassTooltip>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 hover:bg-dark-800/70 transition-colors">
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{video.description}</p>
              {video.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {video.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {video.allowComments && (
              <div className="mt-2">
                <CommentSection videoId={id} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {showSummary ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-[calc(100vh-10rem)] rounded-2xl overflow-hidden border border-white/5"
            >
              <SummaryPanel videoId={id} onSeek={handleSeek} />
            </motion.div>
          ) : showNotes ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-[calc(100vh-10rem)] rounded-2xl overflow-hidden border border-white/5"
            >
              <NotesPanel videoId={id} onSeek={handleSeek} videoTitle={video?.title} />
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Recommended</h3>
                <span className="text-xs text-gray-500">{recommended.length} videos</span>
              </div>
              <div className="space-y-3">
                {recommended.map((rec, i) => (
                  <motion.div
                    key={rec._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <VideoCard video={rec} horizontal />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Watch;

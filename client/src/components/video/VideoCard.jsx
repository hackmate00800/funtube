import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const VideoCard = ({ video, horizontal = false }) => {
  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (horizontal) {
    return (
      <Link to={`/watch/${video._id}`} className="flex gap-3 glass-panel rounded-xl p-2 group hover:bg-dark-800/80 hover:border-white/10 transition-all duration-300 border border-white/5">
        <div className="relative flex-shrink-0 w-40">
          <img
            src={video.thumbnail || '/thumbnails/default-thumbnail.png'}
            alt={video.title}
            className="w-full h-24 object-cover rounded-lg"
            loading="lazy"
          />
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.duration)}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors leading-snug">
            {video.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1.5">{video.user?.username}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatViews(video.views)} views &bull;{' '}
            {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/watch/${video._id}`} className="glass-panel rounded-xl overflow-hidden group hover:bg-dark-800/80 hover:border-white/10 hover:shadow-glow-sm transition-all duration-300 border border-white/5 block">
      <div className="relative overflow-hidden">
        <img
          src={video.thumbnail || '/thumbnails/default-thumbnail.png'}
          alt={video.title}
          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-xs px-1.5 py-0.5 rounded font-medium">
          {formatDuration(video.duration)}
        </span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 text-dark-950 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        </div>
        {video.status === 'processing' && (
          <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm text-dark-950 text-[10px] px-2 py-0.5 rounded-full font-medium">
            Processing
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex gap-3">
          {video.user?.avatar ? (
            <img
              src={video.user.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
              loading="lazy"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {video.user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-primary-400 transition-colors">
              {video.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1 hover:text-white transition-colors">
              {video.user?.username}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatViews(video.views)} views &bull;{' '}
              {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;

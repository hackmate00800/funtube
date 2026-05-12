import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import { HiThumbUp, HiClock, HiPlay, HiHeart } from 'react-icons/hi';

const Library = () => {
  const { user } = useContext(AuthContext);
  const [liked, setLiked] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('liked');

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAll = async () => {
    try {
      const likedIds = user?.likedVideos || [];
      const laterIds = user?.watchLater || [];

      const [likedResults, laterResults] = await Promise.all([
        Promise.all(likedIds.map((id) => videosAPI.getVideo(typeof id === 'object' ? id._id : id).catch(() => null))),
        Promise.all(laterIds.map((id) => videosAPI.getVideo(typeof id === 'object' ? id._id : id).catch(() => null))),
      ]);

      setLiked(likedResults.filter(Boolean).map((r) => r.data.data));
      setWatchLater(laterResults.filter(Boolean).map((r) => r.data.data));
    } catch (err) {
      console.error('Failed to fetch library:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'liked', icon: HiHeart, label: 'Liked Videos', count: liked.length },
    { key: 'later', icon: HiPlay, label: 'Watch Later', count: watchLater.length },
    { key: 'history', icon: HiClock, label: 'History', count: user?.watchHistory?.length || 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Library</h1>

      <div className="flex gap-4 border-b border-dark-700 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
              tab === t.key
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="text-lg" />
            <span>{t.label}</span>
            <span className="text-xs text-gray-500">({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-40 h-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'liked' && liked.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <HiThumbUp className="text-5xl mx-auto mb-4 text-gray-600" />
          <p className="text-2xl mb-2">No liked videos</p>
          <p>Like videos to see them here</p>
        </div>
      ) : tab === 'later' && watchLater.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <HiPlay className="text-5xl mx-auto mb-4 text-gray-600" />
          <p className="text-2xl mb-2">No saved videos</p>
          <p>Save videos to watch later</p>
        </div>
      ) : tab === 'history' && (!user?.watchHistory || user.watchHistory.length === 0) ? (
        <div className="text-center py-20 text-gray-500">
          <HiClock className="text-5xl mx-auto mb-4 text-gray-600" />
          <p className="text-2xl mb-2">No watch history</p>
          <p>Watch videos to build your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tab === 'liked' ? liked : tab === 'later' ? watchLater : []).map((video) => (
            <VideoCard key={video._id} video={video} horizontal />
          ))}
          {tab === 'history' && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">History page available at</p>
              <Link to="/history" className="text-primary-400 hover:text-primary-300 font-medium">View Full History</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;

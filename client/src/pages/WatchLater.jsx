import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import { HiPlay } from 'react-icons/hi';

const WatchLater = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = user?.watchLater || [];
    if (ids.length > 0) {
      Promise.all(ids.map((id) => videosAPI.getVideo(typeof id === 'object' ? id._id : id).catch(() => null)))
        .then((results) => setVideos(results.filter(Boolean).map((r) => r.data.data)))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <HiPlay className="text-primary-400" />
        Watch Later
      </h1>
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
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-2xl mb-2">No videos saved</p>
          <p>Save videos to watch later by clicking the bookmark icon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} horizontal />
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchLater;

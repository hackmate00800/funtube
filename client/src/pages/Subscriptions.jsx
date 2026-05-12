import React, { useState, useEffect, useContext } from 'react';
import { videosAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import { HiCollection } from 'react-icons/hi';

const Subscriptions = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.subscribedChannels?.length > 0) {
      fetchSubscribedVideos();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSubscribedVideos = async () => {
    try {
      const promises = user.subscribedChannels.map((channel) =>
        videosAPI.getVideos({ user: typeof channel === 'object' ? channel._id : channel, limit: 10 })
      );
      const results = await Promise.all(promises);
      const allVideos = results.flatMap((r) => r.data.data);
      allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setVideos(allVideos);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <HiCollection className="text-primary-400" />
        Subscriptions
      </h1>
      {loading ? (
        <div className="video-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-0">
              <div className="skeleton h-48 w-full" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-2xl mb-2">No subscriptions yet</p>
          <p>Subscribe to channels to see their latest videos here</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;

import React, { useState, useEffect } from 'react';
import { videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import { HiFire } from 'react-icons/hi';

const Trending = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const { data } = await videosAPI.getTrending();
      setVideos(data.data);
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <HiFire className="text-primary-400" />
        Trending
      </h1>
      {loading ? (
        <div className="video-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card p-0">
              <div className="skeleton h-48 w-full" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
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

export default Trending;

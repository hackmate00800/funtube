import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import { HiSearch } from 'react-icons/hi';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) searchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchVideos = async () => {
    setLoading(true);
    try {
      const { data } = await videosAPI.getVideos({ search: query, limit: 50 });
      setVideos(data.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <HiSearch className="text-gray-400" />
        Results for "{query}"
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
          <p className="text-2xl mb-2">No results found</p>
          <p>Try different keywords</p>
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

export default Search;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import CategoryBar from '../components/home/CategoryBar';
import GlassSkeleton from '../components/ui/Skeleton';
import { staggerContainer, staggerItem } from '../utils/animations';
import { HiFire, HiTrendingUp, HiSparkles, HiPlay } from 'react-icons/hi';

const categories = [
  'All', 'Music', 'Gaming', 'Education', 'Entertainment',
  'Sports', 'News', 'Technology', 'Science', 'Travel',
  'Food', 'Fashion', 'Comedy', 'Documentary', 'Vlog', 'Tutorial',
];

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trending, setTrending] = useState([]);
  const mountedRef = useRef(true);
  const trendingFetchedRef = useRef(false);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 20, sort: 'latest' };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      const { data } = await videosAPI.getVideos(params);
      if (!mountedRef.current) return;
      setVideos(data.data);
      setHasMore(data.currentPage < data.totalPages);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [selectedCategory]);

  const fetchMoreVideos = useCallback(async () => {
    try {
      const params = { page, limit: 20, sort: 'latest' };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      const { data } = await videosAPI.getVideos(params);
      if (!mountedRef.current) return;
      setVideos((prev) => [...prev, ...data.data]);
      setHasMore(data.currentPage < data.totalPages);
    } catch (err) {
      console.error('Failed to fetch more videos:', err);
    }
  }, [page, selectedCategory]);

  const fetchTrending = useCallback(async () => {
    try {
      const { data } = await videosAPI.getTrending();
      if (!mountedRef.current) return;
      setTrending(data.data.slice(0, 8));
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    }
  }, []);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    fetchVideos();
    if (!trendingFetchedRef.current && selectedCategory === 'All') {
      fetchTrending();
      trendingFetchedRef.current = true;
    }
  }, [selectedCategory, fetchVideos, fetchTrending]);

  useEffect(() => {
    if (page > 1) fetchMoreVideos();
  }, [page, fetchMoreVideos]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      <div className="relative">
        <div className="absolute -top-8 -left-8 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => { setSelectedCategory(cat); setPage(1); }}
        />
      </div>

      {trending.length > 0 && selectedCategory === 'All' && (
        <motion.section variants={staggerItem}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-primary-400">
                <HiFire className="w-5 h-5" />
              </span>
              Trending Now
            </h2>
            <Link to="/trending" className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
              View all <HiTrendingUp className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="video-grid">
            {trending.map((video, i) => (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section variants={staggerItem}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2.5">
            <span className="w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full" />
            {selectedCategory === 'All' ? 'Recommended for You' : selectedCategory}
          </h2>
          <span className="text-xs text-gray-500">{videos.length} videos</span>
        </div>

        {loading ? (
          <div className="video-grid">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-xl overflow-hidden"
              >
                <GlassSkeleton type="thumbnail" />
                <div className="p-3 flex gap-3">
                  <GlassSkeleton type="avatar" className="flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <GlassSkeleton type="title" />
                    <GlassSkeleton type="text" className="w-1/2" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="p-4 rounded-2xl bg-white/5 mb-4 ring-1 ring-white/10">
              <HiPlay className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-xl font-semibold text-white mb-2">No videos found</p>
            <p className="text-sm text-gray-400">Try a different category or upload your first video!</p>
          </motion.div>
        ) : (
          <>
            <div className="video-grid">
              {videos.map((video, i) => (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <VideoCard video={video} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-10"
              >
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-glass px-8 py-3 hover:shadow-glow-sm transition-all"
                >
                  Load More Videos
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.section>
    </motion.div>
  );
};

export default Home;

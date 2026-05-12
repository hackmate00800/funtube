import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiBookOpen, HiAcademicCap, HiChartBar, HiTrendingUp,
  HiStar, HiClock, HiPlay,
  HiSearch, HiArrowRight, HiCode, HiUserGroup,
} from 'react-icons/hi';
import api from '../services/api';

const categories = [
  { id: 'all', label: 'All Paths', icon: HiBookOpen },
  { id: 'mern', label: 'MERN Stack', icon: HiCode },
  { id: 'dsa', label: 'DSA', icon: HiAcademicCap },
  { id: 'ai-ml', label: 'AI & ML', icon: HiTrendingUp },
  { id: 'devops', label: 'DevOps', icon: HiUserGroup },
  { id: 'frontend', label: 'Frontend', icon: HiStar },
  { id: 'backend', label: 'Backend', icon: HiChartBar },
  { id: 'android', label: 'Android', icon: HiCode },
];

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

function LearningDashboard() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [myProgress, setMyProgress] = useState({});

  useEffect(() => {
    fetchPaths();
    fetchMyProgress();
  }, [activeCategory]);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const { data } = await api.get('/learning-paths', { params });
      setPaths(data.data || []);
    } catch (err) {
      console.error('Failed to fetch paths:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProgress = async () => {
    try {
      const { data } = await api.get('/learning-paths/enrolled');
      const progressMap = {};
      if (data?.data) {
        data.data.forEach(p => {
          const pathId = typeof p.path === 'object' ? p.path?._id : p.path;
          progressMap[pathId] = p;
        });
      }
      setMyProgress(progressMap);
    } catch (err) {
      // Not enrolled in any yet
    }
  };

  const handleEnroll = async (pathId) => {
    try {
      await api.post(`/learning-paths/${pathId}/enroll`);
      const { data } = await api.get(`/learning-paths/${pathId}/progress`);
      setMyProgress(prev => ({ ...prev, [pathId]: data.data }));
    } catch (err) {
      console.error('Failed to enroll:', err);
    }
  };

  const filteredPaths = paths.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Learning Paths</h1>
          <p className="text-gray-400 mt-1">Structured learning journeys to master new skills</p>
        </div>
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-panel pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'glass-panel text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <cat.icon className="text-lg" />
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3 mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-white/10 rounded w-16" />
                <div className="h-6 bg-white/10 rounded w-20" />
              </div>
              <div className="h-2 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="text-center py-20">
          <HiBookOpen className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No learning paths found for this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPaths.map((path, i) => {
              const progress = myProgress[path._id];
              const completedSteps = progress?.completedSteps?.length || 0;
              const totalSteps = path.totalSteps || 1;
              const progressPercent = Math.round((completedSteps / totalSteps) * 100);
              return (
                <motion.div
                  key={path._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel rounded-2xl p-6 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${difficultyColors[path.difficulty] || 'bg-gray-500/20 text-gray-400'}`}>
                      {path.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{path.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                    {path.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{path.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><HiClock />{path.totalMinutes || '?'} min</span>
                    <span className="flex items-center gap-1"><HiStar />{path.enrolledCount || 0} enrolled</span>
                    <span className="flex items-center gap-1"><HiBookOpen />{path.modules?.length || 0} modules</span>
                  </div>
                  {progress ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-primary-400">{progressPercent}% complete</span>
                        <span className="text-gray-500">{completedSteps}/{totalSteps} steps</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                        />
                      </div>
                      <Link
                        to={`/learning-path/${path._id}`}
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary-500/10 text-primary-400 text-sm hover:bg-primary-500/20 transition-all"
                      >
                        Continue Learning <HiArrowRight />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnroll(path._id)}
                      className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-500/10 text-primary-400 text-sm hover:bg-primary-500/20 transition-all"
                    >
                      <HiPlay /> Start Learning
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default LearningDashboard;

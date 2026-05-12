import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiPlay, HiScissors, HiSparkles, HiRefresh,
  HiClock, HiEye, HiCollection,
} from 'react-icons/hi';
import api from '../services/api';

function ShortsStudio() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchMyShorts();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await api.get('/videos/creator');
      setVideos(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyShorts = async () => {
    try {
      const { data } = await api.get('/shorts/my-shorts');
      setShorts(data.data || []);
    } catch (err) { console.error(err); }
  };

  const detectHighlights = async (videoId) => {
    try {
      setLoading(true);
      setSelectedVideo(videoId);
      const { data } = await api.get(`/shorts/highlights/${videoId}`);
      setHighlights(data.data);
    } catch (err) {
      console.error('Failed to detect highlights:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateShort = async (highlight) => {
    if (!selectedVideo) return;
    try {
      setGenerating(true);
      await api.post(`/shorts/generate/${selectedVideo}`, { highlight });
      fetchMyShorts();
    } catch (err) {
      console.error('Failed to generate short:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Shorts Studio</h1>
          <p className="text-gray-400 mt-1">AI-powered short-form content generator from your videos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><HiCollection /> Your Videos</h3>
            <div className="space-y-2">
              {videos.map(v => (
                <button
                  key={v._id}
                  onClick={() => detectHighlights(v._id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedVideo === v._id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{Math.floor((v.duration || 0) / 60)} min</p>
                </button>
              ))}
              {videos.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Upload videos first</p>}
            </div>
          </div>

          {shorts.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Generated Shorts</h3>
              <div className="space-y-2">
                {shorts.map(s => (
                  <div key={s._id} className="p-3 rounded-xl bg-white/5">
                    <p className="text-sm text-white truncate">{s.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{s.duration}s</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        s.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <HiRefresh className="animate-spin text-4xl text-primary-400 mx-auto mb-3" />
              <p className="text-gray-400">Analyzing video for highlight moments...</p>
            </div>
          ) : highlights ? (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><HiSparkles /> AI-Detected Highlights</h3>
                <p className="text-sm text-gray-400 mb-4">Select highlights to generate short-form content</p>
                <div className="space-y-3">
                  {highlights.highlights?.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <HiScissors className="text-primary-400 text-sm" />
                            <p className="font-medium text-white">{h.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{h.reason}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><HiClock /> {h.startTime}s - {h.endTime}s</span>
                            <span className="flex items-center gap-1"><HiEye /> {h.engagementPotential}% engagement</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              (h.engagementPotential || 0) >= 80 ? 'text-green-400' :
                              (h.engagementPotential || 0) >= 60 ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{h.engagementPotential || 0}%</div>
                            <p className="text-[10px] text-gray-600">Score</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => generateShort(h)}
                        disabled={generating}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {generating ? <><HiRefresh className="animate-spin" /> Generating...</> : <><HiPlay /> Generate Short</>}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center py-20">
              <HiScissors className="text-5xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Select a video from the left to detect highlight moments for short-form content</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ShortsStudio;

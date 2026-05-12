import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { summaryAPI } from '../../services/api';
import SummarySection from './SummarySection';
import SummaryLevelSelector from './SummaryLevelSelector';
import GlassProgress from '../ui/Progress';
import { HiSparkles, HiDownload, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

const SummaryPanel = ({ videoId, onSeek }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('beginner');
  const [progress, setProgress] = useState(0);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);
      const { data } = await summaryAPI.generateSummary(videoId, level);
      clearInterval(interval);
      setProgress(100);
      setSummary(data.data);
      toast.success('Summary generated!');
    } catch {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await summaryAPI.downloadSummary(videoId, level);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-${level}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download');
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-900/90 backdrop-blur-xl rounded-2xl border border-white/5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <HiSparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-white">AI Summary</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {summary && (
            <>
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Download PDF"
              >
                <HiDownload className="w-4 h-4" />
              </button>
              <button
                onClick={generateSummary}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Regenerate"
              >
                <HiRefresh className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-b border-white/5">
        <SummaryLevelSelector level={level} onChange={setLevel} />
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!summary && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 rounded-2xl bg-primary-500/10 mb-4">
              <HiSparkles className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">AI-Powered Summary</p>
            <p className="text-xs text-gray-400 mb-6 max-w-xs">
              Get a smart summary of this video tailored to your level
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateSummary}
              className="btn-primary text-sm"
            >
              <HiSparkles className="w-4 h-4" />
              Generate Summary
            </motion.button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full"
            />
            <p className="text-sm text-gray-400">Generating summary...</p>
            <div className="w-48">
              <GlassProgress value={progress} size="sm" />
            </div>
          </div>
        )}

        {summary && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {summary.sections?.map((section, i) => (
              <SummarySection
                key={i}
                title={section.title}
                content={section.content}
                timestamp={section.timestamp}
                onSeek={onSeek}
                index={i}
              />
            ))}
            {summary.keyPoints?.length > 0 && (
              <div className="glass-panel rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Key Points</h4>
                <ul className="space-y-1.5">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-primary-400 mt-0.5">&bull;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;

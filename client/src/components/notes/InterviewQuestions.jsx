import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiChevronUp, HiLightningBolt, HiClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const DIFFICULTY_CONFIG = {
  easy: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Easy' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Medium' },
  hard: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Hard' },
};

const InterviewQuestions = ({ questions }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const filtered = filterDifficulty === 'all'
    ? questions
    : questions.filter(q => q.difficulty === filterDifficulty);

  const toggleExpand = (index) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <HiLightningBolt className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No interview questions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 mb-3">
        {['all', 'easy', 'medium', 'hard'].map(d => (
          <button key={d}
            onClick={() => setFilterDifficulty(d)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all border capitalize ${
              filterDifficulty === d
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                : 'text-gray-500 border-transparent hover:bg-white/5'
            }`}>
            {d === 'all' ? `All (${questions.length})` : d}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {filtered.map((q, i) => {
          const diff = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium;
          const isExpanded = expandedIndex === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel rounded-xl border border-white/5 overflow-hidden"
            >
              <button onClick={() => toggleExpand(i)}
                className="w-full flex items-start gap-3 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${diff.bg} ${diff.color}`}>
                      {diff.label}
                    </span>
                    {q.category && (
                      <span className="text-[10px] text-gray-500">{q.category}</span>
                    )}
                    {q.expectedDuration && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <HiClock className="w-3 h-3" /> {q.expectedDuration}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
                </div>
                {isExpanded ? <HiChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <HiChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      <div>
                        <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Model Answer</p>
                        <div className="glass-panel rounded-xl p-3 border border-primary-500/10">
                          <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                        </div>
                      </div>

                      {q.tips?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Tips</p>
                          <div className="space-y-1">
                            {q.tips.map((tip, j) => (
                              <div key={j} className="flex items-start gap-2 text-xs text-gray-400">
                                <span className="text-primary-400 mt-0.5">•</span>
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => {
                        navigator.clipboard.writeText(`Q: ${q.question}\n\nA: ${q.answer}`);
                        toast?.success('Copied to clipboard');
                      }}
                        className="text-[10px] text-primary-400 hover:text-primary-300 font-medium">
                        Copy Q&A
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default InterviewQuestions;

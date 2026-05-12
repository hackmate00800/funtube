import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notesAPI } from '../../services/api';
import { HiLightningBolt, HiRefresh, HiChevronLeft, HiChevronRight,
  HiStar, HiEye, HiCheck, HiX, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Easy' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Medium' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Hard' },
};

const FlashcardDeck = ({ cards, notesId, onRefresh }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());

  const current = cards[currentIndex];
  const total = cards.length;

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    }
  }, [currentIndex, total]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const handleMastered = async () => {
    if (!notesId || !current) return;
    try {
      await notesAPI.updateFlashcard(notesId, {
        cardIndex: currentIndex,
        mastered: true,
        timesReviewed: (current.timesReviewed || 0) + 1,
        lastReviewed: new Date(),
      });
      setMastered(prev => new Set([...prev, currentIndex]));
      toast.success('Marked as mastered!');
    } catch { toast.error('Failed to update'); }
  };

  const handleShuffle = () => {
    setCurrentIndex(Math.floor(Math.random() * total));
    setFlipped(false);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8">
        <HiLightningBolt className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No flashcards available</p>
      </div>
    );
  }

  const diff = DIFFICULTY_COLORS[current?.difficulty] || DIFFICULTY_COLORS.medium;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{currentIndex + 1} / {total}</span>
        {current?.difficulty && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${diff.bg} ${diff.text}`}>
            {diff.label}
          </span>
        )}
        {mastered.has(currentIndex) && (
          <span className="text-green-400 flex items-center gap-1 text-[10px]">
            <HiCheck className="w-3 h-3" /> Mastered
          </span>
        )}
      </div>

      <div className="w-full cursor-pointer perspective-[1000px]" onClick={handleFlip} style={{ minHeight: 200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? 'back' : 'front'}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-panel-strong rounded-2xl p-6 border border-white/10 w-full flex flex-col items-center justify-center text-center"
            style={{ minHeight: 200 }}
          >
            {!flipped ? (
              <>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Question</p>
                <p className="text-sm text-white font-medium leading-relaxed">{current?.front}</p>
                {current?.hint && (
                  <p className="text-[10px] text-gray-500 mt-4 italic">💡 {current.hint}</p>
                )}
                <p className="text-[10px] text-gray-600 mt-4">Click to reveal answer</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Answer</p>
                <p className="text-sm text-gray-200 leading-relaxed">{current?.back}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handlePrev} disabled={currentIndex === 0}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-all">
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <button onClick={handleShuffle}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <HiRefresh className="w-4 h-4" />
        </button>

        {!mastered.has(currentIndex) && (
          <button onClick={handleMastered}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 border border-green-500/20 transition-all">
            <HiCheck className="w-3.5 h-3.5" /> Mastered
          </button>
        )}

        <button onClick={handleNext} disabled={currentIndex >= total - 1}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-all">
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {current?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {current.tags.map((tag, i) => (
            <span key={i} className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;

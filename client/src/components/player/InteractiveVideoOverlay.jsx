import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiLightBulb, HiCode, HiBookOpen, HiCheckCircle,
  HiX, HiArrowRight, HiRefresh, HiAcademicCap,
} from 'react-icons/hi';
import api from '../../services/api';

function InteractiveVideoOverlay({ videoId, currentTime, videoDuration }) {
  const [elements, setElements] = useState([]);
  const [activeElement, setActiveElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState({});
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (videoId) fetchElements();
  }, [videoId]);

  const fetchElements = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/interactive-video/generate/${videoId}`);
      if (data?.data?.elements) {
        setElements(data.data.elements.sort((a, b) => a.timestamp - b.timestamp));
      }
    } catch (err) {
      // Use fallback elements based on video duration
      const third = Math.floor((videoDuration || 600) / 3);
      setElements([
        { type: 'quiz', timestamp: third, content: 'What was the main concept introduced?', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0, difficulty: 'easy' },
        { type: 'flashcard', timestamp: third * 2, content: 'Review key terminology', answer: 'Check the earlier section', difficulty: 'medium' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!elements.length || !currentTime) return;
    const next = elements.find(e =>
      Math.abs(e.timestamp - currentTime) < 2 &&
      !dismissed.has(`${e.type}-${e.timestamp}`) &&
      !answered[`${e.type}-${e.timestamp}`]
    );
    if (next && (!activeElement || next.timestamp !== activeElement.timestamp)) {
      setActiveElement(next);
    }
  }, [currentTime, elements]);

  const handleDismiss = useCallback(() => {
    if (activeElement) {
      setDismissed(prev => new Set([...prev, `${activeElement.type}-${activeElement.timestamp}`]));
      setActiveElement(null);
    }
  }, [activeElement]);

  const handleAnswer = (optionIndex) => {
    if (!activeElement) return;
    const key = `${activeElement.type}-${activeElement.timestamp}`;
    setAnswered(prev => ({ ...prev, [key]: optionIndex }));
    if (optionIndex === activeElement.answer) {
      setTimeout(() => {
        setActiveElement(null);
      }, 1500);
    }
  };

  const elementIcons = {
    quiz: HiAcademicCap,
    flashcard: HiBookOpen,
    code_checkpoint: HiCode,
    practice: HiLightBulb,
  };

  if (!activeElement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="absolute bottom-20 left-4 right-4 z-30"
      >
        <div className="max-w-md mx-auto glass-panel-strong rounded-2xl p-4 shadow-glass-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                {React.createElement(elementIcons[activeElement.type] || HiLightBulb, { className: 'text-white text-sm' })}
              </div>
              <span className="text-xs text-gray-400 capitalize">{activeElement.type.replace('_', ' ')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                activeElement.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                activeElement.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-green-500/10 text-green-400'
              }`}>{activeElement.difficulty}</span>
            </div>
            <button onClick={handleDismiss} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
              <HiX className="text-gray-500 text-sm" />
            </button>
          </div>

          {activeElement.type === 'quiz' && (
            <div>
              <p className="text-sm text-white mb-3">{activeElement.content}</p>
              <div className="space-y-2">
                {activeElement.options?.map((option, i) => {
                  const isAnswered = answered[`${activeElement.type}-${activeElement.timestamp}`] !== undefined;
                  const isCorrect = activeElement.answer === i;
                  const isSelected = answered[`${activeElement.type}-${activeElement.timestamp}`] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={isAnswered}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                        isAnswered
                          ? isCorrect
                            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                            : isSelected
                              ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                              : 'bg-white/5 text-gray-400'
                          : 'bg-white/5 text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                        {isAnswered && isCorrect && <HiCheckCircle className="ml-auto text-green-400" />}
                        {isAnswered && isSelected && !isCorrect && <HiX className="ml-auto text-red-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeElement.type === 'flashcard' && (
            <FlashcardView element={activeElement} />
          )}

          {(activeElement.type === 'code_checkpoint' || activeElement.type === 'practice') && (
            <div>
              <p className="text-sm text-white mb-2">{activeElement.content}</p>
              {activeElement.hint && (
                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-3">
                  <span className="font-medium">Hint: </span>{activeElement.hint}
                </div>
              )}
              {activeElement.answer && (
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-white transition-colors">Show answer</summary>
                  <p className="mt-2 p-2 rounded-lg bg-white/5 text-gray-300">{activeElement.answer}</p>
                </details>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FlashcardView({ element }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div>
      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer min-h-[80px] flex items-center justify-center"
      >
        <motion.div
          key={flipped ? 'back' : 'front'}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          className="text-sm text-center"
        >
          {flipped ? (
            <p className="text-primary-300">{element.answer}</p>
          ) : (
            <p className="text-white">{element.content}</p>
          )}
        </motion.div>
      </div>
      <p className="text-[10px] text-gray-600 text-center mt-2">Click to {flipped ? 'see question' : 'reveal answer'}</p>
    </div>
  );
}

export default InteractiveVideoOverlay;

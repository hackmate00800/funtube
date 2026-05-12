import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck, HiX, HiLightningBolt, HiRefresh } from 'react-icons/hi';

const QuizViewer = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [results, setResults] = useState({});
  const [showResults, setShowResults] = useState(false);

  const current = questions[currentIndex];
  const total = questions.length;

  const handleSelect = useCallback((index) => {
    if (answered) return;
    setSelected(index);
  }, [answered]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const isCorrect = selected === current.correctAnswer;
    setAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setResults(prev => ({ ...prev, [currentIndex]: isCorrect }));
  }, [selected, current, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setShowResults(true);
    }
  }, [currentIndex, total]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore({ correct: 0, total: 0 });
    setResults({});
    setShowResults(false);
  };

  if (showResults) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="text-center py-6 space-y-4">
        <div className={`text-4xl font-bold ${percentage >= 80 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score.correct}/{score.total}
        </div>
        <p className="text-sm text-gray-400">
          {percentage >= 80 ? 'Excellent! Great understanding!' :
           percentage >= 50 ? 'Good effort! Review the missed questions.' :
           'Keep studying! Review the material and try again.'}
        </p>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${
              percentage >= 80 ? 'bg-green-400' : percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
          />
        </div>
        <div className="flex gap-2 justify-center">
          {Object.entries(results).map(([qIndex, correct]) => (
            <div key={qIndex}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                correct ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
              {parseInt(qIndex) + 1}
            </div>
          ))}
        </div>
        <button onClick={handleRestart}
          className="px-4 py-2 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-all">
          <HiRefresh className="w-3.5 h-3.5 inline mr-1" /> Restart Quiz
        </button>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <HiLightningBolt className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No quiz questions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Question {currentIndex + 1} of {total}</span>
        <span>Score: {score.correct}/{score.total}</span>
      </div>

      <div className="glass-panel-strong rounded-2xl p-5 border border-white/10">
        <p className="text-sm font-medium text-white mb-4 leading-relaxed">{current?.question}</p>

        <div className="space-y-2">
          {current?.options?.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correctAnswer;
            const showCorrect = answered && isCorrect;
            const showWrong = answered && isSelected && !isCorrect;

            return (
              <motion.button
                key={i}
                onClick={() => handleSelect(i)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs transition-all border ${
                  showCorrect
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : showWrong
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : isSelected
                        ? 'bg-primary-500/10 border-primary-500/20 text-white'
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                }`}
                disabled={answered}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  showCorrect ? 'bg-green-500/20' :
                  showWrong ? 'bg-red-500/20' :
                  isSelected ? 'bg-primary-500/20' : 'bg-white/10'
                }`}>
                  {showCorrect ? <HiCheck className="w-4 h-4" /> :
                   showWrong ? <HiX className="w-4 h-4" /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        {!answered ? (
          <button onClick={handleSubmit} disabled={selected === null}
            className="px-4 py-2 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Submit Answer
          </button>
        ) : (
          <div className="w-full space-y-3">
            {current?.explanation && (
              <div className="glass-panel rounded-xl p-3 border border-primary-500/10">
                <p className="text-[10px] text-gray-500 font-medium mb-1">Explanation</p>
                <p className="text-xs text-gray-300">{current.explanation}</p>
              </div>
            )}
            <div className="flex justify-between">
              <div />
              <button onClick={handleNext}
                className="px-4 py-2 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-all">
                {currentIndex < total - 1 ? 'Next Question' : 'See Results'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizViewer;

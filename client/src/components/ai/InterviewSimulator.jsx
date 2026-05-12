import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiMicrophone, HiStop, HiPlay, HiRefresh, HiCheckCircle,
  HiXCircle, HiLightBulb, HiClock, HiChartBar, HiStar,
} from 'react-icons/hi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const SAMPLE_QUESTIONS = [
  { question: 'Tell me about yourself and your background.', category: 'general', difficulty: 'easy' },
  { question: 'What are your greatest strengths and weaknesses?', category: 'general', difficulty: 'easy' },
  { question: 'Describe a challenging project you worked on.', category: 'behavioral', difficulty: 'medium' },
  { question: 'How do you stay updated with industry trends?', category: 'general', difficulty: 'medium' },
  { question: 'Explain a technical concept to a non-technical audience.', category: 'technical', difficulty: 'hard' },
  { question: 'Where do you see yourself in 5 years?', category: 'career', difficulty: 'easy' },
];

function InterviewSimulator({ isOpen, onClose, role }) {
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (isRecording) {
      setTimeLeft(120);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            stopRecording();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setFeedback(null);
    setShowFeedback(false);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    generateFeedback();
  };

  const generateFeedback = () => {
    const mockFeedback = {
      clarity: Math.floor(Math.random() * 40) + 60,
      relevance: Math.floor(Math.random() * 30) + 70,
      confidence: Math.floor(Math.random() * 35) + 65,
      structure: Math.floor(Math.random() * 40) + 60,
      tips: [
        'Try to provide specific examples from your experience.',
        'Structure your answer using the STAR method (Situation, Task, Action, Result).',
        'Keep your answer concise — aim for 2-3 minutes.',
      ],
    };
    setFeedback(mockFeedback);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setAnswers(prev => [...prev, { question: currentQuestion, feedback }]);
    setShowFeedback(false);
    setFeedback(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setSessionComplete(false);
    setShowFeedback(false);
    setFeedback(null);
  };

  const overallScore = answers.length > 0
    ? Math.round(answers.reduce((s, a) => {
        const f = a.feedback;
        return s + (f.clarity + f.relevance + f.confidence + f.structure) / 4;
      }, 0) / answers.length)
    : 0;

  return (
    <Modal open={isOpen} onClose={onClose} title="Interview Simulator" size="lg" showClose={false}>
      {sessionComplete ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">
            {overallScore >= 80 ? '🌟' : overallScore >= 60 ? '👍' : '💪'}
          </div>
          <h3 className="text-2xl font-bold mb-2">Interview Complete!</h3>
          <p className="text-gray-400 mb-2">Role: {role || 'General'}</p>
          <div className="flex items-center justify-center gap-2 text-4xl font-bold gradient-text mb-6">
            {overallScore}%
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto">
            {['clarity', 'relevance', 'confidence', 'structure'].map(cat => {
              const avg = answers.length > 0
                ? Math.round(answers.reduce((s, a) => s + (a.feedback?.[cat] || 0), 0) / answers.length)
                : 0;
              return (
                <div key={cat} className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-gray-500 capitalize mb-1">{cat}</p>
                  <p className="text-lg font-bold capitalize"
                    style={{ color: avg >= 80 ? '#4ade80' : avg >= 60 ? '#fbbf24' : '#f87171' }}>
                    {avg}%
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-400 mb-6">You answered {answers.length} questions in this session.</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={handleRestart}><HiRefresh className="mr-1" /> Practice Again</Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {questions.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-primary-500 scale-125' :
                  i < currentIndex ? 'bg-green-500' : 'bg-white/10'
                }`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-2 mb-3">
              <HiStar className="text-primary-400 mt-0.5" />
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-lg ${
                  currentQuestion.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-green-500/10 text-green-400'
                }`}>{currentQuestion.difficulty}</span>
                <span className="text-xs text-gray-500 ml-2 capitalize">{currentQuestion.category}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white">{currentQuestion.question}</h3>
          </div>

          {isRecording && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="text-sm text-red-400">Recording... {timeLeft}s remaining</span>
            </div>
          )}

          <AnimatePresence>
            {showFeedback && feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="glass-panel rounded-2xl p-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <HiChartBar /> Real-time Feedback
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { key: 'clarity', label: 'Clarity' },
                      { key: 'relevance', label: 'Relevance' },
                      { key: 'confidence', label: 'Confidence' },
                      { key: 'structure', label: 'Structure' },
                    ].map(cat => (
                      <div key={cat.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">{cat.label}</span>
                          <span className={feedback[cat.key] >= 80 ? 'text-green-400' : feedback[cat.key] >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                            {feedback[cat.key]}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${feedback[cat.key]}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><HiLightBulb /> Tips</p>
                    {feedback.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-gray-400 mb-1 flex items-start gap-1">
                        <span className="text-primary-400 mt-0.5">•</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!showFeedback && (
                <Button
                  variant={isRecording ? 'danger' : 'gradient'}
                  icon={isRecording ? HiStop : HiMicrophone}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? 'Stop Recording' : 'Start Answering'}
                </Button>
              )}
              {answers.length > 0 && !isRecording && (
                <Button variant="ghost" onClick={handleRestart}><HiRefresh /> Restart</Button>
              )}
            </div>
            {showFeedback && (
              <Button onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'} <HiPlay className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default InterviewSimulator;

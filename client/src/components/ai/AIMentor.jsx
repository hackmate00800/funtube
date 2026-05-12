import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSparkles, HiX, HiPaperAirplane, HiAcademicCap,
  HiLightBulb, HiCode, HiQuestionMarkCircle,
} from 'react-icons/hi';
import api from '../../services/api';

const quickActions = [
  { icon: HiLightBulb, label: 'Explain a concept', prompt: 'Can you explain a concept about what I\'m learning?' },
  { icon: HiCode, label: 'Code help', prompt: 'Help me with a coding problem related to this topic' },
  { icon: HiQuestionMarkCircle, label: 'Practice quiz', prompt: 'Give me a practice quiz question based on what I\'ve been learning' },
  { icon: HiAcademicCap, label: 'Study tips', prompt: 'Give me study tips for the topic I\'m learning' },
];

function AIMentor({ isOpen, onClose, videoContext }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI Mentor. Ask me anything about what you\'re learning, or use one of the quick actions below.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const contextMessages = videoContext
        ? [{ role: 'system', content: `The user is watching a video: ${videoContext.title}. Video context: ${videoContext.description || ''}` }]
        : [];
      const { data } = await api.post('/ai/chat', {
        messages: [...contextMessages, ...messages.slice(-6), { role: 'user', content: message }],
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data?.message || 'I\'m not sure how to answer that. Can you rephrase?' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-4 bottom-20 w-96 h-[600px] glass-panel-strong rounded-2xl shadow-glass-xl z-50 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                <HiSparkles className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Mentor</p>
                <p className="text-[10px] text-gray-500">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <HiX className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-500/20 text-primary-200 rounded-tr-sm'
                    : 'bg-white/5 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                        className="w-2 h-2 bg-gray-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-gray-600 mb-2 text-center">QUICK ACTIONS</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <action.icon className="text-sm" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your AI Mentor..."
                className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all disabled:opacity-30"
              >
                <HiPaperAirplane className="text-lg" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AIMentor;

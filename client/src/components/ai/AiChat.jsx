import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChat, HiX, HiPaperAirplane, HiSparkles } from 'react-icons/hi';
import { aiAPI } from '../../services/api';
import GlassTooltip from '../ui/Tooltip';

const WELCOME_MSG = {
  role: 'assistant',
  content: "Hey! I'm your FunTube AI assistant. Ask me anything about uploading, creating channels, subscriptions, video quality, or any platform features!",
};

const quickActions = [
  'How do I upload a video?',
  'How to create a channel?',
  'Tips for more views',
  'Video quality settings',
];

const AiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages]);

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const conv = updated
        .filter((m) => m !== WELCOME_MSG)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(conv);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mb-4 w-80 sm:w-96 glass-panel-strong rounded-2xl shadow-glass-xl flex flex-col overflow-hidden border border-white/10"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-primary-600/20 to-primary-800/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm">
                  <HiSparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-white text-sm">AI Assistant</span>
                  <p className="text-[10px] text-gray-500">Powered by Gemini</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <HiX className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>

            <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3 bg-dark-900/50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex gap-2 max-w-[85%]">
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-500/20 text-white border border-primary-500/20'
                          : 'bg-white/5 text-gray-200 border border-white/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="bg-white/5 rounded-2xl px-4 py-3 text-sm text-gray-400 flex items-center gap-1.5 border border-white/5">
                      <motion.span className="w-2 h-2 bg-primary-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.span className="w-2 h-2 bg-primary-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.span className="w-2 h-2 bg-primary-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-white/5 p-4 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/5 text-gray-200 text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder-gray-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className={`p-2.5 rounded-xl transition-all ${
                  loading || !input.trim()
                    ? 'bg-white/5 text-gray-500'
                    : 'bg-primary-500 text-white hover:bg-primary-400 shadow-glow-sm'
                }`}
                aria-label="Send message"
              >
                <HiPaperAirplane className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassTooltip content={open ? 'Close chat' : 'AI Assistant'} position="left">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-glass-lg transition-all duration-300 border ${
            open
              ? 'bg-dark-800 text-gray-300 border-white/10 rotate-90'
              : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-primary-400/30 hover:shadow-glow-lg'
          }`}
          aria-label={open ? 'Close chat' : 'Open AI assistant'}
        >
          {open ? (
            <HiX className="w-6 h-6" />
          ) : (
            <HiSparkles className="w-6 h-6" />
          )}
        </motion.button>
      </GlassTooltip>
    </div>
  );
};

export default AiChat;

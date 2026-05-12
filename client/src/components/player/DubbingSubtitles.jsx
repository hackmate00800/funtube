import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiTranslate, HiRefresh, HiCheckCircle,
  HiGlobe, HiChevronDown, HiPlay,
} from 'react-icons/hi';
import api from '../../services/api';

const LANG_FLAGS = {
  en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', hi: '🇮🇳',
  ja: '🇯🇵', ko: '🇰🇷', pt: '🇧🇷', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳',
};

function DubbingSubtitles({ videoId, currentTime, onSubtitleChange }) {
  const [languages, setLanguages] = useState({});
  const [activeLang, setActiveLang] = useState('en');
  const [subtitles, setSubtitles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    api.get('/dubbing/languages').then(({ data }) => setLanguages(data.data || {})).catch(() => {});
  }, []);

  useEffect(() => {
    if (videoId && activeLang) fetchSubtitles();
  }, [videoId, activeLang]);

  const fetchSubtitles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/dubbing/subtitles/${videoId}`, { params: { language: activeLang } });
      setSubtitles(data.data);
    } catch (err) {
      setSubtitles(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!subtitles?.segments || !currentTime) {
      setCurrentText('');
      return;
    }
    const seg = subtitles.segments.find(s => currentTime >= s.start && currentTime <= s.end);
    setCurrentText(seg?.translatedText || seg?.text || '');
  }, [currentTime, subtitles]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { data } = await api.post(`/dubbing/subtitles/${videoId}/generate`, { language: activeLang });
      setSubtitles(data.data);
      onSubtitleChange?.(activeLang);
    } catch (err) {
      console.error('Subtitle generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-panel text-xs text-gray-300 hover:text-white transition-all"
        title="Subtitles & Dubbing"
      >
        <HiTranslate /> {activeLang.toUpperCase()}
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-10 w-56 glass-panel-strong rounded-xl p-2 z-50 shadow-glass-xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 mb-1">
              <span className="text-xs text-gray-400">Subtitles</span>
              {subtitles?.segments?.length > 0 && (
                <span className="text-[10px] text-green-400 flex items-center gap-1"><HiCheckCircle /> Ready</span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {Object.entries(languages).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => { setActiveLang(code); setShowPicker(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${
                    activeLang === code
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span>{LANG_FLAGS[code] || '🌐'}</span>
                  <span className="flex-1">{lang.name}</span>
                  <span className="text-gray-500">{lang.native}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={handleGenerate}
                disabled={generating || activeLang === 'en'}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {generating ? <><HiRefresh className="animate-spin" /> Generating...</> : <><HiGlobe /> Generate {languages[activeLang]?.name || ''}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentText && activeLang !== 'en' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-lg w-full px-4"
          >
            <div className="glass-panel-strong rounded-xl px-4 py-2.5 text-center shadow-glass-xl">
              <p className="text-sm text-white">{currentText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DubbingSubtitles;

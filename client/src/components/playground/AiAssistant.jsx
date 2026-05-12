import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSparkles, HiShieldExclamation, HiLightningBolt, HiBookOpen,
  HiSwitchHorizontal, HiClipboardList, HiX,
  HiChevronDown, HiRefresh,
} from 'react-icons/hi';
import api from '../../services/api';

const ACTIONS = [
  { id: 'debug', icon: HiShieldExclamation, label: 'Debug Error', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'optimize', icon: HiLightningBolt, label: 'Optimize Code', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'explain', icon: HiBookOpen, label: 'Explain Code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'convert', icon: HiSwitchHorizontal, label: 'Convert Language', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'tests', icon: HiClipboardList, label: 'Generate Tests', color: 'text-green-400', bg: 'bg-green-500/10' },
];

function AiAssistant({ code, language }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [convertLang, setConvertLang] = useState('python');
  const [error, setError] = useState('');

  const handleAction = async (actionId) => {
    if (!code.trim()) return;
    setLoading(actionId);
    setResult(null);
    setError('');
    try {
      let res;
      switch (actionId) {
        case 'debug':
          res = await api.post('/code-playground/ai/debug', { code, language, error });
          setResult({ type: 'debug', content: res.data.data.explanation });
          break;
        case 'optimize':
          res = await api.post('/code-playground/ai/optimize', { code, language });
          setResult({ type: 'optimize', content: res.data.data.suggestion });
          break;
        case 'explain':
          res = await api.post('/code-playground/ai/explain', { code, language });
          setResult({ type: 'explain', content: res.data.data.explanation });
          break;
        case 'convert':
          res = await api.post('/code-playground/ai/convert', { code, fromLanguage: language, toLanguage: convertLang });
          setResult({ type: 'convert', content: res.data.data.code, lang: convertLang });
          break;
        case 'tests':
          res = await api.post('/code-playground/ai/unit-tests', { code, language });
          setResult({ type: 'tests', content: res.data.data.tests });
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(null);
    }
  };

  const mdToText = (md) => md.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\n{2,}/g, '\n\n');

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/5 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <HiSparkles className="text-primary-400 text-sm" />
          <span className="text-xs font-medium text-gray-300">AI Assistant</span>
        </div>
        <HiChevronDown className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => action.id === 'convert' ? setResult(null) : handleAction(action.id)}
                    disabled={loading !== null}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      action.bg} ${action.color} hover:opacity-80 disabled:opacity-40`}
                  >
                    {loading === action.id ? (
                      <HiRefresh className="animate-spin text-xs" />
                    ) : (
                      <action.icon className="text-xs" />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={convertLang}
                  onChange={(e) => setConvertLang(e.target.value)}
                  className="flex-1 bg-white/5 text-xs text-gray-300 rounded-lg px-2 py-1.5 border border-white/5"
                >
                  {['python', 'javascript', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'kotlin'].map(l => (
                    <option key={l} value={l} className="bg-gray-900">{l}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAction('convert')}
                  disabled={loading !== null}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 font-medium hover:opacity-80 disabled:opacity-40"
                >
                  Convert
                </button>
              </div>

              {(result || error) && (
                <div className="relative mt-2 p-3 rounded-xl bg-dark-900/50 border border-white/5 max-h-40 overflow-y-auto">
                  {result && (
                    <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {mdToText(result.content)}
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-red-400">{error}</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AiAssistant;

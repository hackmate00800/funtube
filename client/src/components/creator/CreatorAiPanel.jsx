import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSparkles, HiPhotograph, HiPencilAlt, HiSearch,
  HiChartBar, HiTrendingUp, HiDocumentText, HiRefresh,
  HiCheckCircle, HiX, HiLightBulb, HiClipboard, HiClipboardCheck,
} from 'react-icons/hi';
import api from '../../services/api';

const tools = [
  { id: 'thumbnail', name: 'Thumbnail Analyzer', icon: HiPhotograph, color: 'from-pink-500 to-rose-500' },
  { id: 'title', name: 'Title Optimizer', icon: HiPencilAlt, color: 'from-blue-500 to-cyan-500' },
  { id: 'seo', name: 'SEO Suggestions', icon: HiSearch, color: 'from-green-500 to-emerald-500' },
  { id: 'engagement', name: 'Engagement Predictor', icon: HiChartBar, color: 'from-yellow-500 to-orange-500' },
  { id: 'script', name: 'Script Generator', icon: HiDocumentText, color: 'from-purple-500 to-violet-500' },
  { id: 'trends', name: 'Trend Analysis', icon: HiTrendingUp, color: 'from-red-500 to-pink-500' },
];

function CreatorAiPanel() {
  const [activeTool, setActiveTool] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      let { data } = { data: null };
      switch (activeTool) {
        case 'thumbnail':
          if (!form.thumbnailUrl) return;
          data = await api.post('/creator-ai/analyze-thumbnail', { thumbnailUrl: form.thumbnailUrl });
          break;
        case 'title':
          if (!form.currentTitle) return;
          data = await api.post('/creator-ai/optimize-title', form);
          break;
        case 'seo':
          if (!form.title) return;
          data = await api.post('/creator-ai/seo', form);
          break;
        case 'engagement':
          if (!form.title) return;
          data = await api.post('/creator-ai/predict-engagement', form);
          break;
        case 'script':
          if (!form.topic) return;
          data = await api.post('/creator-ai/generate-script', form);
          break;
        case 'trends':
          if (!form.category) return;
          data = await api.post('/creator-ai/analyze-trends', { category: form.category });
          break;
      }
      setResult(data?.data || data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setForm({});
    setResult(null);
  };

  const renderForm = () => {
    const inputs = {
      thumbnail: [
        { key: 'thumbnailUrl', label: 'Thumbnail URL', type: 'text', placeholder: 'https://example.com/thumbnail.jpg' },
      ],
      title: [
        { key: 'currentTitle', label: 'Current Title', type: 'text', placeholder: 'My Video Title' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Video description...' },
        { key: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'tag1, tag2, tag3' },
      ],
      seo: [
        { key: 'title', label: 'Video Title', type: 'text', placeholder: 'My Video Title' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Video description...' },
        { key: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'tag1, tag2' },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'Education' },
      ],
      engagement: [
        { key: 'title', label: 'Video Title', type: 'text', placeholder: 'My Video Title' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Video description...' },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'Education' },
        { key: 'duration', label: 'Duration (seconds)', type: 'number', placeholder: '600' },
      ],
      script: [
        { key: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., JavaScript Promises' },
        { key: 'tone', label: 'Tone', type: 'select', options: ['educational', 'entertaining', 'professional', 'casual', 'inspirational'] },
        { key: 'duration', label: 'Target Duration (minutes)', type: 'number', placeholder: '10' },
      ],
      trends: [
        { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g., Technology, Education' },
      ],
    };

    return (inputs[activeTool] || []).map(field => (
      <div key={field.key} className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
        {field.type === 'textarea' ? (
          <textarea
            value={form[field.key] || ''}
            onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            rows={3}
          />
        ) : field.type === 'select' ? (
          <select
            value={form[field.key] || ''}
            onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
          >
            <option value="">Select...</option>
            {field.options.map(opt => (
              <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={form[field.key] || ''}
            onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        )}
      </div>
    ));
  };

  const renderResult = () => {
    if (!result) return null;
    if (result.error) {
      return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
          <HiX /> {result.error}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-green-400 flex items-center gap-1"><HiCheckCircle /> Analysis complete</span>
          <button onClick={() => handleCopy(result)} className="text-xs text-gray-500 hover:text-white transition-all flex items-center gap-1">
            {copied ? <><HiClipboardCheck /> Copied</> : <><HiClipboard /> Copy</>}
          </button>
        </div>
        <div className="p-3 rounded-xl bg-white/5 text-sm text-gray-300 max-h-60 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
          <HiSparkles className="text-white text-lg" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Creator AI Tools</h3>
          <p className="text-xs text-gray-500">Optimize your content with AI-powered insights</p>
        </div>
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-2 gap-3">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color}`}>
                <tool.icon className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{tool.name}</p>
                <p className="text-[10px] text-gray-500">AI-powered analysis</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setActiveTool(null); resetForm(); }} className="text-xs text-gray-400 hover:text-white transition-all">
              &larr; Back to tools
            </button>
            <span className="text-xs text-gray-500 capitalize">{activeTool}</span>
          </div>
          {renderForm()}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <><HiRefresh className="animate-spin" /> Analyzing...</> : <>
                <HiSparkles /> Analyze
              </>}
            </button>
          </div>
          <div className="mt-4">
            {renderResult()}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorAiPanel;

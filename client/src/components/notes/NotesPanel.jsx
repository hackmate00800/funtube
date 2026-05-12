import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notesAPI } from '../../services/api';
import FlashcardDeck from './FlashcardDeck';
import QuizViewer from './QuizViewer';
import InterviewQuestions from './InterviewQuestions';
import {
  HiBookOpen, HiSparkles, HiDownload, HiPencil, HiTrash,
  HiChevronDown, HiChevronUp, HiCode, HiPhotograph, HiVariable,
  HiCollection, HiLightningBolt, HiDocumentText, HiAcademicCap,
  HiClipboardList, HiBadgeCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const TabButton = ({ active, icon: Icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all border whitespace-nowrap ${
      active
        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
        : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

const NotesPanel = ({ videoId, onSeek, videoTitle }) => {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  const [customNotes, setCustomNotes] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const { data } = await notesAPI.getNotes(videoId);
      if (data.data) {
        setNotes(data.data);
        setCustomNotes(data.data.customNotes || '');
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await notesAPI.generate(videoId);
      toast.success('Notes generation queued!');
      setNotes(data.data);

      const poll = setInterval(async () => {
        try {
          const { data: statusData } = await notesAPI.getStatus(videoId);
          if (statusData.data?.status === 'completed') {
            clearInterval(poll);
            await loadNotes();
            setGenerating(false);
            toast.success('Notes generated successfully!');
          } else if (statusData.data?.status === 'failed') {
            clearInterval(poll);
            setGenerating(false);
            toast.error('Notes generation failed. Try again.');
          }
        } catch { clearInterval(poll); setGenerating(false); }
      }, 2000);
    } catch (err) {
      setGenerating(false);
      toast.error(err.response?.data?.error || 'Failed to generate notes');
    }
  };

  const handleSaveCustom = async () => {
    if (!notes) return;
    setSavingCustom(true);
    try {
      await notesAPI.update(notes._id, { customNotes });
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingCustom(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!notes) return;
    try {
      const response = await notesAPI.exportMarkdown(notes._id);
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${(videoTitle || 'untitled').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Markdown exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasContent = notes?.status === 'completed';
  const sections = [
    { key: 'chapters', icon: HiCollection, label: 'Chapters', count: notes?.chapters?.length, data: notes?.chapters },
    { key: 'keyConcepts', icon: HiLightningBolt, label: 'Key Concepts', count: notes?.keyConcepts?.length, data: notes?.keyConcepts },
    { key: 'codeSnippets', icon: HiCode, label: 'Code', count: notes?.codeSnippets?.length, data: notes?.codeSnippets },
    { key: 'formulas', icon: HiVariable, label: 'Formulas', count: notes?.formulas?.length, data: notes?.formulas },
    { key: 'flashcards', icon: HiAcademicCap, label: 'Flashcards', count: notes?.flashcards?.length, data: notes?.flashcards },
    { key: 'quizQuestions', icon: HiClipboardList, label: 'Quiz', count: notes?.quizQuestions?.length, data: notes?.quizQuestions },
    { key: 'interviewQuestions', icon: HiBadgeCheck, label: 'Interview', count: notes?.interviewQuestions?.length, data: notes?.interviewQuestions },
  ];

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/5 rounded w-1/3" />
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-20 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-strong rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiBookOpen className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">AI Notes</h3>
          </div>
          <div className="flex gap-1.5">
            {hasContent && (
              <button onClick={handleExportMarkdown}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Export Markdown">
                <HiDownload className="w-4 h-4" />
              </button>
            )}
            {!notes && !generating && (
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-400 transition-all">
                <HiSparkles className="w-3.5 h-3.5" />
                Generate
              </button>
            )}
          </div>
        </div>

        {(!notes || notes.status === 'failed') && !generating && (
          <div className="text-center py-6">
            <HiBookOpen className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-3">
              {notes?.status === 'failed'
                ? 'Previous generation failed. Try again.'
                : 'Generate AI-powered study notes from this video transcript.'}
            </p>
            <button onClick={handleGenerate}
              className="px-4 py-2 bg-primary-500 text-white text-sm rounded-xl hover:bg-primary-400 transition-all">
              <HiSparkles className="w-4 h-4 inline mr-1.5" />
              Generate Notes
            </button>
          </div>
        )}

        {generating && notes?.status === 'generating' && (
          <div className="text-center py-6">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">Generating your notes...</p>
            <p className="text-xs text-gray-500 mt-1">Analyzing transcript with AI</p>
          </div>
        )}

        {hasContent && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {sections.filter(s => s.count > 0).map(s => (
              <TabButton key={s.key} active={activeTab === s.key} icon={s.icon}
                label={`${s.label} (${s.count})`} onClick={() => setActiveTab(s.key)} />
            ))}
            <TabButton active={activeTab === 'custom'} icon={HiPencil} label="Custom"
              onClick={() => setActiveTab('custom')} />
          </div>
        )}

        {!notes && !generating && (
          <p className="text-xs text-gray-500 text-center py-2">
            A transcript is required. Generate a summary first.
          </p>
        )}
      </div>

      {hasContent && (
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {sections.map(s => {
                    if (!s.count) return null;
                    const isExpanded = expandedSections[s.key];
                    return (
                      <div key={s.key} className="glass-panel rounded-xl border border-white/5">
                        <button onClick={() => toggleSection(s.key)}
                          className="w-full flex items-center justify-between p-3 text-left">
                          <div className="flex items-center gap-2">
                            <s.icon className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-medium text-white">{s.label}</span>
                            <span className="text-[10px] text-gray-500">({s.count})</span>
                          </div>
                          {isExpanded ? <HiChevronUp className="w-4 h-4 text-gray-400" /> : <HiChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="px-3 pb-3 space-y-2">
                                {s.key === 'chapters' && s.data?.map((ch, i) => (
                                  <div key={i} className="text-xs">
                                    <button onClick={() => onSeek?.(ch.startTime)}
                                      className="text-primary-400 hover:text-primary-300 font-medium">
                                      {ch.startTime != null
                                        ? `${Math.floor(ch.startTime / 60)}:${String(ch.startTime % 60).padStart(2, '0')}`
                                        : ''} {ch.title}
                                    </button>
                                    <p className="text-gray-400 mt-0.5">{ch.summary}</p>
                                  </div>
                                ))}
                                {s.key === 'keyConcepts' && s.data?.map((c, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                      c.importance === 'critical' ? 'bg-red-400' :
                                      c.importance === 'high' ? 'bg-primary-400' :
                                      c.importance === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                                    }`} />
                                    <div>
                                      <span className="font-medium text-white">{c.concept}</span>
                                      <p className="text-gray-400">{c.explanation}</p>
                                    </div>
                                  </div>
                                ))}
                                {(s.key === 'codeSnippets' || s.key === 'formulas') && s.data?.map((item, i) => (
                                  <div key={i} className="text-xs">
                                    <pre className="bg-dark-900 rounded-lg p-3 overflow-x-auto text-gray-300 font-mono text-[11px] leading-relaxed border border-white/5">
                                      <code>{item.code || item.formula}</code>
                                    </pre>
                                    {item.explanation && <p className="text-gray-400 mt-1">{item.explanation}</p>}
                                  </div>
                                ))}
                                {(s.key === 'flashcards' || s.key === 'quizQuestions' || s.key === 'interviewQuestions') && (
                                  <p className="text-xs text-gray-500">Switch to the {s.label} tab to interact.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'chapters' && (
                <div className="space-y-2">
                  {notes.chapters?.map((ch, i) => (
                    <div key={i} className="glass-panel rounded-xl p-3 border border-white/5">
                      <button onClick={() => onSeek?.(ch.startTime)}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                        {ch.startTime != null
                          ? `${Math.floor(ch.startTime / 60)}:${String(ch.startTime % 60).padStart(2, '0')}`
                          : `Chapter ${i + 1}`} - {ch.title}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'keyConcepts' && (
                <div className="space-y-2">
                  {notes.keyConcepts?.map((c, i) => (
                    <div key={i} className="glass-panel rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          c.importance === 'critical' ? 'bg-red-400' :
                          c.importance === 'high' ? 'bg-primary-400' :
                          c.importance === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm font-medium text-white">{c.concept}</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-4">{c.explanation}</p>
                      {c.relatedConcepts?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 ml-4">
                          {c.relatedConcepts.map((rc, j) => (
                            <span key={j} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                              {rc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'codeSnippets' && (
                <div className="space-y-3">
                  {notes.codeSnippets?.map((s, i) => (
                    <div key={i} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                      {s.context && (
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{s.context}</p>
                        </div>
                      )}
                      <div className="relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { navigator.clipboard.writeText(s.code); toast.success('Copied!'); }}
                            className="text-[10px] bg-dark-800 text-gray-400 px-2 py-1 rounded hover:text-white transition-colors">
                            Copy
                          </button>
                        </div>
                        <pre className="bg-dark-900 p-3 overflow-x-auto text-[11px] font-mono leading-relaxed border-t border-white/5">
                          <code className="text-gray-300">{s.code}</code>
                        </pre>
                      </div>
                      {s.explanation && (
                        <div className="px-3 pb-3 pt-1">
                          <p className="text-xs text-gray-400">{s.explanation}</p>
                        </div>
                      )}
                      {s.language && (
                        <div className="px-3 pb-2">
                          <span className="text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full">
                            {s.language}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-3">
                  {notes.formulas?.map((f, i) => (
                    <div key={i} className="glass-panel rounded-xl p-3 border border-white/5">
                      <pre className="bg-dark-900 rounded-lg p-3 text-center text-sm font-mono text-primary-300 border border-white/5 mb-2">
                        {f.formula}
                      </pre>
                      <p className="text-xs text-gray-300 font-medium">{f.description}</p>
                      {f.variables && <p className="text-xs text-gray-500 mt-1">Variables: {f.variables}</p>}
                      {f.context && <p className="text-[10px] text-gray-500 mt-1 italic">Context: {f.context}</p>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'flashcards' && (
                <FlashcardDeck cards={notes.flashcards || []} notesId={notes._id} onRefresh={loadNotes} />
              )}

              {activeTab === 'quizQuestions' && (
                <QuizViewer questions={notes.quizQuestions || []} />
              )}

              {activeTab === 'interviewQuestions' && (
                <InterviewQuestions questions={notes.interviewQuestions || []} />
              )}

              {activeTab === 'custom' && (
                <div>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Add your own notes, observations, or study material here..."
                    className="w-full h-48 bg-dark-900 text-sm text-gray-300 p-3 rounded-xl border border-white/5 resize-y focus:outline-none focus:border-primary-500/30 placeholder-gray-600"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleSaveCustom} disabled={savingCustom}
                      className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-all disabled:opacity-50">
                      {savingCustom ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {notes?.status === 'failed' && (
        <div className="p-4 text-center">
          <p className="text-xs text-red-400 mb-2">{notes.error || 'Generation failed'}</p>
          <button onClick={handleGenerate} className="text-xs text-primary-400 hover:text-primary-300">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;

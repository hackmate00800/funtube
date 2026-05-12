import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notesAPI } from '../services/api';
import {
  HiBookOpen, HiSparkles, HiTrash, HiDownload, HiSearch,
  HiChevronLeft, HiChevronRight, HiClock, HiAcademicCap,
  HiClipboardList, HiBadgeCheck, HiCollection, HiCode,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const NotesDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notesAPI.listNotes({ page, limit: 20, search });
      setNotes(data.data || []);
      setPagination(data.pagination);
    } catch {} finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    const timer = setTimeout(() => { if (search) { setPage(1); loadNotes(); } }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete these notes?')) return;
    try {
      await notesAPI.delete(id);
      toast.success('Notes deleted');
      loadNotes();
    } catch { toast.error('Delete failed'); }
  };

  const handleExport = async (id, title) => {
    try {
      const response = await notesAPI.exportMarkdown(id);
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${(title || 'untitled').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch { toast.error('Export failed'); }
  };

  const getContentCount = (n) => {
    const counts = [];
    if (n.chapters?.length) counts.push({ icon: HiCollection, count: n.chapters.length, label: 'chapters' });
    if (n.keyConcepts?.length) counts.push({ icon: HiSparkles, count: n.keyConcepts.length, label: 'concepts' });
    if (n.flashcards?.length) counts.push({ icon: HiAcademicCap, count: n.flashcards.length, label: 'cards' });
    if (n.quizQuestions?.length) counts.push({ icon: HiClipboardList, count: n.quizQuestions.length, label: 'quiz' });
    if (n.interviewQuestions?.length) counts.push({ icon: HiBadgeCheck, count: n.interviewQuestions.length, label: 'interview' });
    if (n.codeSnippets?.length) counts.push({ icon: HiCode, count: n.codeSnippets.length, label: 'code' });
    return counts;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <HiBookOpen className="w-4 h-4 text-white" />
            </span>
            My Notes
          </h1>
          <p className="text-sm text-gray-400 mt-1">All your AI-generated study notes in one place</p>
        </div>
        <div className="relative w-full sm:w-64">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-white/5 text-sm text-gray-300 pl-9 pr-4 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-primary-500/30 placeholder-gray-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <HiBookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-300 mb-2">No notes yet</h2>
          <p className="text-sm text-gray-500 mb-4">Generate AI notes from any video to see them here</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm rounded-xl hover:bg-primary-400 transition-all">
            <HiSparkles className="w-4 h-4" />
            Browse Videos
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel-strong rounded-2xl p-5 border border-white/5 hover:border-primary-500/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${n.video?._id || n.video}`}
                      className="text-sm font-semibold text-white hover:text-primary-400 transition-colors line-clamp-2">
                      {n.videoTitle || 'Untitled Video'}
                    </Link>
                    {n.channelName && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{n.channelName}</p>
                    )}
                  </div>
                  {n.thumbnail && (
                    <img src={n.thumbnail} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0 ml-3" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {getContentCount(n).map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] bg-primary-500/5 text-gray-400 px-2 py-0.5 rounded-full">
                      <item.icon className="w-2.5 h-2.5" />
                      {item.count} {item.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-500">
                    <HiClock className="w-3 h-3 inline mr-1" />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleExport(n._id, n.videoTitle)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      title="Export Markdown">
                      <HiDownload className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {
                      if (n.video?._id) window.location.href = `/watch/${n.video._id}`;
                      else window.location.href = `/watch/${n.video}`;
                    }}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-all"
                      title="View on video">
                      <HiBookOpen className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(n._id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete">
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-all">
                <HiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${
                    p === page ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-white/5'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-all">
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default NotesDashboard;

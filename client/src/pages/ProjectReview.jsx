import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiCode, HiUpload, HiTrash, HiStar, HiChartBar,
  HiLightBulb,
  HiDocumentText, HiArrowRight,
} from 'react-icons/hi';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const techOptions = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS', 'Next.js', 'Vue.js'];

function ProjectReview() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'web', techStack: [], repoUrl: '', liveUrl: '' });
  const [techInput, setTechInput] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/project-review');
      setProjects(data.data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/project-review', form);
      setProjects(prev => [data.data, ...prev]);
      setShowSubmit(false);
      setForm({ title: '', description: '', type: 'web', techStack: [], repoUrl: '', liveUrl: '' });
    } catch (err) {
      console.error('Failed to submit project:', err);
    }
  };

  const handleReview = async (id) => {
    try {
      const { data } = await api.post(`/project-review/${id}/review`);
      setProjects(prev => prev.map(p => p._id === id ? data.data : p));
      setSelected(data.data);
    } catch (err) {
      console.error('Failed to review:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/project-review/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const addTech = (tech) => {
    if (!form.techStack.includes(tech)) {
      setForm(f => ({ ...f, techStack: [...f.techStack, tech] }));
    }
    setTechInput('');
  };

  const removeTech = (tech) => {
    setForm(f => ({ ...f, techStack: f.techStack.filter(t => t !== tech) }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Project Reviewer</h1>
          <p className="text-gray-400 mt-1">Submit your projects for AI-powered code review and feedback</p>
        </div>
        <button onClick={() => setShowSubmit(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium hover:opacity-90 transition-all">
          <HiUpload /> Submit Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><HiCode /> My Projects ({projects.length})</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse bg-white/5 rounded-xl" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <HiDocumentText className="text-3xl text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No projects submitted yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(p => (
                  <button
                    key={p._id}
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selected?._id === p._id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.review?.score != null && (
                        <span className="text-xs text-primary-400">{p.review.score}/100</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.status === 'reviewed' ? 'bg-green-500/10 text-green-400' :
                        p.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>{p.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selected.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.techStack?.map(t => <span key={t} className="px-2 py-0.5 rounded-lg bg-primary-500/10 text-primary-400 text-xs">{t}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === 'submitted' && (
                    <Button size="sm" variant="gradient" onClick={() => handleReview(selected._id)}><HiStar /> Review</Button>
                  )}
                  <button onClick={() => handleDelete(selected._id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><HiTrash /></button>
                </div>
              </div>

              {selected.review ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><HiChartBar /> Review Results</h3>
                    <div className="text-3xl font-bold gradient-text">{selected.review.score}/100</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'uiRating', label: 'UI Design' },
                      { key: 'codeQuality', label: 'Code Quality' },
                      { key: 'architecture', label: 'Architecture' },
                      { key: 'performance', label: 'Performance' },
                      { key: 'responsiveness', label: 'Responsiveness' },
                    ].map(cat => (
                      <div key={cat.key} className="p-3 rounded-xl bg-white/5">
                        <p className="text-xs text-gray-500">{cat.label}</p>
                        <p className="text-lg font-bold mt-1" style={{
                          color: (selected.review[cat.key] || 0) >= 8 ? '#4ade80' :
                                 (selected.review[cat.key] || 0) >= 5 ? '#fbbf24' : '#f87171'
                        }}>{selected.review[cat.key] || 'N/A'}/10</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-300">{selected.review.feedback}</p>
                  </div>
                  {selected.review.suggestions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-1"><HiLightBulb /> Suggestions</h4>
                      <div className="space-y-1.5">
                        {selected.review.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <HiArrowRight className="text-xs mt-1 text-yellow-500" /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <HiChartBar className="text-5xl text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">Click "Review" to get AI-powered feedback on this project</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 text-center py-20">
              <HiCode className="text-5xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Select a project or submit a new one for AI review</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Project" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Project Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="My Awesome Project" required />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your project..." className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full glass-panel px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                <option value="web">Web App</option>
                <option value="mobile">Mobile App</option>
                <option value="api">API</option>
                <option value="cli">CLI Tool</option>
                <option value="library">Library</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">GitHub URL</label>
              <Input value={form.repoUrl} onChange={(e) => setForm(f => ({ ...f, repoUrl: e.target.value }))} placeholder="https://github.com/..." />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tech Stack</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.techStack.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-500/10 text-primary-400 text-xs">
                  {t} <button type="button" onClick={() => removeTech(t)} className="hover:text-red-400">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech(techInput))} placeholder="Type tech and press Enter" className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {techOptions.filter(t => !form.techStack.includes(t)).map(t => (
                <button key={t} type="button" onClick={() => addTech(t)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 hover:text-white transition-all">{t}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
            <Button type="submit" variant="gradient"><HiUpload /> Submit for Review</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default ProjectReview;

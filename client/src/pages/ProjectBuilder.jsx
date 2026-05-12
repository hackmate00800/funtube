import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiLightBulb, HiCode, HiCollection,
  HiRefresh, HiCheckCircle,
  HiFolderOpen, HiDocumentText, HiTerminal,
} from 'react-icons/hi';
import api from '../services/api';
import Button from '../components/ui/Button';

function ProjectBuilder() {
  const [ideas, setIdeas] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [structure, setStructure] = useState(null);
  const [boilerplate, setBoilerplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [activeTab, setActiveTab] = useState('ideas');
  const [techStack] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoadingIdea(true);
      const { data } = await api.get('/project-builder/ideas');
      setIdeas(data.data);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setLoadingIdea(false);
    }
  };

  const handleSelectIdea = async (idea) => {
    setSelectedIdea(idea);
    setStructure(null);
    setBoilerplate(null);
    setActiveTab('structure');
    try {
      setLoading(true);
      const { data } = await api.post('/project-builder/structure', {
        idea: idea.title,
        techStack: idea.techStack || techStack.split(',').map(s => s.trim()),
      });
      setStructure(data.data);
    } catch (err) {
      console.error('Failed to generate structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBoilerplate = async () => {
    if (!structure) return;
    try {
      setLoading(true);
      const { data } = await api.post('/project-builder/boilerplate', { projectStructure: structure });
      setBoilerplate(data.data);
      setActiveTab('boilerplate');
    } catch (err) {
      console.error('Failed to generate boilerplate:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Project Builder</h1>
          <p className="text-gray-400 mt-1">Generate project ideas, structures, and starter templates based on your skills</p>
        </div>
        <button onClick={fetchIdeas} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-sm hover:border-primary-500/30 transition-all">
          <HiRefresh className={loadingIdea ? 'animate-spin' : ''} /> Refresh Ideas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <HiLightBulb className="text-primary-400" />
              <h3 className="font-semibold">AI-Generated Ideas</h3>
            </div>
            {loadingIdea ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-white/5 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {ideas?.ideas?.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectIdea(idea)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedIdea?.title === idea.title
                        ? 'bg-primary-500/10 border border-primary-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium text-white mb-1">{idea.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{idea.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        idea.difficulty === 'advanced' ? 'bg-red-500/10 text-red-400' :
                        idea.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>{idea.difficulty}</span>
                      <span className="text-[10px] text-gray-500">{idea.estimatedHours}h</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/5">
              {[
                { id: 'ideas', label: 'Ideas', icon: HiLightBulb },
                { id: 'structure', label: 'Structure', icon: HiFolderOpen },
                { id: 'boilerplate', label: 'Boilerplate', icon: HiCode },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${
                    activeTab === tab.id
                      ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon /> {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'ideas' && (
                  <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-gray-400 text-sm mb-4">Select a project idea from the left panel to see its structure and generate starter code.</p>
                    <div className="p-8 text-center">
                      <HiLightBulb className="text-5xl text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">Choose an idea to get started</p>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'structure' && (
                  <motion.div key="structure" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 animate-pulse bg-white/5 rounded" />)}
                      </div>
                    ) : structure ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{structure.projectName}</h3>
                          <p className="text-sm text-gray-400">{structure.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1"><HiCollection /> Architecture</h4>
                          <p className="text-sm text-gray-400">{structure.architecture}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1"><HiFolderOpen /> Folders</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {structure.folders?.map((f, i) => (
                              <div key={i} className="p-2 rounded-lg bg-white/5 text-sm">
                                <p className="text-primary-400 font-mono text-xs">{f.path}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{f.purpose}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1"><HiDocumentText /> Key Files</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {structure.files?.slice(0, 8).map((f, i) => (
                              <div key={i} className="p-2 rounded-lg bg-white/5 text-xs text-gray-400 font-mono">{f.path}</div>
                            ))}
                          </div>
                        </div>
                        {structure.dependencies?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Dependencies</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {structure.dependencies.map((d, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-lg bg-primary-500/10 text-primary-400 text-xs">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2"><HiTerminal /> Setup</h4>
                          <pre className="p-3 rounded-xl bg-black/30 text-xs text-gray-300 font-mono whitespace-pre-wrap">{structure.setup}</pre>
                        </div>
                        <Button onClick={handleGenerateBoilerplate} loading={loading} variant="gradient" className="w-full">
                          <HiCode /> Generate Starter Code
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Select a project idea first</p>
                    )}
                  </motion.div>
                )}
                {activeTab === 'boilerplate' && (
                  <motion.div key="boilerplate" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse bg-white/5 rounded-xl" />)}
                      </div>
                    ) : boilerplate ? (
                      <div className="space-y-4">
                        <p className="text-sm text-green-400 flex items-center gap-1"><HiCheckCircle /> Boilerplate generated!</p>
                        {boilerplate.setupInstructions && (
                          <pre className="p-3 rounded-xl bg-black/30 text-xs text-gray-300 font-mono whitespace-pre-wrap">{boilerplate.setupInstructions}</pre>
                        )}
                        <div className="space-y-2">
                          {boilerplate.files?.map((file, i) => (
                            <details key={i} className="rounded-xl bg-white/5 overflow-hidden">
                              <summary className="px-4 py-2 text-sm text-primary-400 cursor-pointer hover:bg-white/5 font-mono">
                                {file.path}
                              </summary>
                              <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-60 bg-black/20">{file.content}</pre>
                            </details>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Generate a project structure first</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectBuilder;

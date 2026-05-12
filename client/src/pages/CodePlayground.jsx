import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCode, HiFolderOpen, HiX, HiDocument, HiTrash,
  HiChevronRight, HiChevronDown, HiLightningBolt,
  HiClock, HiCheckCircle, HiAcademicCap,
} from 'react-icons/hi';
import api from '../services/api';
import PlaygroundEditor from '../components/playground/PlaygroundEditor';
import PlaygroundTerminal from '../components/playground/PlaygroundTerminal';
import PlaygroundToolbar from '../components/playground/PlaygroundToolbar';
import AiAssistant from '../components/playground/AiAssistant';

const LANG_EXT = {
  javascript: 'js', python: 'py', java: 'java', cpp: 'cpp',
  c: 'c', csharp: 'cs', typescript: 'ts', go: 'go',
  rust: 'rs', php: 'php', kotlin: 'kt',
};

const STARTER_CODES = {
  javascript: '// FunTube Code Playground\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("Developer"));',
  python: '# FunTube Code Playground\ndef greet(name):\n    return f"Hello, {name}!"\nprint(greet("Developer"))',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Developer!");\n  }\n}',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, Developer!" << endl;\n  return 0;\n}',
  c: '#include <stdio.h>\nint main() {\n  printf("Hello, Developer!\\n");\n  return 0;\n}',
  csharp: 'using System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, Developer!");\n  }\n}',
  typescript: 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("Developer"));',
  go: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, Developer!")\n}',
  rust: 'fn main() {\n  println!("Hello, Developer!");\n}',
  php: '<?php\necho "Hello, Developer!\\n";',
  kotlin: 'fun main() {\n  println("Hello, Developer!")\n}',
};

function CodePlayground() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTER_CODES.javascript);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [splitMode, setSplitMode] = useState(false);
  const [files, setFiles] = useState([{ name: 'main.js', content: STARTER_CODES.javascript, language: 'javascript' }]);
  const [activeFile, setActiveFile] = useState(0);
  const [aiPanel, setAiPanel] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const newExt = LANG_EXT[language] || 'js';
    setFiles(prev => {
      const updated = [...prev];
      updated[activeFile] = { ...updated[activeFile], name: `main.${newExt}`, language };
      return updated;
    });
    setCode(STARTER_CODES[language] || '// Start coding\n');
  }, [language]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    try {
      const { data } = await api.post('/code-playground/execute', { code, language, stdin });
      setOutput(data.data);
    } catch (err) {
      setOutput({ stdout: '', stderr: err.response?.data?.error || err.message, status: 'Error', exitCode: 1 });
    } finally {
      setRunning(false);
    }
  }, [code, language, stdin]);

  const loadProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/code-playground/projects');
      setProjects(data.data || []);
    } catch {}
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const payload = {
        title: projectTitle,
        language,
        files: [{ name: `main.${LANG_EXT[language] || 'js'}`, content: code, language }],
      };
      const { data } = await api.post(`/code-playground/projects${currentProjectId ? `/${currentProjectId}` : ''}`, payload);
      setCurrentProjectId(data.data._id);
      loadProjects();
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [code, language, projectTitle, currentProjectId, loadProjects]);

  const handleLoadProject = useCallback(async (project) => {
    try {
      const { data } = await api.get(`/code-playground/projects/${project._id}`);
      const p = data.data;
      setCurrentProjectId(p._id);
      setProjectTitle(p.title);
      setLanguage(p.language);
      if (p.files?.length) {
        setFiles(p.files);
        setActiveFile(0);
        setCode(p.files[0].content);
      }
      setShowProjects(false);
    } catch (err) {
      console.error('Load failed:', err);
    }
  }, []);

  const handleNew = useCallback(() => {
    setCode(STARTER_CODES[language] || '');
    setOutput(null);
    setStdin('');
    setCurrentProjectId(null);
    setProjectTitle('Untitled Project');
    setFiles([{ name: `main.${LANG_EXT[language] || 'js'}`, content: STARTER_CODES[language] || '', language }]);
  }, [language]);

  const handleDeleteProject = useCallback(async (id) => {
    try {
      await api.delete(`/code-playground/projects/${id}`);
      loadProjects();
    } catch {}
  }, [loadProjects]);

  const handleSnippet = useCallback((snippet) => {
    if (snippet[language]) {
      setCode(snippet[language]);
    }
  }, [language]);

  const loadChallenges = useCallback(async () => {
    try {
      const { data } = await api.get('/code-playground/challenges');
      setChallenges(data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadProjects();
    loadChallenges();
  }, [loadProjects, loadChallenges]);

  const diffColors = {
    easy: 'bg-green-500/10 text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    hard: 'bg-red-500/10 text-red-400',
    expert: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <PlaygroundToolbar
          language={language}
          onLanguageChange={setLanguage}
          onRun={handleRun}
          running={running}
          onSave={handleSave}
          onLoad={() => { loadProjects(); setShowProjects(true); }}
          onNew={handleNew}
          onSnippet={handleSnippet}
          projectTitle={projectTitle}
          onTitleChange={setProjectTitle}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <PlaygroundEditor
              code={code}
              onChange={setCode}
              language={language}
              editorRef={editorRef}
            />
          </div>

          <div className="h-48 border-t border-white/5 flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/5 bg-dark-900/50">
              <div className="flex items-center gap-3">
                {['Terminal', 'Input', 'AI'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'AI') setAiPanel(!aiPanel);
                    }}
                    className={`text-[11px] py-1 px-1 border-b-2 transition-all ${
                      (tab === 'AI' && aiPanel) || (tab === 'Terminal' && !aiPanel) ? 'text-primary-400 border-primary-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="bg-white/5 text-xs text-gray-300 rounded px-2 py-1 w-32 border border-white/5 focus:border-primary-500/30 focus:outline-none"
                  placeholder="stdin..."
                />
              </div>
            </div>
            <div className="h-[calc(100%-32px)]">
              {aiPanel ? (
                <AiAssistant code={code} language={language} />
              ) : (
                <PlaygroundTerminal output={output} running={running} />
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProjects && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProjects(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-strong rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden shadow-glass-xl border border-white/10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><HiFolderOpen /> Saved Projects</h2>
                <button onClick={() => setShowProjects(false)} className="p-1 hover:bg-white/5 rounded-lg"><HiX className="text-gray-400" /></button>
              </div>
              <div className="p-3 space-y-1 overflow-y-auto max-h-[50vh]">
                {projects.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No saved projects yet. Write some code and save it!</p>
                ) : projects.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <button onClick={() => handleLoadProject(p)} className="flex items-center gap-3 flex-1 text-left">
                      <HiDocument className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-200">{p.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {p.language} &middot; {new Date(p.lastEdited).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteProject(p._id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <HiTrash className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChallenges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChallenges(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-strong rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden shadow-glass-xl border border-white/10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><HiAcademicCap /> Coding Challenges</h2>
                <button onClick={() => setShowChallenges(false)} className="p-1 hover:bg-white/5 rounded-lg"><HiX className="text-gray-400" /></button>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto max-h-[50vh]">
                {challenges.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No challenges available yet.</p>
                ) : challenges.map(c => (
                  <div key={c._id} className="p-3 rounded-xl glass-panel hover:border-primary-500/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-200 group-hover:text-primary-400 transition-colors">{c.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${diffColors[c.difficulty] || 'bg-gray-500/10 text-gray-400'}`}>
                        {c.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1"><HiClock /> {c.testCases?.length || 0} tests</span>
                      <span className="flex items-center gap-1"><HiCheckCircle /> {c.points || 0} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CodePlayground;

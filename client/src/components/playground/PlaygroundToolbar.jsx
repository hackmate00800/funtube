import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlay, HiSave, HiFolderOpen, HiTrash, HiCode,
  HiBookOpen, HiRefresh, HiPlus, HiChevronDown,
  HiDotsVertical, HiShare, HiUserGroup,
} from 'react-icons/hi';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚙️' },
  { id: 'c', label: 'C', icon: '🔧' },
  { id: 'csharp', label: 'C#', icon: '💠' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'go', label: 'Go', icon: '🔵' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'php', label: 'PHP', icon: '🐘' },
  { id: 'kotlin', label: 'Kotlin', icon: '🟣' },
];

const SNIPPETS = {
  'Hello World': { javascript: 'console.log("Hello, World!");', python: 'print("Hello, World!")', typescript: 'console.log("Hello, World!");' },
  'Factorial': { javascript: 'const fact = n => n <= 1 ? 1 : n * fact(n - 1);\nconsole.log(fact(5));', python: 'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\nprint(fact(5))' },
  'Fibonacci': { javascript: 'const fib = n => n <= 1 ? n : fib(n - 1) + fib(n - 2);\nconsole.log(fib(10));', python: 'def fib(n):\n    return n if n <= 1 else fib(n - 1) + fib(n - 2)\nprint(fib(10))' },
  'Array Sort': { javascript: 'const arr = [3, 1, 4, 1, 5, 9, 2, 6];\nconsole.log(arr.sort((a,b) => a - b));', python: 'arr = [3, 1, 4, 1, 5, 9, 2, 6]\nprint(sorted(arr))' },
};

function PlaygroundToolbar({
  language, onLanguageChange, onRun, running,
  onSave, onLoad, onNew, onShare,
  onSnippet, projectTitle, onTitleChange,
}) {
  const [showSnippets, setShowSnippets] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave?.();
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <input
          value={projectTitle}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="bg-transparent text-sm font-medium text-white border-b border-transparent hover:border-white/20 focus:border-primary-500/50 focus:outline-none px-1 py-0.5 w-40 transition-all"
          placeholder="Project name..."
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all"
          >
            <HiBookOpen /> Snippets <HiChevronDown className="text-[10px]" />
          </button>
          <AnimatePresence>
            {showSnippets && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-10 w-44 glass-panel-strong rounded-xl p-1.5 z-50 shadow-glass-xl"
              >
                {Object.keys(SNIPPETS).map(name => (
                  <button
                    key={name}
                    onClick={() => { onSnippet?.(SNIPPETS[name]); setShowSnippets(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    {name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all"
          >
            {LANGUAGES.find(l => l.id === language)?.icon} {LANGUAGES.find(l => l.id === language)?.label || language}
            <HiChevronDown className="text-[10px]" />
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-10 w-44 glass-panel-strong rounded-xl p-1.5 z-50 shadow-glass-xl max-h-60 overflow-y-auto"
              >
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onLanguageChange(l.id); setShowLang(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                      language === l.id ? 'bg-primary-500/10 text-primary-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l.icon} {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-white/5 mx-1" />

        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all">
          <HiSave className={saving ? 'animate-pulse' : ''} /> {saving ? 'Saved' : 'Save'}
        </button>
        <button onClick={onLoad} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all">
          <HiFolderOpen /> Load
        </button>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all">
          <HiPlus /> New
        </button>

        <div className="w-px h-5 bg-white/5 mx-1" />

        <button
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {running ? <HiRefresh className="animate-spin" /> : <HiPlay />}
          {running ? 'Running' : 'Run'}
        </button>

        {onShare && (
          <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs hover:border-primary-500/30 transition-all">
            <HiUserGroup /> Share
          </button>
        )}
      </div>
    </div>
  );
}

export default PlaygroundToolbar;

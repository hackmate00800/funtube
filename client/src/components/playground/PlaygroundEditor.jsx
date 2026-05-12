import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';

const THEME = {
  base: 'vs-dark',
  bg: '#0d1117',
  gutter: '#161b22',
  line: '#8b949e',
  selection: '#264f78',
  keyword: '#ff7b72',
  string: '#a5d6ff',
  number: '#79c0ff',
  comment: '#8b949e',
  function: '#d2a8ff',
  variable: '#ffa657',
};

const LANG_MAP = {
  javascript: 'javascript', python: 'python', java: 'java',
  cpp: 'cpp', c: 'c', csharp: 'csharp',
  typescript: 'typescript', go: 'go', rust: 'rust',
  php: 'php', kotlin: 'kotlin',
};

function PlaygroundEditor({ code, onChange, language, readOnly, editorRef }) {
  const monacoRef = useRef(null);

  const handleMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco;
    if (editorRef) editorRef.current = editor;

    monaco.editor.defineTheme('funtime', {
      base: THEME.base,
      inherit: true,
      rules: [
        { token: 'keyword', foreground: THEME.keyword.replace('#', '') },
        { token: 'string', foreground: THEME.string.replace('#', '') },
        { token: 'number', foreground: THEME.number.replace('#', '') },
        { token: 'comment', foreground: THEME.comment.replace('#', '') },
        { token: 'type.identifier', foreground: THEME.function.replace('#', '') },
      ],
      colors: {
        'editor.background': THEME.bg,
        'editor.lineHighlightBackground': '#1c2128',
        'editor.selectionBackground': THEME.selection,
        'editorLineNumber.foreground': THEME.line,
        'editorGutter.background': THEME.gutter,
        'editorCursor.foreground': '#c9d1d9',
        'editorBracketMatch.background': '#2ea043',
        'editorBracketMatch.border': '#2ea04344',
      },
    });
    monaco.editor.setTheme('funtime');
  }, [editorRef]);

  return (
    <Editor
      height="100%"
      language={LANG_MAP[language] || 'javascript'}
      value={code}
      onChange={onChange}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
        minimap: { enabled: true, scale: 1 },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'off',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 16, bottom: 16 },
        readOnly: readOnly || false,
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        folding: true,
        foldingHighlight: true,
        guides: { indentation: true, bracketPairs: true },
        matchBrackets: 'always',
        selectionHighlight: true,
        occurrencesHighlight: 'singleFile',
        renderWhitespace: 'selection',
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
    />
  );
}

export default PlaygroundEditor;

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiTerminal, HiClipboard, HiClipboardCheck, HiTrash, HiInformationCircle } from 'react-icons/hi';

function PlaygroundTerminal({ output, running }) {
  const terminalRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleCopy = () => {
    if (!output) return;
    const text = [output.stdout, output.stderr, output.compile_output].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-dark-900/50">
        <div className="flex items-center gap-2">
          <HiTerminal className="text-gray-500 text-sm" />
          <span className="text-xs text-gray-500 font-medium">Terminal</span>
          {running && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {output && !output.mock && (
            <button onClick={handleCopy} className="text-xs text-gray-500 hover:text-white transition-all flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5">
              {copied ? <><HiClipboardCheck /> Copied</> : <><HiClipboard /> Copy</>}
            </button>
          )}
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-[#0d1117]">
        {!output && !running && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-16">
            <HiTerminal className="text-3xl mb-2" />
            <p className="text-xs">Run your code to see output here</p>
          </div>
        )}

        {running && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-xs">Compiling...</span>
            </div>
            <div className="text-gray-600 text-xs">$ executing {new Date().toLocaleTimeString()}</div>
          </div>
        )}

        {output && (
          <div className="space-y-3">
            {output.stdout && (
              <div>
                <div className="flex items-center gap-1.5 text-green-400 text-[10px] mb-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  stdout
                </div>
                <pre className="text-gray-200 whitespace-pre-wrap leading-relaxed text-xs pl-3 border-l-2 border-green-500/30">
                  {output.stdout}
                </pre>
              </div>
            )}

            {output.stderr && (
              <div>
                <div className="flex items-center gap-1.5 text-red-400 text-[10px] mb-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  stderr
                </div>
                <pre className="text-red-300 whitespace-pre-wrap leading-relaxed text-xs pl-3 border-l-2 border-red-500/30">
                  {output.stderr}
                </pre>
              </div>
            )}

            {output.compile_output && (
              <div>
                <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] mb-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  compile output
                </div>
                <pre className="text-yellow-300 whitespace-pre-wrap leading-relaxed text-xs pl-3 border-l-2 border-yellow-500/30">
                  {output.compile_output}
                </pre>
              </div>
            )}

            {output.mock && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/5 rounded-lg px-3 py-2 border border-yellow-500/10">
                <HiInformationCircle />
                Running in offline mode (mock execution)
              </div>
            )}

            <div className="flex items-center gap-3 text-[10px] text-gray-600 pt-2 border-t border-white/5 mt-2">
              <span className={`px-1.5 py-0.5 rounded ${
                output.status === 'Accepted' || output.status?.includes('Finished') ? 'bg-green-500/10 text-green-400' :
                output.status === 'Error' || output.status?.includes('Failed') ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {output.status}
              </span>
              {output.time != null && <span>Time: {output.time}s</span>}
              {output.memory != null && <span>Memory: {(output.memory / 1024).toFixed(1)} MB</span>}
              {output.exitCode != null && <span>Exit: {output.exitCode}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaygroundTerminal;

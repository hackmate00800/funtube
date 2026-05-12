import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HiAcademicCap, HiTrendingUp } from 'react-icons/hi';

const strengthColors = {
  weak: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', size: 40 },
  learning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', size: 56 },
  strong: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', size: 72 },
  mastered: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', size: 88 },
};

function KnowledgeGraph({ nodes = [], edges = [] }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const layout = useMemo(() => {
    const centerX = 300;
    const centerY = 250;
    const radius = 180;
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodes]);

  const getConnected = (nodeId) => {
    return edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => e.source === nodeId ? e.target : e.source);
  };

  if (!nodes.length) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <HiAcademicCap className="text-5xl text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No knowledge graph data yet. Keep learning to build your graph!</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <HiTrendingUp /> Knowledge Graph
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {['weak', 'learning', 'strong', 'mastered'].map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${strengthColors[s]?.bg || 'bg-gray-500/20'}`} />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="relative w-full max-w-[600px] mx-auto" style={{ height: 500 }}>
        <svg width="100%" height="100%" viewBox="0 0 600 500" className="absolute inset-0">
          {layout.map(node => {
            return edges
              .filter(e => e.source === node.id || e.target === node.id)
              .map((edge, i) => {
                const source = layout.find(n => n.id === edge.source);
                const target = layout.find(n => n.id === edge.target);
                if (!source || !target) return null;
                return (
                  <line
                    key={`${edge.source}-${edge.target}-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={1.5}
                    className="transition-all duration-300"
                  />
                );
              });
          })}
        </svg>
        <div className="relative w-full h-full">
          {layout.map((node, i) => {
            const colors = strengthColors[node.strength] || strengthColors.weak;
            const isSelected = selected === node.id;
            const isConnected = hovered && getConnected(hovered).includes(node.id);
            const dim = hovered && hovered !== node.id && !isConnected;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: dim ? 0.3 : 1, scale: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
                style={{
                  left: node.x - colors.size / 2,
                  top: node.y - colors.size / 2,
                  width: colors.size,
                  height: colors.size,
                }}
                className={`absolute flex items-center justify-center rounded-full cursor-pointer transition-all ${colors.bg} ${colors.border} border-2 ${
                  isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900' : ''
                }`}
                onClick={() => setSelected(selected === node.id ? null : node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={`text-[10px] font-medium text-center leading-tight px-1 ${colors.text}`}>
                  {node.label?.length > 12 ? node.label.slice(0, 10) + '..' : node.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-white/5"
        >
          <p className="text-sm font-medium text-white">{selected}</p>
          {(() => {
            const node = nodes.find(n => n.id === selected);
            return node ? (
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>Confidence: {node.confidence}%</span>
                <span className={`px-1.5 py-0.5 rounded ${strengthColors[node.strength]?.bg}`}>{node.strength}</span>
              </div>
            ) : null;
          })()}
        </motion.div>
      )}
    </div>
  );
}

export default KnowledgeGraph;

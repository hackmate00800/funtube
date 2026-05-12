import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiAcademicCap, HiBriefcase, HiStar,
  HiExclamationCircle, HiLightBulb,
  HiChartBar, HiArrowRight, HiRefresh, HiCode,
  HiUserGroup, HiChip, HiServer, HiColorSwatch,
} from 'react-icons/hi';
import api from '../services/api';
import KnowledgeGraph from '../components/ai/KnowledgeGraph';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const roleIcons = {
  'Frontend Developer': HiCode,
  'Backend Developer': HiServer,
  'Full Stack Developer': HiCode,
  'DevOps Engineer': HiUserGroup,
  'AI/ML Engineer': HiChip,
  'Mobile Developer': HiColorSwatch,
  'Data Scientist': HiChartBar,
};

const TOP_CAREERS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'AI/ML Engineer', 'Mobile Developer', 'Data Scientist',
];

function CareerNavigator() {
  const [dna, setDna] = useState(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dnaRes, graphRes, recsRes] = await Promise.all([
        api.get('/learning-dna'),
        api.get('/learning-dna/knowledge-graph'),
        api.get('/learning-dna/recommendations'),
      ]);
      setDna(dnaRes.data.data);
      setKnowledgeGraph(graphRes.data.data);
      setRecommendations(recsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch learning data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssess = async () => {
    if (!targetRole) return;
    try {
      setAssessing(true);
      const { data } = await api.post('/learning-dna/career-readiness', { targetRole });
      setAssessment(data.data);
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-64" />
          <div className="h-4 bg-white/10 rounded w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 glass-panel rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Career Navigator</h1>
          <p className="text-gray-400 mt-1">Assess your skills and discover career paths</p>
        </div>
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-sm hover:border-primary-500/30 transition-all"
        >
          {showGraph ? 'Hide' : 'Show'} Knowledge Graph
        </button>
      </div>

      {showGraph && knowledgeGraph && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8"
        >
          <KnowledgeGraph nodes={knowledgeGraph.nodes} edges={knowledgeGraph.edges} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500">
              <HiAcademicCap className="text-xl text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Topics Explored</p>
              <p className="text-2xl font-bold">{dna?.nodes?.length || 0}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dna?.strongTopics?.slice(0, 5).map(topic => (
              <span key={topic} className="text-xs px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400">{topic}</span>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <HiChartBar className="text-xl text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Learning Speed</p>
              <p className="text-2xl font-bold">{dna?.learningSpeed || 0}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dna?.learningSpeed || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
              <HiLightBulb className="text-xl text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Weak Areas</p>
              <p className="text-2xl font-bold">{dna?.weakTopics?.length || 0}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dna?.weakTopics?.slice(0, 5).map(topic => (
              <span key={topic} className="text-xs px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400">{topic}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiBriefcase /> Career Readiness Assessment
          </h2>
          <p className="text-sm text-gray-400 mb-4">Select a target role to assess your readiness</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {TOP_CAREERS.map(role => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  targetRole === role
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'glass-panel text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {React.createElement(roleIcons[role] || HiBriefcase, { className: 'text-lg' })}
                {role}
              </button>
            ))}
          </div>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Or type a custom role..."
            className="mb-4"
          />
          <Button onClick={handleAssess} disabled={!targetRole || assessing} className="w-full">
            {assessing ? <><HiRefresh className="animate-spin" /> Assessing...</> : `Assess Readiness`}
          </Button>

          <AnimatePresence>
            {assessment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <span className="text-sm text-gray-400">Readiness Score</span>
                  <span className={`text-2xl font-bold ${
                    assessment.readinessScore >= 70 ? 'text-green-400' :
                    assessment.readinessScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{assessment.readinessScore}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${assessment.readinessScore}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <p className="text-xs text-green-400 mb-1">Strong Areas</p>
                    {assessment.strongAreas?.length > 0 ? (
                      assessment.strongAreas.map(a => <p key={a} className="text-sm">{a}</p>)
                    ) : <p className="text-sm text-gray-500">None yet</p>}
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs text-red-400 mb-1">Weak Areas</p>
                    {assessment.weakAreas?.length > 0 ? (
                      assessment.weakAreas.map(a => <p key={a} className="text-sm">{a}</p>)
                    ) : <p className="text-sm text-gray-500">None</p>}
                  </div>
                </div>
                {assessment.gaps?.length > 0 && (
                  <div>
                    <p className="text-sm text-yellow-400 mb-2 flex items-center gap-1"><HiExclamationCircle /> Gaps to address</p>
                    {assessment.gaps.map((gap, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                        <HiArrowRight className="text-xs text-yellow-500" />
                        {gap}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiStar /> Personalized Recommendations
          </h2>
          {recommendations.length === 0 ? (
            <div className="text-center py-10">
              <HiLightBulb className="text-4xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Keep learning to get personalized recommendations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {rec.type === 'weakness' ? <HiExclamationCircle className="text-red-400 mt-0.5" /> :
                     rec.type === 'focus' ? <HiStar className="text-yellow-400 mt-0.5" /> :
                     rec.type === 'timing' ? <HiChartBar className="text-blue-400 mt-0.5" /> :
                     <HiLightBulb className="text-primary-400 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{rec.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                      {rec.action && (
                        <a href={rec.action} className="text-xs text-primary-400 hover:text-primary-300 mt-1 inline-block">
                          Take action &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default CareerNavigator;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiBookOpen, HiClock, HiStar, HiCheckCircle, HiPlay,
  HiArrowLeft, HiChevronDown, HiAcademicCap,
  HiLightBulb,
} from 'react-icons/hi';
import api from '../services/api';
import Button from '../components/ui/Button';

function LearningPathDetail() {
  const { id } = useParams();
  const [path, setPath] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState(new Set([0]));
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchPath();
    fetchProgress();
  }, [id]);

  const fetchPath = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/learning-paths/${id}`);
      setPath(data.data);
    } catch (err) {
      console.error('Failed to fetch path:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data } = await api.get(`/learning-paths/${id}/progress`);
      setProgress(data.data);
    } catch (err) {
      // Not enrolled
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const { data } = await api.post(`/learning-paths/${id}/enroll`);
      setProgress(data.data);
    } catch (err) {
      console.error('Failed to enroll:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (index) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-64" />
          <div className="h-4 bg-white/10 rounded w-96" />
          <div className="h-48 glass-panel rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <HiBookOpen className="text-6xl text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">Learning path not found</p>
        <Link to="/learning" className="text-primary-400 hover:text-primary-300">Back to Learning Paths</Link>
      </div>
    );
  }

  const totalSteps = path.totalSteps || path.modules?.reduce((s, m) => s + (m.steps?.length || 0), 0) || 0;
  const completedSteps = progress?.completedSteps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto">
      <Link to="/learning" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-all">
        <HiArrowLeft /> Back to Learning Paths
      </Link>

      <div className="glass-panel rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-lg ${
                path.difficulty === 'advanced' ? 'bg-red-500/10 text-red-400' :
                path.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-green-500/10 text-green-400'
              }`}>{path.difficulty}</span>
              <span className="text-xs text-gray-500">{path.category}</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{path.title}</h1>
            <p className="text-gray-400">{path.description}</p>
          </div>
          {!progress && (
            <Button onClick={handleEnroll} loading={enrolling} variant="gradient">
              <HiPlay /> Enroll Now
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1.5"><HiClock /> {path.totalMinutes || '?'} min</span>
          <span className="flex items-center gap-1.5"><HiBookOpen /> {path.modules?.length || 0} modules</span>
          <span className="flex items-center gap-1.5"><HiStar /> {path.enrolledCount || 0} enrolled</span>
          {path.skillsGained?.length > 0 && (
            <span className="flex items-center gap-1.5"><HiAcademicCap /> {path.skillsGained.length} skills</span>
          )}
        </div>

        {progress && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-400 font-medium">{progressPercent}% complete</span>
              <span className="text-gray-500">{completedSteps}/{totalSteps} steps</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <HiAcademicCap className="text-primary-400" />
        <h2 className="text-lg font-semibold">Course Content</h2>
        <span className="text-xs text-gray-500">({path.modules?.length || 0} modules)</span>
      </div>

      <div className="space-y-3">
        {path.modules?.map((module, mIndex) => {
          const isExpanded = expandedModules.has(mIndex);
          const moduleCompleted = progress?.completedModules?.some(m => m.moduleIndex === mIndex);
          const stepCount = module.steps?.length || 0;
          const completedStepCount = progress?.completedSteps?.filter(s => s.moduleIndex === mIndex).length || 0;
          return (
            <motion.div
              key={mIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mIndex * 0.05 }}
              className="glass-panel rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggleModule(mIndex)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  {moduleCompleted && <HiCheckCircle className="text-green-400 text-lg" />}
                  <div>
                    <h3 className="font-medium text-white">{module.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{stepCount} steps</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stepCount > 0 && (
                    <span className="text-xs text-gray-500">{completedStepCount}/{stepCount}</span>
                  )}
                  <HiChevronDown className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="px-5 pb-4 space-y-2 border-t border-white/5 pt-3">
                      {module.description && (
                        <p className="text-sm text-gray-400 mb-2">{module.description}</p>
                      )}
                      {module.steps?.map((step, sIndex) => {
                        const stepCompleted = progress?.completedSteps?.some(s => s.moduleIndex === mIndex && s.stepIndex === sIndex);
                        return (
                          <div key={sIndex} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            {stepCompleted ? (
                              <HiCheckCircle className="text-green-400 flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${stepCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {step.title}
                              </p>
                              {step.estimatedMinutes && (
                                <p className="text-xs text-gray-500 mt-0.5">{step.estimatedMinutes} min</p>
                              )}
                            </div>
                            {step.videoIds?.length > 0 && (
                              <Link
                                to={`/watch/${step.videoIds[0]}`}
                                className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all"
                              >
                                <HiPlay className="text-sm" />
                              </Link>
                            )}
                          </div>
                        );
                      })}
                      {module.quizzes?.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                          <p className="text-xs text-yellow-400 flex items-center gap-1">
                            <HiLightBulb /> {module.quizzes.length} quiz question(s) available
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {path.skillsGained?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 mt-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <HiAcademicCap /> Skills You'll Gain
          </h3>
          <div className="flex flex-wrap gap-2">
            {path.skillsGained.map(skill => (
              <span key={skill} className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-sm">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default LearningPathDetail;

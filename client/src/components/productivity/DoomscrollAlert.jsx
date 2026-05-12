import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiExclamation, HiX, HiLightningBolt, HiShieldCheck } from 'react-icons/hi';

const ALERT_CONFIGS = {
  warning: {
    icon: HiExclamation,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    btn: 'bg-yellow-500 text-dark-950 hover:bg-yellow-400',
    title: 'Mindless scrolling detected',
  },
  critical: {
    icon: HiLightningBolt,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    btn: 'bg-red-500 text-white hover:bg-red-400',
    title: 'Critical: Doomscroll alert',
  },
};

const DoomscrollAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((detail) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, ...detail, level: detail.level || 'warning' }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 8000);
  }, []);

  useEffect(() => {
    const handleAlert = (e) => addAlert(e.detail);
    window.addEventListener('doomscroll-alert', handleAlert);
    window.addEventListener('doomscroll-critical', handleAlert);
    return () => {
      window.removeEventListener('doomscroll-alert', handleAlert);
      window.removeEventListener('doomscroll-critical', handleAlert);
    };
  }, [addAlert]);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => {
          const config = ALERT_CONFIGS[alert.level] || ALERT_CONFIGS.warning;
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto glass-panel-strong rounded-xl p-4 border ${config.border} shadow-glass-xl`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bg} ${config.text} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{config.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.message}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        dismissAlert(alert.id);
                        window.dispatchEvent(new CustomEvent('doomscroll-action', { detail: { action: 'reset' } }));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${config.btn}`}
                    >
                      <HiShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                      Reset & Focus
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="p-1 hover:bg-white/5 rounded-lg flex-shrink-0">
                  <HiX className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="mt-2 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 8, ease: 'linear' }}
                  className={`h-full rounded-full ${alert.level === 'critical' ? 'bg-red-400' : 'bg-yellow-400'}`}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default DoomscrollAlert;

import React, { useState, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AiChat from '../ai/AiChat';
import FocusOverlay from '../focus/FocusOverlay';
import DoomscrollAlert from '../productivity/DoomscrollAlert';
import MotivationalCard from '../productivity/MotivationalCard';
import useDoomscrollDetection from '../../hooks/useDoomscrollDetection';
import useBehaviorTracking from '../../hooks/useBehaviorTracking';
import { selectFocus, setFullscreenLearning } from '../../store/slices/focusSlice';
import { pageTransition } from '../../utils/animations';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { fullscreenLearning } = useSelector(selectFocus);

  const noDetectionPages = ['/focus', '/productivity', '/login', '/register'];
  const detectionEnabled = useMemo(() =>
    !noDetectionPages.some(p => location.pathname.startsWith(p)),
    [location.pathname]
  );
  useDoomscrollDetection(detectionEnabled);
  useBehaviorTracking(detectionEnabled);

  return (
    <div className="flex flex-col h-screen bg-dark-950 overflow-hidden">
      {!fullscreenLearning && (
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      )}
      <div className="flex flex-1 overflow-hidden relative">
        {!fullscreenLearning && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
          />
        )}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-smooth ${
            fullscreenLearning ? 'ml-0' : sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          <div className="relative min-h-full">
            <div className="absolute inset-0 bg-mesh pointer-events-none" />
            <div className="relative p-4 md:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <FocusOverlay onClose={() => dispatch(setFullscreenLearning(false))}>
                    <Outlet />
                  </FocusOverlay>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
      <DoomscrollAlert />
      {!fullscreenLearning && !location.pathname.startsWith('/productivity') && !location.pathname.startsWith('/focus') && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <MotivationalCard />
        </div>
      )}
      {!fullscreenLearning && <AiChat />}
    </div>
  );
};

export default Layout;

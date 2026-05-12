import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHome, HiFire, HiCollection, HiClock, HiThumbUp, HiPlay,
  HiLibrary, HiUserGroup, HiBadgeCheck, HiPlusCircle, HiStar,
  HiTrendingUp, HiEyeOff, HiChartBar, HiBookOpen,
  HiCode, HiAcademicCap, HiChat, HiBriefcase, HiScissors,
  HiLightBulb, HiShieldCheck,
} from 'react-icons/hi';
import { AuthContext } from '../../context/AuthContext';

const mainLinks = [
  { to: '/', icon: HiHome, label: 'Home' },
  { to: '/trending', icon: HiFire, label: 'Trending' },
  { to: '/subscriptions', icon: HiCollection, label: 'Subscriptions' },
];

const libraryLinks = [
  { to: '/library', icon: HiLibrary, label: 'Library' },
  { to: '/history', icon: HiClock, label: 'History' },
  { to: '/watch-later', icon: HiPlay, label: 'Watch Later' },
  { to: '/liked', icon: HiThumbUp, label: 'Liked Videos' },
];

const Sidebar = ({ sidebarCollapsed }) => {
  const { user } = useContext(AuthContext);
  const linkClass = ({ isActive }) =>
    `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`;

  const renderLinks = (links) =>
    links.map((link) => (
      <NavLink key={link.to} to={link.to} className={linkClass} title={sidebarCollapsed ? link.label : ''}>
        <link.icon className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
        {!sidebarCollapsed && <span className="text-sm">{link.label}</span>}
      </NavLink>
    ));

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-14 h-full glass-panel-strong border-r border-white/5 overflow-y-auto overflow-x-hidden z-40"
    >
      <div className="p-3 space-y-1">
        {renderLinks(mainLinks)}
      </div>

      <div className="divider-gradient my-2 mx-3" />

      {!sidebarCollapsed && (
        <div className="p-3 pt-1">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-4">
            You
          </h3>
        </div>
      )}
      <div className="px-3 space-y-1">
        {user?.role === 'creator' ? (
          <NavLink
            to={`/channel/${user.id}`}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? 'Your Channel' : ''}
          >
            <HiBadgeCheck className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Your Channel</span>}
          </NavLink>
        ) : (
          <NavLink
            to="/create-channel"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? 'Create Channel' : ''}
          >
            <HiPlusCircle className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm">Create Channel</span>}
          </NavLink>
        )}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Dashboard' : ''}
        >
          <HiUserGroup className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
        </NavLink>
        <NavLink
          to="/studio"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Creator Studio' : ''}
        >
          <HiStar className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Creator Studio</span>}
        </NavLink>
        <NavLink
          to="/focus"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Focus Mode' : ''}
        >
          <HiEyeOff className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Focus Mode</span>}
        </NavLink>
        <NavLink
          to="/productivity"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Productivity' : ''}
        >
          <HiChartBar className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Productivity</span>}
        </NavLink>
        <NavLink
          to="/notes"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'My Notes' : ''}
        >
          <HiBookOpen className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">My Notes</span>}
        </NavLink>
        <NavLink
          to="/learning"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Learning Paths' : ''}
        >
          <HiAcademicCap className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Learning Paths</span>}
        </NavLink>
        <NavLink
          to="/playground"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Code Playground' : ''}
        >
          <HiCode className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Code Playground</span>}
        </NavLink>
        <NavLink
          to="/rooms"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Community Rooms' : ''}
        >
          <HiChat className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Community Rooms</span>}
        </NavLink>
        <NavLink
          to="/career"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Career Navigator' : ''}
        >
          <HiBriefcase className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Career Navigator</span>}
        </NavLink>
        <NavLink
          to="/project-builder"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Project Builder' : ''}
        >
          <HiLightBulb className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Project Builder</span>}
        </NavLink>
        <NavLink
          to="/project-review"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Project Review' : ''}
        >
          <HiShieldCheck className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Project Review</span>}
        </NavLink>
        <NavLink
          to="/shorts-studio"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          title={sidebarCollapsed ? 'Shorts Studio' : ''}
        >
          <HiScissors className={`text-xl ${sidebarCollapsed ? 'text-2xl' : ''}`} />
          {!sidebarCollapsed && <span className="text-sm">Shorts Studio</span>}
        </NavLink>
      </div>

      {!sidebarCollapsed && (
        <>
          <div className="divider-gradient my-2 mx-3" />
          <div className="p-3">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-4">
              Library
            </h3>
            <div className="space-y-1">{renderLinks(libraryLinks)}</div>
          </div>

          <div className="divider-gradient my-2 mx-3" />
          <div className="p-3 px-6">
            <p className="text-[10px] text-gray-600 leading-relaxed">
              FunTube &copy; {new Date().getFullYear()}
            </p>
          </div>
        </>
      )}
    </motion.aside>
  );
};

export default Sidebar;

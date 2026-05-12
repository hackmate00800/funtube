import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import GlassDropdown, { DropdownItem, DropdownDivider } from '../ui/Dropdown';
import GlassTooltip from '../ui/Tooltip';
import {
  HiMenu, HiSearch, HiUpload, HiBell, HiMoon, HiSun,
  HiUser, HiCog, HiLogout, HiSwitchHorizontal, HiPlusCircle,
  HiVideoCamera, HiViewGrid,
} from 'react-icons/hi';

const Navbar = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme, theme, themes } = useContext(ThemeContext);
  const curTheme = themes.find((t) => t.id === theme);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, text: 'New subscriber!', time: '2m ago', read: false },
    { id: 2, text: 'Your video "Getting Started" reached 1K views', time: '1h ago', read: false },
    { id: 3, text: 'New comment on your video', time: '3h ago', read: true },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel-strong border-b border-white/5 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors focus-ring"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiMenu className="text-xl text-gray-300" />
          </motion.button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              className="w-8 h-8 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-lg flex items-center justify-center font-bold text-white shadow-glow-sm group-hover:shadow-glow transition-all duration-300"
            >
              F
            </motion.div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Fun<span className="gradient-text">Tube</span>
            </span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className={`relative group transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search videos, creators, and more..."
              className="w-full bg-dark-800/60 border border-white/10 rounded-xl py-2.5 px-5 pr-12 text-white placeholder-gray-500 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all backdrop-blur-xl"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Search"
            >
              <HiSearch className="text-lg text-gray-300" />
            </motion.button>
          </div>
        </form>

        <div className="flex items-center gap-1.5">
          <GlassTooltip content={`Theme: ${curTheme?.name}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="btn-icon"
              aria-label="Toggle theme"
            >
              {isDark ? <HiSun className="text-lg" /> : <HiMoon className="text-lg" />}
            </motion.button>
          </GlassTooltip>

          <GlassTooltip content="Upload video">
            <Link to="/upload" className="btn-icon" aria-label="Upload video">
              <HiUpload className="text-lg" />
            </Link>
          </GlassTooltip>

          <div className="relative" ref={notifRef}>
            <GlassTooltip content="Notifications">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-icon relative"
                aria-label="Notifications"
              >
                <HiBell className="text-lg" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full animate-ping-slow"
                />
              </motion.button>
            </GlassTooltip>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-80 glass-panel-strong rounded-xl shadow-glass-xl py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                  </div>
                  {notifications.map((n) => (
                    <button key={n.id} className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${!n.read ? 'bg-primary-500/5' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">{n.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <GlassDropdown
            trigger={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-xl transition-colors focus-ring"
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-glow-sm">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </motion.button>
            }
          >
            <div className="px-4 py-3 border-b border-white/5">
              <p className="font-medium text-white text-sm">{user?.username}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <DropdownItem icon={HiUser} onClick={() => navigate(`/channel/${user?.id}`)}>
              Your Channel
            </DropdownItem>
            <DropdownItem icon={HiVideoCamera} onClick={() => navigate('/studio')}>
              Creator Studio
            </DropdownItem>
            {user?.role === 'creator' ? (
              <DropdownItem icon={HiSwitchHorizontal} onClick={() => navigate('/dashboard')}>
                Dashboard
              </DropdownItem>
            ) : (
              <DropdownItem icon={HiPlusCircle} onClick={() => navigate('/create-channel')}>
                Create Channel
              </DropdownItem>
            )}
            <DropdownDivider />
            <DropdownItem icon={HiViewGrid} onClick={() => navigate('/settings')}>
              Settings
            </DropdownItem>
            <DropdownItem icon={HiLogout} onClick={handleLogout} danger>
              Sign Out
            </DropdownItem>
          </GlassDropdown>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

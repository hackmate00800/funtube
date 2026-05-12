import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiUserGroup, HiPlus, HiLockOpen, HiLockClosed, HiUsers,
  HiVideoCamera, HiCode, HiBookOpen, HiChat, HiSearch,
  HiGlobe, HiLogin,
} from 'react-icons/hi';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../services/api';

const roomTypeIcons = {
  study: HiBookOpen,
  watch: HiVideoCamera,
  code: HiCode,
  general: HiChat,
};

const roomTypeColors = {
  study: 'from-blue-500 to-cyan-500',
  watch: 'from-red-500 to-pink-500',
  code: 'from-green-500 to-emerald-500',
  general: 'from-purple-500 to-violet-500',
};

function CommunityRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '', description: '', type: 'general', maxMembers: 50, isPrivate: false, password: '',
  });

  useEffect(() => {
    fetchRooms();
  }, [typeFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = typeFilter ? { type: typeFilter } : {};
      const { data } = await api.get('/rooms', { params });
      setRooms(data.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', type: 'general', maxMembers: 50, isPrivate: false, password: '' });
      fetchRooms();
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleJoin = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/join`, { password: joinPassword });
      setShowJoin(null);
      setJoinPassword('');
      fetchRooms();
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const filteredRooms = rooms.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Community Rooms</h1>
          <p className="text-gray-400 mt-1">Study, watch, and code together in real-time</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium hover:opacity-90 transition-all"
        >
          <HiPlus /> Create Room
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-panel pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full"
          />
        </div>
        {['', 'study', 'watch', 'code', 'general'].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              typeFilter === type
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'glass-panel text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {type ? React.createElement(roomTypeIcons[type], { className: 'text-sm' }) : <HiGlobe />}
            {type || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-white/10 rounded w-16" />
                <div className="h-4 bg-white/10 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-20">
          <HiUserGroup className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No rooms found</p>
          <button onClick={() => setShowCreate(true)} className="text-primary-400 hover:text-primary-300 transition-colors">
            Create the first room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRooms.map((room, i) => {
              const TypeIcon = roomTypeIcons[room.type] || HiChat;
              return (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel rounded-2xl p-6 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${roomTypeColors[room.type] || 'from-purple-500 to-violet-500'} bg-opacity-20`}>
                      <TypeIcon className="text-lg text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      {room.isPrivate ? <HiLockClosed className="text-yellow-500" /> : <HiLockOpen />}
                      {room.activeUsers?.length || 0}/{room.maxMembers}
                      <HiUsers className="ml-1" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{room.name}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{room.description || 'No description'}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 capitalize">{room.type}</span>
                    <span className="text-xs text-gray-500">{room.members?.length || 0} members</span>
                  </div>
                  <button
                    onClick={() => room.isPrivate ? setShowJoin(room._id) : handleJoin(room._id)}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary-500/10 text-primary-400 text-sm hover:bg-primary-500/20 transition-all"
                  >
                    <HiLogin /> Join Room
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Room Name"
            value={createForm.name}
            onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g., JavaScript Study Group"
            required
          />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What's this room about?"
              className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm(f => ({ ...f, type: e.target.value }))}
                className="w-full glass-panel px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
              >
                <option value="general">General</option>
                <option value="study">Study</option>
                <option value="watch">Watch Together</option>
                <option value="code">Code</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Members</label>
              <Input
                type="number"
                value={createForm.maxMembers}
                onChange={(e) => setCreateForm(f => ({ ...f, maxMembers: parseInt(e.target.value) || 50 }))}
                min={2}
                max={200}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.isPrivate}
              onChange={(e) => setCreateForm(f => ({ ...f, isPrivate: e.target.checked }))}
              className="rounded bg-white/5 border-gray-600"
            />
            <span className="text-sm text-gray-300">Private Room (password required)</span>
          </label>
          {createForm.isPrivate && (
            <Input
              label="Room Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Enter room password"
              required
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
            <Button type="submit">Create Room</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showJoin} onClose={() => { setShowJoin(null); setJoinPassword(''); }} title="Join Private Room">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">This room requires a password to join.</p>
          <Input
            label="Room Password"
            type="password"
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
            placeholder="Enter room password"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowJoin(null); setJoinPassword(''); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
            <Button onClick={() => handleJoin(showJoin)} disabled={!joinPassword}>Join Room</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default CommunityRooms;

import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiCamera, HiPhotograph, HiCheck } from 'react-icons/hi';

const CreateChannel = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (file) { setCover(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('channelDescription', description);
      if (avatar) fd.append('avatar', avatar);
      if (cover) fd.append('cover', cover);
      const { data } = await authAPI.createChannel(fd);
      setUser(data.data);
      toast.success('Channel created!');
      navigate(`/channel/${data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Create Your Channel</h1>
        <p className="text-gray-400 mt-2">Customize your channel and start sharing content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
          {coverPreview && <img src={coverPreview} alt="" className="w-full h-full object-cover" />}
          <button type="button" onClick={() => coverRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <HiPhotograph className="text-3xl text-white" />
          </button>
          <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} hidden />
        </div>

        <div className="flex items-end gap-6 -mt-16 relative z-10 px-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-dark-800 overflow-hidden bg-dark-700">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-primary-400 font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button type="button" onClick={() => avatarRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
              <HiCamera className="text-sm text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} hidden />
          </div>
          <div className="pb-2">
            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Channel Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-field resize-none" placeholder="Tell viewers about your channel..." maxLength={1000} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-lg">
          {loading ? 'Creating...' : <><HiCheck className="text-xl" /> Create Channel</>}
        </button>
      </form>
    </div>
  );
};

export default CreateChannel;

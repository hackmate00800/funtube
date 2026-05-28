import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { driveAPI, inviteAPI, uploadFileToGoogle } from '../services/driveAPI';
import toast from 'react-hot-toast';

const UploaderDashboard = () => {
  const [searchParams] = useSearchParams();
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [videos, setVideos] = useState([]);
  const [invites, setInvites] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('videos');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await driveAPI.getStatus();
      setDriveConnected(statusRes.data.connected);
      setDriveEmail(statusRes.data.email || '');

      if (statusRes.data.connected) {
        const videosRes = await driveAPI.getMyVideos({ limit: 100 });
        setVideos(videosRes.data.data || []);

        const invitesRes = await inviteAPI.list();
        const inviteMap = {};
        (invitesRes.data.data || []).forEach((inv) => {
          const vid = inv.video?._id || inv.video;
          if (!inviteMap[vid]) inviteMap[vid] = [];
          inviteMap[vid].push(inv);
        });
        setInvites(inviteMap);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const driveStatus = searchParams.get('drive');
    if (driveStatus === 'connected') {
      toast.success('Google Drive connected!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (driveStatus === 'error') {
      toast.error('Failed to connect Google Drive. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    loadData();
  }, [loadData, searchParams]);

  const handleConnectDrive = async () => {
    try {
      const { data } = await driveAPI.getAuthUrl();
      window.location.href = data.url;
    } catch (err) {
      toast.error('Failed to get auth URL');
    }
  };

  const handleDisconnect = async () => {
    try {
      await driveAPI.disconnect();
      setDriveConnected(false);
      setDriveEmail('');
      toast.success('Google Drive disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video permanently?')) return;
    try {
      await driveAPI.deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v._id !== id));
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied');
  };

  const handleDeleteInvite = async (id, videoId) => {
    try {
      await inviteAPI.delete(id);
      setInvites((prev) => ({
        ...prev,
        [videoId]: (prev[videoId] || []).filter((i) => i._id !== id),
      }));
      toast.success('Invite link deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleInvite = async (id, videoId, currentActive) => {
    try {
      const res = await inviteAPI.update(id, { isActive: !currentActive });
      setInvites((prev) => ({
        ...prev,
        [videoId]: (prev[videoId] || []).map((i) => (i._id === id ? res.data.data : i)),
      }));
      toast.success(res.data.data.isActive ? 'Link activated' : 'Link deactivated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const CreateInviteForm = ({ videoId }) => {
    const [maxViews, setMaxViews] = useState('');
    const [expiry, setExpiry] = useState('');

    const handleCreate = async (e) => {
      e.preventDefault();
      try {
        const res = await inviteAPI.create({ videoId, maxViews: maxViews || 0, expiresInHours: expiry || 0 });
        setInvites((prev) => ({
          ...prev,
          [videoId]: [...(prev[videoId] || []), res.data.data],
        }));
        setMaxViews('');
        setExpiry('');
        toast.success('Invite link created');
      } catch {
        toast.error('Failed to create invite');
      }
    };

    return (
      <form onSubmit={handleCreate} className="flex gap-2 items-end mt-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Views (0 = unlimited)</label>
          <input type="number" min="0" value={maxViews} onChange={(e) => setMaxViews(e.target.value)}
            className="input-field w-24 text-sm" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Expires (hours, 0 = never)</label>
          <input type="number" min="0" value={expiry} onChange={(e) => setExpiry(e.target.value)}
            className="input-field w-24 text-sm" placeholder="0" />
        </div>
        <button type="submit" className="btn-primary text-sm px-3 py-2">Generate</button>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Uploader Dashboard</h1>

      <div className="glass border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Google Drive</h2>
            <p className="text-gray-400 text-sm mt-1">
              {driveConnected ? `Connected: ${driveEmail}` : 'Not connected'}
            </p>
          </div>
          {driveConnected ? (
            <button onClick={handleDisconnect} className="btn-secondary text-sm">Disconnect</button>
          ) : (
            <button onClick={handleConnectDrive} className="btn-primary text-sm">Connect Google Drive</button>
          )}
        </div>
      </div>

      {driveConnected && (
        <>
          <div className="flex gap-2 border-b border-dark-700 pb-2">
            {['videos', 'upload'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'videos' ? 'My Videos' : 'Upload New'}
              </button>
            ))}
          </div>

          {tab === 'upload' && <UploadForm onUploaded={loadData} />}

          {tab === 'videos' && (
            <div className="space-y-4">
              {videos.length === 0 && (
                <p className="text-gray-500 text-center py-8">No videos uploaded yet.</p>
              )}
              {videos.map((video) => (
                <div key={video._id} className="glass border border-dark-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{video.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{video.description || 'No description'}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>Views: {video.viewCount}</span>
                        <span>Size: {(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                        <span className="capitalize">{video.access}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/invite/${invites[video._id]?.[0]?.token || ''}`}
                        className="btn-secondary text-xs px-3 py-1.5">Preview</Link>
                      <button onClick={() => handleDeleteVideo(video._id)}
                        className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5">Delete</button>
                    </div>
                  </div>

                  <div className="border-t border-dark-700 pt-3">
                    <p className="text-sm font-medium text-gray-300 mb-2">Invite Links</p>
                    <div className="space-y-2">
                      {(invites[video._id] || []).map((inv) => (
                        <div key={inv._id} className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3 text-sm">
                            <code className="text-primary-300 text-xs">{inv.token}</code>
                            <span className="text-gray-500">{inv.viewsCount}/{inv.maxViews || '∞'} views</span>
                            <span className={`text-xs ${inv.isActive ? 'text-green-400' : 'text-red-400'}`}>
                              {inv.isActive ? 'Active' : 'Disabled'}
                            </span>
                            {inv.expiresAt && <span className="text-xs text-gray-500">Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copyInviteLink(inv.token)}
                              className="text-primary-400 hover:text-primary-300 text-xs">Copy</button>
                            <button onClick={() => handleToggleInvite(inv._id, video._id, inv.isActive)}
                              className="text-yellow-400 hover:text-yellow-300 text-xs">
                              {inv.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => handleDeleteInvite(inv._id, video._id)}
                              className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                          </div>
                        </div>
                      ))}
                      <CreateInviteForm videoId={video._id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const UploadForm = ({ onUploaded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [seriesName, setSeriesName] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [access, setAccess] = useState('unlisted');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) { toast.error('Title and video file are required'); return; }
    setUploading(true);
    setProgress(0);
    setPhase('Initializing upload...');
    try {
      const { data: initData } = await driveAPI.initUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4',
        title,
        description,
        category,
        seriesName,
        episodeNumber,
        access,
      });
      const { uploadUrl, sessionId } = initData;

      setPhase('Uploading to Google Drive...');
      const meta = await uploadFileToGoogle(uploadUrl, file, (pct) => {
        setProgress(pct);
      });

      setPhase('Finalizing...');
      const fileId = meta.id || meta.fileId || meta.resourceId;
      if (!fileId) {
        throw new Error('Could not retrieve file ID from Google Drive response');
      }
      await driveAPI.completeUpload({ sessionId, driveFileId: fileId, fileSize: file.size, mimeType: file.type });

      toast.success('Video uploaded to Google Drive!');
      setTitle('');
      setDescription('');
      setFile(null);
      setProgress(0);
      setPhase('');
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setPhase('');
    }
  };

  return (
    <div className="glass border border-dark-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="input-field" placeholder="Video title" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="input-field" rows="3" placeholder="Video description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              <option value="movie">Movie</option>
              <option value="web-series">Web Series</option>
              <option value="episode">Episode</option>
              <option value="short">Short</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Access</label>
            <select value={access} onChange={(e) => setAccess(e.target.value)} className="input-field">
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Series Name</label>
            <input type="text" value={seriesName} onChange={(e) => setSeriesName(e.target.value)}
              className="input-field" placeholder="e.g. My Web Series" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Episode #</label>
            <input type="number" min="0" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)}
              className="input-field" placeholder="1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Video File *</label>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])}
            className="text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-500" />
        </div>
        {uploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{phase || 'Uploading...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-dark-800 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            {file && (
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB &middot; 10 MB chunks
              </p>
            )}
          </div>
        )}
        <button type="submit" disabled={uploading} className="btn-primary w-full py-3">
          {uploading ? 'Uploading...' : 'Upload to Google Drive'}
        </button>
      </form>
    </div>
  );
};

export default UploaderDashboard;

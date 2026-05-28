import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inviteAPI } from '../services/driveAPI';

const WatchInvite = () => {
  const { token } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadVideo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await inviteAPI.info(token);
      setVideo(data.data);
    } catch (err) {
      if (err.response?.status === 410) {
        setError('This invite link has expired or is no longer available.');
      } else if (err.response?.status === 404) {
        setError('Invalid invite link.');
      } else {
        setError('Failed to load video.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadVideo(); }, [loadVideo]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-6xl">🔗</div>
        <h1 className="text-2xl font-bold text-white text-center">{error}</h1>
        <Link to="/" className="text-primary-400 hover:text-primary-300">Go Home</Link>
      </div>
    );
  }

  const streamUrl = inviteAPI.stream(token);

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6">
          <video
            key={token}
            className="w-full h-full"
            controls
            autoPlay
            preload="metadata"
            playsInline
          >
            <source src={streamUrl} type={video?.mimeType || 'video/mp4'} />
            Your browser does not support video playback.
          </video>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{video?.title}</h1>
              {video?.seriesName && (
                <p className="text-gray-400 mt-1">
                  {video.seriesName}{video.episodeNumber ? ` - Episode ${video.episodeNumber}` : ''}
                </p>
              )}
              {video?.description && (
                <p className="text-gray-500 mt-2">{video.description}</p>
              )}
            </div>
            <button
              onClick={handleShare}
              className="btn-secondary whitespace-nowrap text-sm"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          <div className="flex gap-4 text-sm text-gray-500">
            <span>{video?.viewCount || 0} views</span>
            {video?.category && <span className="capitalize">{video.category}</span>}
            {video?.duration > 0 && (
              <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-600 text-sm">
        Powered by{' '}
        <Link to="/" className="text-primary-400 hover:text-primary-300">FunTube</Link>
      </footer>
    </div>
  );
};

export default WatchInvite;

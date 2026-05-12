import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';

const Playlist = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    const pl = user?.playlists?.find((p) => p._id === id || p.name === id);
    setPlaylist(pl);
  }, [id, user]);

  if (!playlist) {
    return <div className="text-center py-20 text-gray-500 text-2xl">Playlist not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
        <p className="text-gray-400 mt-1">{playlist.description}</p>
        <p className="text-sm text-gray-500 mt-1">{playlist.videos?.length || 0} videos</p>
      </div>
      {(!playlist.videos || playlist.videos.length === 0) ? (
        <p className="text-center text-gray-500 py-12">This playlist is empty</p>
      ) : (
        <div className="video-grid">
          {playlist.videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlist;

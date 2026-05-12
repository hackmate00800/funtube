import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import { HiClock } from 'react-icons/hi';

const History = () => {
  const { user } = useContext(AuthContext);
  const history = user?.watchHistory || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <HiClock className="text-primary-400" />
        Watch History
      </h1>
      {history.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-2xl mb-2">No watch history</p>
          <p>Videos you watch will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, i) => (
            item.video && <VideoCard key={item._id || i} video={item.video} horizontal />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket || !socket.connected) {
    if (socket) socket.removeAllListeners();
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinVideoRoom = (videoId) => {
  const s = connectSocket();
  s.emit('join-video', videoId);
};

export const leaveVideoRoom = (videoId) => {
  if (socket && socket.connected) {
    socket.emit('leave-video', videoId);
  }
};

export const joinNotifications = (userId) => {
  const s = connectSocket();
  s.emit('join-notifications', userId);
};

export default socket;

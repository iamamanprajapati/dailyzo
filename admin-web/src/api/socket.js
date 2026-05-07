import { io } from 'socket.io-client';
import { useAuth } from '../store/auth';

let socket;

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = useAuth.getState().accessToken;
  socket = io('/', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

import { io } from 'socket.io-client';
import { ROOT_URL } from './client';
import { useAuth } from '../store/auth';

let socket;

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = useAuth.getState().accessToken;
  socket = io(ROOT_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

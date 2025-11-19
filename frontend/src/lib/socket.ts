import { io, Socket } from 'socket.io-client';

// Use environment variable for WebSocket URL, with fallback for development
const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export const socket: Socket = io(wsUrl, {
  withCredentials: true,
  transports: ['websocket'],
});

/* Tiny helper that returns a promise for socket‑ack events */
socket.emitWithAck = (event: string, data: any, timeout = 5000) =>
  new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Ack timeout')), timeout);
    socket.emit(event, data, (response: any) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
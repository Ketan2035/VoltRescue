import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import storage from '../services/storage';
import { SERVER_HOST } from '../services/api';

const SOCKET_URL = SERVER_HOST;

interface SocketContextType {
  socket: Socket | null;
  connect: (token?: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = (token?: string) => {
    if (socket) {
      socket.disconnect();
    }
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to Render backend:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.log('🚨 Socket connection error:', error.message);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  useEffect(() => {
    const initSocket = async () => {
      const token = await storage.getItem('operatorToken');
      connect(token || undefined);
    };
    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

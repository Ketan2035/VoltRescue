import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import storage from '../services/storage';
import { SERVER_HOST } from '../services/api';

const SOCKET_URL = SERVER_HOST;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token?: string, guestId?: string) => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const activeRoomsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  const joinRoom = useCallback((room: string) => {
    if (!room) return;
    activeRoomsRef.current.add(room);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_room', room);
      console.log(`[SOCKET] Joined room: ${room}`);
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (!room) return;
    activeRoomsRef.current.delete(room);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_room', room);
      console.log(`[SOCKET] Left room: ${room}`);
    }
  }, []);

  const connect = useCallback(async (token?: string, guestId?: string) => {
    const opToken = token || (await storage.getItem('operatorToken'));
    const gId = guestId || (await storage.getItem('guestSessionId'));

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log(`[SOCKET] Connecting to: ${SOCKET_URL}`);

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: opToken || undefined,
        guestId: gId || undefined,
      },
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
    });

    newSocket.on('connect', () => {
      console.log(`⚡ [SOCKET CONNECTED]: ${newSocket.id}`);
      setIsConnected(true);

      // Re-register identity
      if (opToken) {
        newSocket.emit('register_operator', opToken);
      } else if (gId) {
        newSocket.emit('register_customer', gId);
      }

      // Re-join all active rooms on reconnect
      activeRoomsRef.current.forEach((room) => {
        newSocket.emit('join_room', room);
        console.log(`[SOCKET RECOVERY] Restored room: ${room}`);
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`⚠️ [SOCKET DISCONNECTED]: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log(`🚨 [SOCKET ERROR]: ${error.message}`);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

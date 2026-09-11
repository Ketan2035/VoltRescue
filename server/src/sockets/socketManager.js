import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io;

export const initSocketManager = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Restrict to your domain in production
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const guestId = socket.handshake.auth.guestId || socket.handshake.headers?.['x-guest-session-id'];

      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          socket.operatorId = decoded.id;
          socket.isOperator = true;
        } catch {
          socket.isGuest = true;
        }
      } else {
        socket.isGuest = true;
      }

      if (guestId) {
        socket.guestId = guestId;
      }

      next();
    } catch {
      socket.isGuest = true;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `🔌 [SOCKET CONNECTED]: ${socket.id} (Operator: ${socket.operatorId || 'No'}, Guest: ${socket.guestId || 'No'})`
    );

    // Auto-join operator specific room if verified operator
    if (socket.isOperator && socket.operatorId) {
      const operatorRoom = `operator_${socket.operatorId}`;
      socket.join(operatorRoom);
      console.log(`[SOCKET ROOM]: ${socket.id} auto-joined: ${operatorRoom}`);
    }

    // Auto-join customer/guest specific room if provided
    if (socket.guestId) {
      const customerRoom = `customer_${socket.guestId}`;
      socket.join(customerRoom);
      console.log(`[SOCKET ROOM]: ${socket.id} auto-joined: ${customerRoom}`);
    }

    socket.on('register_operator', (tokenOrId) => {
      try {
        let opId = tokenOrId;
        if (tokenOrId && typeof tokenOrId === 'string' && tokenOrId.includes('.')) {
          const decoded = jwt.verify(tokenOrId, env.JWT_SECRET);
          opId = decoded.id;
        }
        if (opId) {
          socket.operatorId = opId;
          socket.isOperator = true;
          socket.join(`operator_${opId}`);
          console.log(`[SOCKET ROOM]: ${socket.id} registered operator room: operator_${opId}`);
        }
      } catch (e) {
        console.error('Error registering operator on socket:', e.message);
      }
    });

    socket.on('register_customer', (customerIdOrGuestId) => {
      if (customerIdOrGuestId) {
        socket.guestId = customerIdOrGuestId;
        socket.join(`customer_${customerIdOrGuestId}`);
        console.log(`[SOCKET ROOM]: ${socket.id} registered customer room: customer_${customerIdOrGuestId}`);
      }
    });

    socket.on('join_room', (room) => {
      if (room) {
        socket.join(room);
        console.log(`[SOCKET ROOM JOIN]: ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('leave_room', (room) => {
      if (room) {
        socket.leave(room);
        console.log(`[SOCKET ROOM LEAVE]: ${socket.id} left room: ${room}`);
      }
    });

    socket.on('operator_location_update', (data) => {
      const { bookingId, location } = data;
      if (bookingId && location) {
        io.to(`booking_${bookingId}`).emit('operator_location_update', {
          bookingId,
          location,
          operatorId: socket.operatorId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('send_message', (data) => {
      const { bookingId, text, senderId, senderName, timestamp, isOperator } = data;
      if (bookingId && text) {
        socket.to(`booking_${bookingId}`).emit('receive_message', {
          id: Math.random().toString(36).substring(7),
          bookingId,
          text,
          senderId,
          senderName,
          timestamp: timestamp || new Date().toISOString(),
          isOperator,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [SOCKET DISCONNECTED]: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

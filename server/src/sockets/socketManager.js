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
  });

  // Optional auth middleware — guests connect without a token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (token) {
        // Operator connecting with JWT
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.operatorId = decoded.id;
        socket.isOperator = true;
      } else {
        // Guest customer — allowed without token
        socket.isGuest = true;
      }

      next();
    } catch (err) {
      // Invalid token — still allow as guest, don't block
      socket.isGuest = true;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id} (${socket.isOperator ? 'Operator: ' + socket.operatorId : 'Guest'})`);

    // Auto-join operator specific room if they are an operator
    if (socket.isOperator && socket.operatorId) {
      const operatorRoom = `operator_${socket.operatorId}`;
      socket.join(operatorRoom);
      console.log(`Socket ${socket.id} auto-joined: ${operatorRoom}`);
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
          console.log(`Socket ${socket.id} explicitly registered operator room: operator_${opId}`);
        }
      } catch (e) {
        console.error('Error registering operator on socket:', e.message);
      }
    });

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('operator_location_update', (data) => {
      const { bookingId, location } = data;
      if (bookingId && location) {
        // Broadcast to everyone in the booking room (e.g. the customer)
        io.to(`booking_${bookingId}`).emit('operator_location_update', {
          bookingId,
          location,
          operatorId: socket.operatorId
        });
      }
    });

    socket.on('send_message', (data) => {
      const { bookingId, text, senderId, senderName, timestamp, isOperator } = data;
      if (bookingId && text) {
        // Broadcast to everyone in the booking room EXCEPT the sender
        // To keep it simple and ensure the sender sees it too (if they re-connect), 
        // we emit to the whole room. The client will handle deduplication if needed, 
        // or the client can just rely on local state for their own messages.
        // Actually, let's just use socket.to() to send to others in the room.
        socket.to(`booking_${bookingId}`).emit('receive_message', {
          id: Math.random().toString(36).substring(7), // Simple unique ID
          bookingId,
          text,
          senderId,
          senderName,
          timestamp: timestamp || new Date().toISOString(),
          isOperator
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
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

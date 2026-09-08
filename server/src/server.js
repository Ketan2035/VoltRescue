import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { initSocketManager } from './sockets/socketManager.js';
import { startCronJobs } from './services/cron.service.js';

let server;

const startServer = async () => {
  await connectDB();

  server = http.createServer(app);

  // Initialize Socket.IO
  initSocketManager(server);

  // Start background jobs
  startCronJobs();

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});

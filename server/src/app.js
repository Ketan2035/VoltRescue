import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Root healthcheck for Render / cloud monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VoltRescue Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Generous limit for real-time mobile GPS updates
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use(notFound);

// global error handler
app.use(errorHandler);

export default app;

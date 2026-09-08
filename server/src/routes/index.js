import express from 'express';
import authRoutes from './auth.routes.js';
import operatorRoutes from './operator.routes.js';
import bookingRoutes from './booking.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/operators', operatorRoutes);
router.use('/bookings', bookingRoutes);

export default router;

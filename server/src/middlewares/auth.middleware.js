import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';
import GuestSession from '../models/GuestSession.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers['x-guest-session-id']) {
      const deviceId = req.headers['x-guest-session-id'];
      const session = await GuestSession.findOne({ deviceId });
      if (session) {
        req.guestId = session._id;
        req.guestDeviceId = deviceId;
      }
    }

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.role === 'customer') {
          req.customerId = decoded.id;
        } else {
          req.operatorId = decoded.id;
        }
      } catch (err) {
        // Only throw if no guest session was found either
        if (!req.guestId) {
          return next(new AppError(401, 'Not authorized, token failed'));
        }
      }
    }

    if (!req.guestId && !req.customerId && !req.operatorId) {
      return next(new AppError(401, 'Not authorized, no token or guest session provided'));
    }

    next();
  } catch (error) {
    next(new AppError(401, 'Not authorized, token failed'));
  }
};

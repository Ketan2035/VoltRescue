import Operator from '../models/Operator.js';
import GuestSession from '../models/GuestSession.js';
import Customer from '../models/Customer.js';
import Availability from '../models/Availability.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';
import { v4 as uuidv4 } from 'uuid';

export const registerOperator = async (data) => {
  const { name, email, phone, password, vehicleDetails } = data;

  const existingOperator = await Operator.findOne({ $or: [{ email }, { phone }] });
  if (existingOperator) {
    throw new AppError(400, 'Operator already exists with this email or phone');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const operator = await Operator.create({
    name,
    email,
    phone,
    passwordHash,
    vehicleDetails,
  });

  // Create default availability for the new operator
  await Availability.create({
    operatorId: operator._id,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '00:00', end: '23:59' }, // Available 24/7 by default
    breakHours: { start: '12:00', end: '13:00' },
    holidays: [],
    unavailableDates: [],
    maximumBookingsPerDay: 50
  });

  const token = jwt.sign({ id: operator._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  operator.passwordHash = undefined;

  return { operator, token };
};

export const loginOperator = async (email, password) => {
  const operator = await Operator.findOne({ email }).select('+passwordHash');
  if (!operator) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, operator.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = jwt.sign({ id: operator._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  operator.passwordHash = undefined;

  return { operator, token };
};

export const registerCustomer = async (data) => {
  const { name, email, phone, password } = data;

  const existingCustomer = await Customer.findOne({ $or: [{ email }, { phone }] });
  if (existingCustomer) {
    throw new AppError(400, 'Customer already exists with this email or phone');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const customer = await Customer.create({
    name,
    email,
    phone,
    passwordHash,
  });

  const token = jwt.sign({ id: customer._id, role: 'customer' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  customer.passwordHash = undefined;

  return { customer, token };
};

export const loginCustomer = async (email, password) => {
  const customer = await Customer.findOne({ email }).select('+passwordHash');
  if (!customer) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, customer.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = jwt.sign({ id: customer._id, role: 'customer' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  customer.passwordHash = undefined;

  return { customer, token };
};

export const createGuestSession = async (deviceId, fcmToken) => {
  let session;

  // Only search by deviceId if it was actually provided — otherwise create a new session
  if (deviceId) {
    session = await GuestSession.findOne({ deviceId });
  }

  if (!session) {
    session = await GuestSession.create({
      deviceId: deviceId || uuidv4(),
      fcmToken,
    });
  } else {
    session.lastActive = Date.now();
    if (fcmToken) session.fcmToken = fcmToken;
    await session.save();
  }

  return session;
};


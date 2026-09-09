import * as authService from '../services/auth.service.js';
import Operator from '../models/Operator.js';

export const register = async (req, res, next) => {
  try {
    const { operator, token } = await authService.registerOperator(req.body);
    res.status(201).json({
      status: 'success',
      data: { operator, token },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { operator, token } = await authService.loginOperator(email, password);
    res.status(200).json({
      status: 'success',
      data: { operator, token },
    });
  } catch (error) {
    next(error);
  }
};

export const registerCustomer = async (req, res, next) => {
  try {
    const { customer, token } = await authService.registerCustomer(req.body);
    res.status(201).json({
      status: 'success',
      data: { customer, token },
    });
  } catch (error) {
    next(error);
  }
};

export const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { customer, token } = await authService.loginCustomer(email, password);
    res.status(200).json({
      status: 'success',
      data: { customer, token },
    });
  } catch (error) {
    next(error);
  }
};

export const guestSession = async (req, res, next) => {
  try {
    const { deviceId, fcmToken } = req.body;
    const session = await authService.createGuestSession(deviceId, fcmToken);
    res.status(200).json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.operatorId) {
      return res.status(401).json({ status: 'error', message: 'Not authorized as operator' });
    }
    const operator = await Operator.findById(req.operatorId);
    if (!operator) {
      return res.status(404).json({ status: 'error', message: 'Operator not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { operator }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerMe = async (req, res, next) => {
  try {
    if (!req.customerId) {
      return res.status(401).json({ status: 'error', message: 'Not authorized as customer' });
    }
    const customer = await authService.getCustomerProfile(req.customerId);
    res.status(200).json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

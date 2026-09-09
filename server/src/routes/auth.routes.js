import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as authValidator from '../validators/auth.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Operator auth (both /operator/* and legacy root)
router.post('/operator/register', validate(authValidator.registerOperatorSchema), authController.register);
router.post('/operator/login', validate(authValidator.loginSchema), authController.login);
router.get('/operator/me', protect, authController.getMe);

router.post('/register', validate(authValidator.registerOperatorSchema), authController.register);
router.post('/login', validate(authValidator.loginSchema), authController.login);
router.get('/me', protect, authController.getMe);

// Customer auth
router.post('/customer/register', validate(authValidator.registerCustomerSchema), authController.registerCustomer);
router.post('/customer/login', validate(authValidator.loginSchema), authController.loginCustomer);
router.get('/customer/me', protect, authController.getCustomerMe);

// Guest session
router.post('/guest', validate(authValidator.guestSessionSchema), authController.guestSession);

export default router;

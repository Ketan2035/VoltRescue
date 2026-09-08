import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as authValidator from '../validators/auth.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', validate(authValidator.registerOperatorSchema), authController.register);
router.post('/login', validate(authValidator.loginSchema), authController.login);

// Customer auth
router.post('/customer/register', validate(authValidator.registerCustomerSchema), authController.registerCustomer);
router.post('/customer/login', validate(authValidator.loginSchema), authController.loginCustomer);

router.post('/guest', validate(authValidator.guestSessionSchema), authController.guestSession);

router.get('/me', protect, authController.getMe);

export default router;

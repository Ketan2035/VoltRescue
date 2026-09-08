import express from 'express';
import * as operatorController from '../controllers/operator.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as operatorValidator from '../validators/operator.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/nearby', validate(operatorValidator.getNearbySchema), operatorController.getNearby);

// Protected routes for operators
router.use(protect);
router.patch('/status', validate(operatorValidator.updateStatusSchema), operatorController.updateStatus);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import * as goalController from '../controllers/goalController.js';
import { handleValidation } from '../middleware/handleValidation.js';

const router = Router();

router.get('/', goalController.getGoals);
router.post(
  '/',
  body('dailyStepsGoal')
    .isFloat({ min: 0 })
    .withMessage('dailyStepsGoal is required and must be non-negative'),
  body('dailyCodingGoal')
    .isFloat({ min: 0 })
    .withMessage('dailyCodingGoal is required and must be non-negative'),
  handleValidation,
  goalController.postGoals
);

export default router;

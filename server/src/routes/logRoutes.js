import { Router } from 'express';
import { body, param } from 'express-validator';
import * as logController from '../controllers/logController.js';
import { handleValidation } from '../middleware/handleValidation.js';

const router = Router();

const logBodyValidators = [
  body('date').notEmpty().withMessage('date is required'),
  body('steps').isFloat({ min: 0 }).withMessage('steps must be a non-negative number'),
  body('screenTime').optional().isObject().withMessage('screenTime must be an object'),
  body('screenTime.instagram')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('screenTime.instagram must be non-negative'),
  body('screenTime.total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('screenTime.total must be non-negative'),
  body('codingHours').isFloat({ min: 0 }).withMessage('codingHours must be non-negative'),
  body('mood')
    .isIn(['productive', 'average', 'low'])
    .withMessage('mood must be productive, average, or low'),
  body('notes').optional().isString(),
  body('metrics').optional().isObject().withMessage('metrics must be an object'),
];

router.post('/', logBodyValidators, handleValidation, logController.createLog);
router.get('/', logController.getLogs);
router.get(
  '/:date',
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date param must be YYYY-MM-DD'),
  handleValidation,
  logController.getLogByDate
);

export default router;

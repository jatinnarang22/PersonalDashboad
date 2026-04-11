import { Router } from 'express';
import { body, param } from 'express-validator';
import * as projectController from '../controllers/projectController.js';
import { handleValidation } from '../middleware/handleValidation.js';

const router = Router();

const createValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('status')
    .isIn(['active', 'completed', 'paused'])
    .withMessage('status must be active, completed, or paused'),
  body('hoursSpent').isFloat({ min: 0 }).withMessage('hoursSpent must be non-negative'),
  body('description').optional().isString(),
];

const patchValidators = [
  param('id').isMongoId().withMessage('Invalid id'),
  body('name').optional().trim().notEmpty(),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'paused'])
    .withMessage('status must be active, completed, or paused'),
  body('hoursSpent').optional().isFloat({ min: 0 }),
  body('description').optional().isString(),
];

router.post('/', createValidators, handleValidation, projectController.createProject);
router.get('/', projectController.listProjects);
router.patch('/:id', patchValidators, handleValidation, projectController.updateProject);

export default router;

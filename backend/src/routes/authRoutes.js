import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { handleValidation } from '../middleware/handleValidation.js';

const router = Router();

router.post(
  '/register',
  ...authController.registerValidators,
  handleValidation,
  authController.register
);

router.post(
  '/login',
  ...authController.loginValidators,
  handleValidation,
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', authController.me);

export default router;

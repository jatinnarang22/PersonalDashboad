import { Router } from 'express';
import logRoutes from './logRoutes.js';
import projectRoutes from './projectRoutes.js';
import goalRoutes from './goalRoutes.js';
import insightRoutes from './insightRoutes.js';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/logs', logRoutes);
router.use('/projects', projectRoutes);
router.use('/goals', goalRoutes);
router.use('/insights', insightRoutes);

export default router;

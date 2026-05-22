import { Router } from 'express';
import * as insightController from '../controllers/insightController.js';

const router = Router();

router.get('/today', insightController.getTodayInsights);

export default router;

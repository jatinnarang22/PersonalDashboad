import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import * as integrationController from '../controllers/integrationController.js';

const router = Router();

router.get('/status', requireAuth, integrationController.integrationsStatus);

router.get('/youtube/start', requireAuth, integrationController.youtubeStart);
router.get('/youtube/callback', integrationController.youtubeCallback);
router.get('/youtube/summary', requireAuth, integrationController.youtubeSummary);
router.delete('/youtube', requireAuth, integrationController.youtubeDisconnect);

router.get('/instagram/start', requireAuth, integrationController.instagramStart);
router.get('/instagram/callback', integrationController.instagramCallback);
router.post('/instagram/manual', requireAuth, integrationController.instagramManualConnect);
router.post(
  '/instagram/from-user-token',
  requireAuth,
  integrationController.instagramFromUserToken
);
router.get('/instagram/summary', requireAuth, integrationController.instagramSummary);
router.delete('/instagram', requireAuth, integrationController.instagramDisconnect);

router.post('/github/connect', requireAuth, integrationController.githubConnect);
router.get('/github/start', requireAuth, integrationController.githubStart);
router.get('/github/callback', integrationController.githubCallback);
router.get('/github/summary', requireAuth, integrationController.githubSummary);
router.delete('/github', requireAuth, integrationController.githubDisconnect);

router.post('/wakatime/connect', requireAuth, integrationController.wakatimeConnect);
router.get('/wakatime/summary', requireAuth, integrationController.wakatimeSummary);
router.delete('/wakatime', requireAuth, integrationController.wakatimeDisconnect);
router.get('/trends/:platform', requireAuth, integrationController.integrationTrends);

export default router;

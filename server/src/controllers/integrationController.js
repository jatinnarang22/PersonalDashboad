import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import * as yt from '../services/youtubeIntegrationService.js';
import * as ig from '../services/instagramIntegrationService.js';
import * as gh from '../services/githubIntegrationService.js';
import * as wt from '../services/wakatimeIntegrationService.js';
import { saveSnapshot, getSnapshots } from '../services/snapshotService.js';
import { saveOAuthState, takeOAuthState } from '../services/oauthStateService.js';
import {
  integrationMocksEnabled,
  mockYoutubeSummary,
  mockInstagramSummary,
} from '../services/integrationMocks.js';

const clientOrigin = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const summaryMaxAgeMinutes = () =>
  Math.max(5, Number(process.env.INTEGRATION_SUMMARY_MAX_AGE_MINUTES) || 60);

function isCacheFresh(lastSyncedAt) {
  if (!lastSyncedAt) return false;
  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  return ageMs <= summaryMaxAgeMinutes() * 60 * 1000;
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

function redirectWithQuery(res, params) {
  const u = new URL(clientOrigin());
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') u.searchParams.set(k, v);
  }
  res.redirect(u.toString());
}

/** GET /api/integrations/youtube/start */
export async function youtubeStart(req, res) {
  try {
    if (!yt.youtubeOAuthConfigured()) {
      return res.status(503).json({
        error:
          'YouTube OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in server/.env.',
      });
    }
    const state = crypto.randomBytes(24).toString('hex');
    await saveOAuthState('youtube', state, req.session?.userId);
    req.session.oauthYoutubeState = state;
    await saveSession(req);
    res.redirect(yt.buildYoutubeAuthUrl(state));
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, { integration: 'youtube_err', msg: err.message || 'start_failed' });
  }
}

/** GET /api/integrations/youtube/callback */
export async function youtubeCallback(req, res) {
  const { code, state, error } = req.query;
  if (error) {
    return redirectWithQuery(res, { integration: 'youtube_err', msg: String(error) });
  }
  if (!code || !state) {
    return redirectWithQuery(res, { integration: 'youtube_err', msg: 'invalid_state' });
  }
  const stateUserId = await takeOAuthState('youtube', state);
  const sessionState = req.session?.oauthYoutubeState;
  if (!stateUserId && (!sessionState || state !== sessionState)) {
    return redirectWithQuery(res, { integration: 'youtube_err', msg: 'invalid_state' });
  }
  const userId = stateUserId || req.session?.userId;
  if (!userId) {
    return redirectWithQuery(res, {
      integration: 'youtube_err',
      msg: 'session_expired_login_again',
    });
  }
  if (req.session) delete req.session.oauthYoutubeState;

  try {
    const tokens = await yt.exchangeYoutubeCode(code);
    const refresh = tokens.refresh_token;
    if (!refresh) {
      return redirectWithQuery(res, {
        integration: 'youtube_err',
        msg: 'no_refresh_token_retry_with_prompt_consent',
      });
    }

    const { access_token: accessToken } = tokens;
    const channels = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then((r) => r.json());
    const ch = channels.items?.[0];
    const channelId = ch?.id || '';
    const channelTitle = ch?.snippet?.title || '';

    await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.youtube.refreshToken': refresh,
        'integrations.youtube.channelId': channelId,
        'integrations.youtube.channelTitle': channelTitle,
        'integrations.youtube.connectedAt': new Date(),
      },
    });
    if (req.session) {
      req.session.userId = userId;
    }
    await saveSession(req);
    redirectWithQuery(res, { integration: 'youtube_ok' });
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, { integration: 'youtube_err', msg: err.message || 'token_exchange' });
  }
}

/** GET /api/integrations/youtube/summary */
export async function youtubeSummary(req, res, next) {
  try {
    if (integrationMocksEnabled()) {
      return res.json({ connected: true, summary: mockYoutubeSummary() });
    }
    const user = await User.findById(req.session.userId).select('integrations.youtube').lean();
    const refresh = user?.integrations?.youtube?.refreshToken;
    if (!refresh) {
      return res.json({ connected: false, summary: null });
    }
    const summary = await yt.fetchYoutubeSummary(refresh);
    res.json({
      connected: true,
      summary: {
        ...summary,
        channelTitle: summary.channelTitle || user?.integrations?.youtube?.channelTitle,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/integrations/youtube */
export async function youtubeDisconnect(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.youtube.refreshToken': '',
        'integrations.youtube.channelId': '',
        'integrations.youtube.channelTitle': '',
        'integrations.youtube.connectedAt': null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/integrations/instagram/start */
export async function instagramStart(req, res) {
  try {
    if (!ig.instagramOAuthConfigured()) {
      return res.status(503).json({
        error:
          'Instagram OAuth is not configured. Set META_APP_ID, META_APP_SECRET, META_REDIRECT_URI in server/.env.',
      });
    }
    const state = crypto.randomBytes(24).toString('hex');
    await saveOAuthState('instagram', state, req.session?.userId);
    req.session.oauthInstagramState = state;
    await saveSession(req);
    res.redirect(ig.buildInstagramAuthUrl(state));
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, { integration: 'instagram_err', msg: err.message || 'start_failed' });
  }
}

/** GET /api/integrations/instagram/callback */
export async function instagramCallback(req, res) {
  const { code, state, error } = req.query;
  if (error) {
    return redirectWithQuery(res, { integration: 'instagram_err', msg: String(error) });
  }
  if (!code || !state) {
    return redirectWithQuery(res, { integration: 'instagram_err', msg: 'invalid_state' });
  }
  const stateUserId = await takeOAuthState('instagram', state);
  const sessionState = req.session?.oauthInstagramState;
  if (!stateUserId && (!sessionState || state !== sessionState)) {
    return redirectWithQuery(res, { integration: 'instagram_err', msg: 'invalid_state' });
  }
  const userId = stateUserId || req.session?.userId;
  if (!userId) {
    return redirectWithQuery(res, {
      integration: 'instagram_err',
      msg: 'session_expired_login_again',
    });
  }
  if (req.session) delete req.session.oauthInstagramState;

  try {
    const shortTok = await ig.exchangeFacebookCode(code);
    const longTok = await ig.exchangeForLongLivedUserToken(shortTok.access_token);
    const accessToken = longTok.access_token;
    const expiresIn = Number(longTok.expires_in) || 5184000;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    const resolved = await ig.resolveInstagramBusiness(accessToken);
    if (!resolved) {
      return redirectWithQuery(res, {
        integration: 'instagram_err',
        msg: 'no_instagram_business_account_link_page',
      });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.instagram.pageAccessToken': resolved.pageAccessToken,
        'integrations.instagram.igUserId': resolved.igUserId,
        'integrations.instagram.username': resolved.username,
        'integrations.instagram.tokenExpiresAt': tokenExpiresAt,
        'integrations.instagram.connectedAt': new Date(),
      },
    });
    if (req.session) {
      req.session.userId = userId;
    }
    await saveSession(req);
    redirectWithQuery(res, { integration: 'instagram_ok' });
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, {
      integration: 'instagram_err',
      msg: err.message || 'token_exchange',
    });
  }
}

/**
 * POST /api/integrations/instagram/manual
 * Page access token + Instagram User ID (same as OAuth stores). Validates by calling the Graph API.
 */
export async function instagramManualConnect(req, res, next) {
  try {
    const { pageAccessToken, igUserId } = req.body || {};
    if (!pageAccessToken || !igUserId) {
      return res.status(400).json({
        error: 'Send JSON { "pageAccessToken": "...", "igUserId": "..." } (from Meta Graph API).',
      });
    }
    const token = String(pageAccessToken).trim();
    const id = String(igUserId).trim();
    if (!token || !id) {
      return res.status(400).json({ error: 'pageAccessToken and igUserId must be non-empty.' });
    }

    ig.assertInstagramBusinessUserId(id);
    ig.assertManualTokenIsPageTokenForGraphApi(token);

    const summary = await ig.fetchInstagramSummary(token, id);

    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.instagram.pageAccessToken': token,
        'integrations.instagram.igUserId': id,
        'integrations.instagram.username': summary.username || '',
        'integrations.instagram.tokenExpiresAt': null,
        'integrations.instagram.connectedAt': new Date(),
      },
    });

    res.json({
      ok: true,
      summary: {
        ...summary,
        username: summary.username || '',
      },
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/integrations/instagram/from-user-token
 * User access token with pages_show_list + instagram_* — resolves Page + IG Business like OAuth callback.
 */
export async function instagramFromUserToken(req, res, next) {
  try {
    const { userAccessToken } = req.body || {};
    if (!userAccessToken) {
      return res.status(400).json({
        error:
          'Send JSON { "userAccessToken": "..." }. Token must include pages_show_list and instagram_basic (not public_profile alone).',
      });
    }
    const token = String(userAccessToken).trim();
    if (!token) {
      return res.status(400).json({ error: 'userAccessToken is empty.' });
    }

    const resolved = await ig.resolveInstagramBusiness(token);
    if (!resolved) {
      return res.status(400).json({
        error:
          'No Instagram Business/Creator account linked to a Facebook Page for this user token. Switch IG to Professional, link a Page, and generate a token with instagram_basic + pages_show_list — or use POST /instagram/manual with Page access token + IG User ID.',
      });
    }

    const summary = await ig.fetchInstagramSummary(resolved.pageAccessToken, resolved.igUserId);

    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.instagram.pageAccessToken': resolved.pageAccessToken,
        'integrations.instagram.igUserId': resolved.igUserId,
        'integrations.instagram.username': summary.username || resolved.username || '',
        'integrations.instagram.tokenExpiresAt': null,
        'integrations.instagram.connectedAt': new Date(),
      },
    });

    res.json({
      ok: true,
      summary: {
        ...summary,
        username: summary.username || resolved.username || '',
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/integrations/github/start */
export async function githubStart(req, res) {
  try {
    if (!gh.githubOAuthConfigured()) {
      return res.status(503).json({
        error:
          'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI in server/.env.',
      });
    }
    const state = crypto.randomBytes(24).toString('hex');
    await saveOAuthState('github', state, req.session?.userId);
    req.session.oauthGithubState = state;
    await saveSession(req);
    res.redirect(gh.buildGitHubAuthUrl(state));
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, { integration: 'github_err', msg: err.message || 'start_failed' });
  }
}

/** GET /api/integrations/github/callback */
export async function githubCallback(req, res) {
  const { code, state, error } = req.query;
  if (error) {
    return redirectWithQuery(res, { integration: 'github_err', msg: String(error) });
  }
  if (!code || !state) {
    return redirectWithQuery(res, { integration: 'github_err', msg: 'invalid_state' });
  }
  const stateUserId = await takeOAuthState('github', state);
  const sessionState = req.session?.oauthGithubState;
  if (!stateUserId && (!sessionState || state !== sessionState)) {
    return redirectWithQuery(res, { integration: 'github_err', msg: 'invalid_state' });
  }
  const userIdRaw = stateUserId || req.session?.userId;
  if (!userIdRaw) {
    return redirectWithQuery(res, {
      integration: 'github_err',
      msg: 'session_expired_login_again',
    });
  }
  if (!mongoose.Types.ObjectId.isValid(userIdRaw)) {
    return redirectWithQuery(res, { integration: 'github_err', msg: 'invalid_user' });
  }
  const userId = new mongoose.Types.ObjectId(userIdRaw);
  if (req.session) delete req.session.oauthGithubState;

  try {
    const tokenData = await gh.exchangeGitHubCode(code);
    const token = String(tokenData.access_token || '');
    if (!token) {
      return redirectWithQuery(res, { integration: 'github_err', msg: 'no_access_token' });
    }
    const summary = await gh.fetchGitHubSummary(token);
    const updated = await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.github.personalAccessToken': token,
        'integrations.github.username': summary.username || '',
        'integrations.github.connectedAt': new Date(),
        'integrations.github.lastSummary': summary,
        'integrations.github.lastSyncedAt': new Date(),
      },
    });
    if (!updated) {
      return redirectWithQuery(res, { integration: 'github_err', msg: 'user_not_found' });
    }
    await saveSnapshot(userId, 'github', summary);
    if (req.session) {
      req.session.userId = userId.toString();
    }
    await saveSession(req);
    redirectWithQuery(res, { integration: 'github_ok' });
  } catch (err) {
    console.error(err);
    redirectWithQuery(res, { integration: 'github_err', msg: err.message || 'token_exchange' });
  }
}

/** GET /api/integrations/instagram/summary */
export async function instagramSummary(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select('integrations.instagram').lean();
    const inst = user?.integrations?.instagram;
    const token = inst?.pageAccessToken;
    const igUserId = inst?.igUserId;
    if (!token || !igUserId) {
      return res.json({ connected: false, summary: null });
    }
    const summary = await ig.fetchInstagramSummary(token, igUserId);
    res.json({
      connected: true,
      summary: {
        ...summary,
        username: summary.username || inst.username,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/integrations/instagram */
export async function instagramDisconnect(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.instagram.pageAccessToken': '',
        'integrations.instagram.igUserId': '',
        'integrations.instagram.username': '',
        'integrations.instagram.tokenExpiresAt': null,
        'integrations.instagram.connectedAt': null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/integrations/status */
export async function integrationsStatus(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select('integrations').lean();
    const i = user?.integrations || {};
    res.json({
      config: {
        youtubeOAuth: yt.youtubeOAuthConfigured(),
        instagramOAuth: ig.instagramOAuthConfigured(),
        githubOAuth: gh.githubOAuthConfigured(),
      },
      youtube: {
        connected: Boolean(i.youtube?.refreshToken),
        channelTitle: i.youtube?.channelTitle || '',
        connectedAt: i.youtube?.connectedAt || null,
      },
      instagram: {
        connected: Boolean(i.instagram?.pageAccessToken && i.instagram?.igUserId),
        username: i.instagram?.username || '',
        tokenExpiresAt: i.instagram?.tokenExpiresAt || null,
        connectedAt: i.instagram?.connectedAt || null,
      },
      github: {
        connected: Boolean(
          i.github?.personalAccessToken && String(i.github.personalAccessToken).trim()
        ),
        username: i.github?.username || '',
        connectedAt: i.github?.connectedAt || null,
        lastSyncedAt: i.github?.lastSyncedAt || null,
      },
      wakatime: {
        connected: Boolean(i.wakatime?.apiKey),
        connectedAt: i.wakatime?.connectedAt || null,
        lastSyncedAt: i.wakatime?.lastSyncedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/integrations/github/connect */
export async function githubConnect(req, res, next) {
  try {
    const token = String(req.body?.personalAccessToken || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'personalAccessToken is required.' });
    }
    if (!/^(gh[pousr]_|github_pat_)/i.test(token)) {
      return res.status(400).json({
        error:
          'GitHub token looks invalid. Use a Personal Access Token (typically starts with ghp_, github_pat_, gho_, ghu_, or ghs_).',
      });
    }
    const summary = await gh.fetchGitHubSummary(token);
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.github.personalAccessToken': token,
        'integrations.github.username': summary.username || '',
        'integrations.github.connectedAt': new Date(),
        'integrations.github.lastSummary': summary,
        'integrations.github.lastSyncedAt': new Date(),
      },
    });
    await saveSnapshot(req.session.userId, 'github', summary);
    res.json({ ok: true, summary });
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return res.status(400).json({
        error:
          'GitHub rejected this token. Ensure it is valid and has permission to read your user/events data.',
      });
    }
    next(err);
  }
}

/** GET /api/integrations/github/summary */
export async function githubSummary(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select('integrations.github');
    const token = user?.integrations?.github?.personalAccessToken;
    if (!token) {
      return res.json({ connected: false, summary: null });
    }
    const forceRefresh = String(req.query?.refresh || '') === '1';
    const cached = user?.integrations?.github?.lastSummary;
    const fresh = isCacheFresh(user?.integrations?.github?.lastSyncedAt);
    if (!forceRefresh && cached && fresh) {
      return res.json({ connected: true, summary: cached, stale: false, cached: true });
    }
    try {
      const summary = await gh.fetchGitHubSummary(token);
      const normalized = {
        ...summary,
        username: summary.username || user?.integrations?.github?.username || '',
      };
      user.integrations.github.lastSummary = normalized;
      user.integrations.github.lastSyncedAt = new Date();
      await user.save();
      await saveSnapshot(req.session.userId, 'github', normalized);
      return res.json({ connected: true, summary: normalized, stale: false, cached: false });
    } catch (liveErr) {
      if (cached) {
        return res.json({ connected: true, summary: cached, stale: true, cached: true });
      }
      throw liveErr;
    }
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/integrations/github */
export async function githubDisconnect(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.github.personalAccessToken': '',
        'integrations.github.username': '',
        'integrations.github.connectedAt': null,
        'integrations.github.lastSummary': null,
        'integrations.github.lastSyncedAt': null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/integrations/wakatime/connect */
export async function wakatimeConnect(req, res, next) {
  try {
    const apiKey = String(req.body?.apiKey || '').trim();
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required.' });
    }
    if (!/^waka_/i.test(apiKey)) {
      return res.status(400).json({ error: 'WakaTime API key looks invalid (should start with waka_).' });
    }
    const summary = await wt.fetchWakaTimeSummary(apiKey);
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.wakatime.apiKey': apiKey,
        'integrations.wakatime.connectedAt': new Date(),
        'integrations.wakatime.lastSummary': summary,
        'integrations.wakatime.lastSyncedAt': new Date(),
      },
    });
    await saveSnapshot(req.session.userId, 'wakatime', summary);
    res.json({ ok: true, summary });
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return res.status(400).json({ error: 'WakaTime rejected this API key.' });
    }
    next(err);
  }
}

/** GET /api/integrations/wakatime/summary */
export async function wakatimeSummary(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select('integrations.wakatime');
    const apiKey = user?.integrations?.wakatime?.apiKey;
    if (!apiKey) {
      return res.json({ connected: false, summary: null });
    }
    const forceRefresh = String(req.query?.refresh || '') === '1';
    const cached = user?.integrations?.wakatime?.lastSummary;
    const fresh = isCacheFresh(user?.integrations?.wakatime?.lastSyncedAt);
    if (!forceRefresh && cached && fresh) {
      return res.json({ connected: true, summary: cached, stale: false, cached: true });
    }
    try {
      const summary = await wt.fetchWakaTimeSummary(apiKey);
      user.integrations.wakatime.lastSummary = summary;
      user.integrations.wakatime.lastSyncedAt = new Date();
      await user.save();
      await saveSnapshot(req.session.userId, 'wakatime', summary);
      return res.json({ connected: true, summary, stale: false, cached: false });
    } catch (liveErr) {
      if (cached) {
        return res.json({ connected: true, summary: cached, stale: true, cached: true });
      }
      throw liveErr;
    }
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/integrations/wakatime */
export async function wakatimeDisconnect(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.wakatime.apiKey': '',
        'integrations.wakatime.connectedAt': null,
        'integrations.wakatime.lastSummary': null,
        'integrations.wakatime.lastSyncedAt': null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/integrations/trends/:platform */
export async function integrationTrends(req, res, next) {
  try {
    const platform = String(req.params.platform || '').toLowerCase();
    const allowed = new Set(['github', 'wakatime', 'instagram', 'youtube']);
    if (!allowed.has(platform)) {
      return res.status(400).json({ error: 'Unsupported platform. Use github, wakatime, instagram, or youtube.' });
    }
    const days = Number(req.query.days || 7);
    const snapshots = await getSnapshots(req.session.userId, platform, days);
    res.json({
      success: true,
      platform,
      days: Math.max(1, Math.min(180, Number(days) || 7)),
      data: snapshots,
    });
  } catch (err) {
    next(err);
  }
}

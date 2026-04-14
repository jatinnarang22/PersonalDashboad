import crypto from 'node:crypto';
import { User } from '../models/User.js';
import * as yt from '../services/youtubeIntegrationService.js';
import * as ig from '../services/instagramIntegrationService.js';
import {
  integrationMocksEnabled,
  mockYoutubeSummary,
  mockInstagramSummary,
} from '../services/integrationMocks.js';

const clientOrigin = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';

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
  if (!req.session?.userId) {
    return redirectWithQuery(res, {
      integration: 'youtube_err',
      msg: 'session_expired_login_again',
    });
  }
  if (!code || state !== req.session.oauthYoutubeState) {
    return redirectWithQuery(res, { integration: 'youtube_err', msg: 'invalid_state' });
  }
  delete req.session.oauthYoutubeState;

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

    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.youtube.refreshToken': refresh,
        'integrations.youtube.channelId': channelId,
        'integrations.youtube.channelTitle': channelTitle,
        'integrations.youtube.connectedAt': new Date(),
      },
    });
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
  if (!req.session?.userId) {
    return redirectWithQuery(res, {
      integration: 'instagram_err',
      msg: 'session_expired_login_again',
    });
  }
  if (!code || state !== req.session.oauthInstagramState) {
    return redirectWithQuery(res, { integration: 'instagram_err', msg: 'invalid_state' });
  }
  delete req.session.oauthInstagramState;

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

    await User.findByIdAndUpdate(req.session.userId, {
      $set: {
        'integrations.instagram.pageAccessToken': resolved.pageAccessToken,
        'integrations.instagram.igUserId': resolved.igUserId,
        'integrations.instagram.username': resolved.username,
        'integrations.instagram.tokenExpiresAt': tokenExpiresAt,
        'integrations.instagram.connectedAt': new Date(),
      },
    });
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
      },
      youtube: {
        connected: Boolean(i.youtube?.refreshToken),
        channelTitle: i.youtube?.channelTitle || '',
      },
      instagram: {
        connected: Boolean(i.instagram?.pageAccessToken && i.instagram?.igUserId),
        username: i.instagram?.username || '',
      },
    });
  } catch (err) {
    next(err);
  }
}

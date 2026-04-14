/** Keep in sync with Graph API Explorer tests (v21 was fine; v25 matches current Explorer default). */
const FB_GRAPH = 'https://graph.facebook.com/v25.0';
const FB_DIALOG = 'https://www.facebook.com/v25.0/dialog/oauth';

/** Instagram Graph API requires a Professional (Business/Creator) IG linked to a Facebook Page. */
const IG_SCOPES = [
  'pages_show_list',
  'instagram_basic',
  'instagram_manage_insights',
].join(',');

export function instagramOAuthConfigured() {
  return Boolean(
    process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI
  );
}

export function buildInstagramAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    state,
    response_type: 'code',
    scope: IG_SCOPES,
  });
  return `${FB_DIALOG}?${params.toString()}`;
}

async function fbGet(path, token) {
  const url = new URL(`${FB_GRAPH}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('access_token', token);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error;
    const base = e?.message || e?.error_user_msg || e?.type || res.statusText || 'Graph API error';
    const code = e?.code != null ? ` [Meta ${e.code}${e.error_subcode != null ? `/${e.error_subcode}` : ''}]` : '';
    let hint = '';
    if (/not found|does not exist|cannot be loaded/i.test(String(base)) || e?.code === 100) {
      hint =
        ' Regenerate a fresh Page token ({your-page-id}?fields=access_token), confirm instagram_business_account.id matches, and paste the full EAA token (tokens expire in about an hour).';
    }
    throw new Error(`${base}${code}.${hint}`);
  }
  return data;
}

export async function exchangeFacebookCode(code) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    client_secret: process.env.META_APP_SECRET,
    code,
  });
  const res = await fetch(`${FB_GRAPH}/oauth/access_token?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error?.message || data.error?.type || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export async function exchangeForLongLivedUserToken(shortLivedToken) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(`${FB_GRAPH}/oauth/access_token?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error?.message || data.error?.type || res.statusText;
    throw new Error(msg);
  }
  return data;
}

/**
 * Find first Facebook Page with a linked Instagram Business account.
 */
const ACCOUNTS_FIELDS = encodeURIComponent(
  'name,instagram_business_account{id,username,profile_picture_url},access_token'
);

export async function resolveInstagramBusiness(longLivedUserToken) {
  const accounts = await fbGet(`/me/accounts?fields=${ACCOUNTS_FIELDS}`, longLivedUserToken);

  const pages = accounts.data || [];
  for (const page of pages) {
    const ig = page.instagram_business_account;
    if (ig?.id && page.access_token) {
      return {
        pageAccessToken: page.access_token,
        igUserId: ig.id,
        username: ig.username || '',
        pageName: page.name || '',
      };
    }
  }

  return null;
}

/**
 * Facebook Graph calls here need a **Page access token** (from `/{page-id}?fields=access_token`
 * or `me/accounts`). Meta’s “Generate token” in the Instagram product UI often yields tokens
 * starting with `IG…` — those are not valid for `graph.facebook.com/{ig-user-id}` in this app.
 */
/** Instagram Business user id in Graph API is numeric (e.g. 17841407995283128), not an email. */
export function assertInstagramBusinessUserId(id) {
  const s = String(id || '').trim();
  if (!/^\d{8,30}$/.test(s)) {
    const e = new Error(
      'igUserId must be the numeric Instagram Business account id (from Graph API, e.g. 17841407995283128). Do not paste your email or @username here.'
    );
    e.statusCode = 400;
    throw e;
  }
}

export function assertManualTokenIsPageTokenForGraphApi(token) {
  const t = String(token || '').trim();
  if (!t) {
    const e = new Error('pageAccessToken is empty');
    e.statusCode = 400;
    throw e;
  }
  if (t.includes('@') || !/^EAA[a-zA-Z0-9_-]{50,}$/.test(t)) {
    // Page/user OAuth tokens from Meta are long; passwords and emails fail here
    const e = new Error(
      'pageAccessToken must be a Facebook Page access token from Graph API (long string starting with EAA…). It is not your Instagram password, email, or app password.'
    );
    e.statusCode = 400;
    throw e;
  }
  if (/^IG[A-Za-z0-9_-]/i.test(t)) {
    const e = new Error(
      'This token looks like an Instagram-product token (starts with IG…). Use a Facebook Page access token instead (usually starts with EAA…). In Graph API Explorer, with pages_show_list + instagram_basic, run: {your-page-id}?fields=access_token — then paste that value here.'
    );
    e.statusCode = 400;
    throw e;
  }
}

const PROFILE_FIELDS = encodeURIComponent(
  'username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website'
);
const MEDIA_FIELDS = encodeURIComponent(
  'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url'
);

export async function fetchInstagramSummary(pageAccessToken, igUserId) {
  const profile = await fbGet(`/${igUserId}?fields=${PROFILE_FIELDS}`, pageAccessToken);

  const mediaRes = await fbGet(
    `/${igUserId}/media?fields=${MEDIA_FIELDS}&limit=6`,
    pageAccessToken
  );

  const media = (mediaRes.data || []).map((m) => ({
    id: m.id,
    caption: m.caption ? String(m.caption).slice(0, 280) : '',
    mediaType: m.media_type,
    mediaUrl: m.media_url || '',
    thumbnailUrl: m.thumbnail_url || '',
    permalink: m.permalink,
    timestamp: m.timestamp,
  }));

  return {
    username: profile.username || '',
    name: profile.name || '',
    biography: profile.biography || '',
    website: profile.website || '',
    followersCount: profile.followers_count ?? null,
    followsCount: profile.follows_count ?? null,
    mediaCount: profile.media_count ?? null,
    profilePictureUrl: profile.profile_picture_url || null,
    recentMedia: media,
    note:
      'Personal Instagram accounts are not supported by the Instagram Graph API. Use a Creator or Business account linked to a Facebook Page.',
  };
}

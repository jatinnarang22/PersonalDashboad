const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const YT_API = 'https://www.googleapis.com/youtube/v3';

const YOUTUBE_READONLY = 'https://www.googleapis.com/auth/youtube.readonly';

export function youtubeOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildYoutubeAuthUrl(state) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_READONLY,
    state,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

async function postForm(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error_description || data.error || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export async function exchangeYoutubeCode(code) {
  return postForm(GOOGLE_TOKEN, {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
}

export async function refreshYoutubeAccessToken(refreshToken) {
  return postForm(GOOGLE_TOKEN, {
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
}

async function ytGet(path, accessToken, searchParams) {
  const url = new URL(`${YT_API}${path}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error?.message || data.error || res.statusText;
    throw new Error(err);
  }
  return data;
}

/**
 * Channel info, subscriber count, and a sample of liked videos (YouTube Premium does not unlock extra Data API fields).
 */
export async function fetchYoutubeSummary(refreshToken) {
  const { access_token: accessToken } = await refreshYoutubeAccessToken(refreshToken);

  const channels = await ytGet('/channels', accessToken, {
    part: 'snippet,statistics,contentDetails',
    mine: 'true',
  });

  const item = channels.items?.[0];
  if (!item) {
    return {
      channelTitle: '',
      channelId: '',
      subscriberCount: null,
      videoCount: null,
      likesPlaylistId: null,
      likedVideos: [],
      note:
        'No YouTube channel found for this Google account (brand accounts may need different OAuth).',
    };
  }

  const likesId = item.contentDetails?.relatedPlaylists?.likes;
  let likedVideos = [];
  if (likesId) {
    const liked = await ytGet('/playlistItems', accessToken, {
      part: 'snippet,contentDetails',
      playlistId: likesId,
      maxResults: '8',
    });
    likedVideos = (liked.items || []).map((row) => ({
      title: row.snippet?.title,
      videoId: row.contentDetails?.videoId || row.snippet?.resourceId?.videoId,
      publishedAt: row.snippet?.publishedAt,
    }));
  }

  return {
    channelTitle: item.snippet?.title || '',
    channelId: item.id || '',
    subscriberCount: item.statistics?.subscriberCount ?? null,
    videoCount: item.statistics?.videoCount ?? null,
    likesPlaylistId: likesId || null,
    likedVideos,
    note:
      'Watch history is not available via the YouTube Data API. Liked videos and playlists are shown when you grant youtube.readonly.',
  };
}

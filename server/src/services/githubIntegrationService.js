const GH_API = 'https://api.github.com';
const GH_OAUTH = 'https://github.com/login/oauth';

function ghEnv(name) {
  return String(process.env[name] ?? '').trim();
}

function authHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'personal-dashboard',
  };
}

async function ghGet(path, token) {
  const res = await fetch(`${GH_API}${path}`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || res.statusText || 'GitHub API error';
    const err = new Error(msg);
    err.statusCode = res.status;
    throw err;
  }
  return data;
}

export function githubOAuthConfigured() {
  return Boolean(ghEnv('GITHUB_CLIENT_ID') && ghEnv('GITHUB_CLIENT_SECRET') && ghEnv('GITHUB_REDIRECT_URI'));
}

export function buildGitHubAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: ghEnv('GITHUB_CLIENT_ID'),
    redirect_uri: ghEnv('GITHUB_REDIRECT_URI'),
    state,
    scope: 'read:user repo',
  });
  return `${GH_OAUTH}/authorize?${params.toString()}`;
}

function parseOAuthTokenBody(text) {
  const s = String(text || '').trim();
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    try {
      return Object.fromEntries(new URLSearchParams(s));
    } catch {
      return { error: 'parse_error', error_description: s.slice(0, 200) };
    }
  }
}

const GITHUB_OAUTH_ERRORS = {
  bad_verification_code:
    'GitHub authorization code expired or already used — go back and click Connect GitHub again.',
  redirect_uri_mismatch:
    'Redirect URI mismatch: GitHub OAuth app callback URL must exactly match GITHUB_REDIRECT_URI in server/.env.',
  incorrect_client_credentials:
    'Invalid GitHub OAuth credentials — check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
};

export async function exchangeGitHubCode(code) {
  const body = new URLSearchParams({
    client_id: ghEnv('GITHUB_CLIENT_ID'),
    client_secret: ghEnv('GITHUB_CLIENT_SECRET'),
    code,
    redirect_uri: ghEnv('GITHUB_REDIRECT_URI'),
  });
  const res = await fetch(`${GH_OAUTH}/access_token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'personal-dashboard',
    },
    body: body.toString(),
  });
  const raw = await res.text();
  const data = parseOAuthTokenBody(raw);
  if (!res.ok || data.error) {
    const mapped =
      data.error && GITHUB_OAUTH_ERRORS[data.error]
        ? GITHUB_OAUTH_ERRORS[data.error]
        : null;
    const msg =
      mapped ||
      data.error_description ||
      data.error ||
      (!res.ok ? res.statusText : '') ||
      'GitHub token exchange failed';
    const err = new Error(msg);
    err.statusCode = res.status || 500;
    throw err;
  }
  return data;
}

export async function resolveGitHubIdentity(token) {
  const me = await ghGet('/user', token);
  return {
    username: me?.login || '',
    name: me?.name || '',
    avatarUrl: me?.avatar_url || '',
    profileUrl: me?.html_url || '',
    followers: me?.followers ?? null,
    following: me?.following ?? null,
    publicRepos: me?.public_repos ?? null,
  };
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function fetchGitHubSummary(token) {
  const me = await resolveGitHubIdentity(token);
  let events = [];
  if (me.username) {
    try {
      events = await ghGet(`/users/${encodeURIComponent(me.username)}/events?per_page=100`, token);
    } catch (err) {
      // Some accounts/tokens may not return this feed; fallback to public events.
      try {
        events = await ghGet(
          `/users/${encodeURIComponent(me.username)}/events/public?per_page=100`,
          token
        );
      } catch {
        events = [];
      }
    }
  }
  const since = Date.parse(dateDaysAgo(7));

  const recentEvents = Array.isArray(events)
    ? events.filter((e) => Date.parse(e?.created_at || 0) >= since)
    : [];

  const commitEvents = recentEvents.filter((e) => e?.type === 'PushEvent');
  const commitsLast7Days = commitEvents.reduce(
    (sum, e) => sum + (Array.isArray(e?.payload?.commits) ? e.payload.commits.length : 0),
    0
  );

  const repoCounts = new Map();
  for (const ev of recentEvents) {
    const name = ev?.repo?.name;
    if (!name) continue;
    repoCounts.set(name, (repoCounts.get(name) || 0) + 1);
  }
  const topRepos = [...repoCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, events: count }));

  return {
    ...me,
    commitsLast7Days,
    eventsLast7Days: recentEvents.length,
    topRepos,
    note: 'Uses recent GitHub events and PushEvent commits from the last 7 days.',
  };
}

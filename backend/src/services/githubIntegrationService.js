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
    'Redirect URI mismatch: GitHub OAuth app callback URL must exactly match GITHUB_REDIRECT_URI in backend/.env.',
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

/** Authenticated feed includes private activity when the token has repo scope. */
async function fetchUserEventsList(token, perPage = 100) {
  try {
    const data = await ghGet(`/user/events?per_page=${perPage}`, token);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchPublicUserEvents(username, token, perPage = 100) {
  if (!username) return [];
  try {
    return await ghGet(`/users/${encodeURIComponent(username)}/events?per_page=${perPage}`, token);
  } catch {
    try {
      return await ghGet(
        `/users/${encodeURIComponent(username)}/events/public?per_page=${perPage}`,
        token
      );
    } catch {
      return [];
    }
  }
}

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar {
    viewer {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

async function ghGraphql(query, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'personal-dashboard',
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.message || res.statusText || 'GitHub GraphQL error';
    const err = new Error(msg);
    err.statusCode = res.status;
    throw err;
  }
  if (body.errors?.length) {
    const err = new Error(body.errors.map((e) => e.message).join('; ') || 'GraphQL error');
    err.statusCode = 422;
    throw err;
  }
  return body.data;
}

export async function fetchContributionCalendar(token) {
  const data = await ghGraphql(CONTRIBUTION_CALENDAR_QUERY, token);
  const cal = data?.viewer?.contributionsCollection?.contributionCalendar;
  if (!cal) return null;
  return {
    totalContributions: cal.totalContributions ?? 0,
    weeks: Array.isArray(cal.weeks) ? cal.weeks : [],
  };
}

function summarizeEvent(ev) {
  const type = ev?.type || 'UnknownEvent';
  const repo = ev?.repo?.name || '';
  const createdAt = ev?.created_at || '';
  const apiRepo = ev?.repo?.url;
  const url = apiRepo
    ? apiRepo.replace(/^https:\/\/api\.github\.com\/repos\//i, 'https://github.com/')
    : repo
      ? `https://github.com/${repo}`
      : '';
  let title = type.replace(/Event$/, '');
  const payload = ev?.payload || {};

  if (type === 'PushEvent') {
    const n = Array.isArray(payload.commits) ? payload.commits.length : 0;
    const ref = payload.ref?.replace('refs/heads/', '') || '';
    title = `Push ${n} commit${n === 1 ? '' : 's'}${ref ? ` to ${ref}` : ''}`;
  } else if (type === 'PullRequestEvent') {
    const action = payload.action || '';
    const pr = payload.pull_request;
    title = `Pull request ${action}${pr?.title ? `: ${pr.title}` : ''}`;
  } else if (type === 'IssuesEvent') {
    title = `Issue ${payload.action || ''}${payload.issue?.title ? `: ${payload.issue.title}` : ''}`;
  } else if (type === 'CreateEvent') {
    title = `Created ${payload.ref_type || 'ref'} ${payload.ref || ''}`.trim();
  } else if (type === 'WatchEvent') {
    title = `Starred ${repo}`;
  } else if (type === 'ForkEvent') {
    title = `Forked ${repo}`;
  } else if (type === 'ReleaseEvent') {
    title = `Release ${payload.action || ''}: ${payload.release?.name || payload.release?.tag_name || ''}`;
  }

  return {
    id: String(ev?.id ?? `${type}-${createdAt}-${repo}`),
    type,
    repo,
    createdAt,
    title,
    url,
  };
}

export async function fetchGitHubSummary(token) {
  const me = await resolveGitHubIdentity(token);
  let events = await fetchUserEventsList(token, 100);
  if (!events.length && me.username) {
    events = await fetchPublicUserEvents(me.username, token, 100);
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
    note: 'Uses your authenticated event feed when available (includes private repos with appropriate token scopes), else public events. Commits counted from PushEvent payloads in the last 7 days.',
  };
}

/**
 * Rich payload for the GitHub workspace: summary, contribution heatmap (GraphQL), recent events.
 */
export async function fetchGitHubActivity(token) {
  const summary = await fetchGitHubSummary(token);
  let contributionCalendar = null;
  let contributionError = null;
  try {
    contributionCalendar = await fetchContributionCalendar(token);
  } catch (err) {
    contributionError = err.message || 'Contribution calendar unavailable';
  }

  let rawEvents = await fetchUserEventsList(token, 100);
  if (!rawEvents.length && summary.username) {
    rawEvents = await fetchPublicUserEvents(summary.username, token, 100);
  }
  const recentEvents = (Array.isArray(rawEvents) ? rawEvents : []).slice(0, 80).map(summarizeEvent);

  return {
    summary,
    contributionCalendar,
    contributionError,
    recentEvents,
  };
}

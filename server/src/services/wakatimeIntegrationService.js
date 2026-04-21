const WT_API = 'https://wakatime.com/api/v1';

function authHeaders(apiKey) {
  const token = Buffer.from(apiKey).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
    'User-Agent': 'personal-dashboard',
  };
}

async function wtGet(path, apiKey) {
  const res = await fetch(`${WT_API}${path}`, {
    headers: authHeaders(apiKey),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText || 'WakaTime API error';
    const err = new Error(msg);
    err.statusCode = res.status;
    throw err;
  }
  return data;
}

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function compactList(items = [], key = 'name') {
  return (Array.isArray(items) ? items : [])
    .map((x) => ({
      name: x?.[key] || '',
      text: x?.text || '',
      totalSeconds: x?.total_seconds ?? null,
      percent: x?.percent ?? null,
    }))
    .filter((x) => x.name)
    .slice(0, 5);
}

export async function fetchWakaTimeSummary(apiKey) {
  const start = isoDateDaysAgo(6);
  const end = isoDateDaysAgo(0);
  const payload = await wtGet(`/users/current/summaries?start=${start}&end=${end}`, apiKey);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const last = rows[rows.length - 1] || null;

  const totalSeconds7d = rows.reduce(
    (sum, row) => sum + (row?.grand_total?.total_seconds || 0),
    0
  );

  const daily = rows.map((row) => ({
    date: row?.range?.date || '',
    seconds: row?.grand_total?.total_seconds || 0,
    text: row?.grand_total?.text || '0 secs',
  }));

  return {
    range: { start, end },
    daysTracked: rows.length,
    totalSeconds7d,
    totalText7d: payload?.cumulative_total?.text || '',
    todayText: last?.grand_total?.text || '0 secs',
    todaySeconds: last?.grand_total?.total_seconds ?? 0,
    daily,
    languagesToday: compactList(last?.languages, 'name'),
    projectsToday: compactList(last?.projects, 'name'),
    note: 'Data comes from WakaTime daily summaries.',
  };
}

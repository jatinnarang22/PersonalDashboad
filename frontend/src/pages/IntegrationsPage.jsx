import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { integrationsApi, integrationOAuthStartUrl } from '../services/api.js';

function fmtDate(iso) {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleString();
}

function daysUntil(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

function humanizeOAuthError(raw) {
  if (!raw) return 'Connection failed. Please try again.';
  if (raw === 'invalid_state') return 'Connection failed: invalid session state. Please retry.';
  if (raw === 'session_expired_login_again') return 'Session expired. Please login again and reconnect.';
  if (raw === 'no_access_token') return 'GitHub did not return an access token.';
  return decodeURIComponent(String(raw).replace(/\+/g, ' '));
}

function applyOAuthResultFromQuery(setBanner, setError) {
  const params = new URLSearchParams(window.location.search);
  const integration = params.get('integration');
  const msg = params.get('msg');
  if (!integration) return;

  if (integration === 'github_ok') {
    setBanner('GitHub app connected successfully.');
    setError('');
  } else if (integration === 'github_err') {
    setBanner('');
    setError(`GitHub connection failed: ${humanizeOAuthError(msg)}`);
  }

  params.delete('integration');
  params.delete('msg');
  const next = params.toString();
  const cleanUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash || ''}`;
  window.history.replaceState({}, '', cleanUrl);
}

function BrandIconYoutube() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z" />
    </svg>
  );
}

function BrandIconInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BrandIconGithub() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.3.8-4-1.4-4-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 2.1.8 2.6 1.5.3-.8.6-1.3 1.1-1.6-2.6-.3-5.4-1.3-5.4-6A4.7 4.7 0 0 1 5 7.7a4.4 4.4 0 0 1 .1-3.3s1-.3 3.4 1.3a11.8 11.8 0 0 1 6.1 0C17 4 18 4.4 18 4.4a4.4 4.4 0 0 1 .1 3.3 4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .6.5 1.2 1.4 1.2 2.9v3.4c0 .4.2.7.8.6A12 12 0 0 0 12 .5z" />
    </svg>
  );
}

function BrandIconWakatime() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 6h4l2 12H6L4 6zm8 0h4l2 12h-4L12 6zm8 0h2l-2 12h-2l2-12z" />
    </svg>
  );
}

function cardWorkspacePath(key) {
  return key === 'github' ? '/integrations/github' : `/integrations/${key}`;
}

function CardBrandIcon({ cardKey }) {
  if (cardKey === 'youtube') return <BrandIconYoutube />;
  if (cardKey === 'instagram') return <BrandIconInstagram />;
  if (cardKey === 'github') return <BrandIconGithub />;
  return <BrandIconWakatime />;
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [status, setStatus] = useState(null);
  const [ghSummary, setGhSummary] = useState(null);
  const [wtSummary, setWtSummary] = useState(null);
  const [igSummary, setIgSummary] = useState(null);

  const [ghToken, setGhToken] = useState('');
  const [wtApiKey, setWtApiKey] = useState('');
  const [igPageToken, setIgPageToken] = useState('');
  const [igUserId, setIgUserId] = useState('');

  const [ghBusy, setGhBusy] = useState(false);
  const [wtBusy, setWtBusy] = useState(false);
  const [igBusy, setIgBusy] = useState(false);
  const [showInstagramAdvanced, setShowInstagramAdvanced] = useState(false);

  const [showReconnect, setShowReconnect] = useState({
    github: false,
    wakatime: false,
    instagram: false,
  });

  const instagramExpiry = useMemo(() => {
    const days = daysUntil(status?.instagram?.tokenExpiresAt);
    const date = status?.instagram?.tokenExpiresAt;
    if (days == null || !status?.instagram?.connected) return null;
    return {
      days,
      date,
      expired: days <= 0,
      soon: days > 0 && days <= 14,
    };
  }, [status]);

  const instagramOAuthReady = Boolean(status?.config?.instagramOAuth);
  const githubOAuthReady = Boolean(status?.config?.githubOAuth);

  const cards = useMemo(() => {
    const s = status || {};
    const ig = instagramExpiry;
    return [
      {
        key: 'youtube',
        title: 'YouTube',
        icon: '▶',
        connected: Boolean(s.youtube?.connected),
        subtitle: s.youtube?.connected ? s.youtube.channelTitle || 'Connected' : 'Not connected',
        meta: `Connected at: ${fmtDate(s.youtube?.connectedAt)}`,
        warning: '',
      },
      {
        key: 'instagram',
        title: 'Instagram',
        icon: '◉',
        connected: Boolean(s.instagram?.connected),
        subtitle: s.instagram?.connected
          ? s.instagram.username
            ? `@${s.instagram.username}`
            : 'Connected'
          : 'Not connected',
        meta: `Token expiry: ${fmtDate(s.instagram?.tokenExpiresAt)}`,
        warning: ig?.expired
          ? 'Token expired - reconnect required'
          : ig?.soon
            ? `Token expires in ${ig.days} day${ig.days === 1 ? '' : 's'}`
            : '',
      },
      {
        key: 'github',
        title: 'GitHub',
        icon: '◆',
        connected: Boolean(s.github?.connected),
        subtitle: s.github?.connected ? s.github.username || 'Connected' : 'Not connected',
        meta: `Last sync: ${fmtDate(s.github?.lastSyncedAt)}`,
        warning: '',
      },
      {
        key: 'wakatime',
        title: 'WakaTime',
        icon: '◌',
        connected: Boolean(s.wakatime?.connected),
        subtitle: s.wakatime?.connected ? wtSummary?.todayText || 'Connected' : 'Not connected',
        meta: `Last sync: ${fmtDate(s.wakatime?.lastSyncedAt)}`,
        warning: '',
      },
    ];
  }, [status, instagramExpiry, wtSummary]);

  const connectedCount = cards.filter((c) => c.connected).length;
  const integrationHealth = cards.length ? Math.round((connectedCount / cards.length) * 100) : 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGhSummary(null);
      setWtSummary(null);
      setIgSummary(null);

      let fetchedGhSummary = null;
      let { data } = await integrationsApi.status();
      if (!data.github?.connected) {
        try {
          const gh = await integrationsApi.githubSummary();
          if (gh.data?.connected && gh.data?.summary) {
            data = {
              ...data,
              github: {
                ...data.github,
                connected: true,
                username: gh.data.summary.username || data.github?.username || '',
              },
            };
            fetchedGhSummary = gh.data.summary;
          }
        } catch {
          /* keep status */
        }
      }
      setStatus(data);
      if (data.github?.connected && !fetchedGhSummary) {
        try {
          fetchedGhSummary = (await integrationsApi.githubSummary()).data.summary;
        } catch {
          fetchedGhSummary = null;
        }
      }
      setGhSummary(fetchedGhSummary);
      if (data.wakatime?.connected) {
        setWtSummary((await integrationsApi.wakatimeSummary()).data.summary);
      }
      if (data.instagram?.connected) {
        try {
          setIgSummary((await integrationsApi.instagramSummary()).data.summary);
        } catch {
          setIgSummary(null);
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not load integrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyOAuthResultFromQuery(setBanner, setError);
    load();
  }, [load]);

  function connectYoutube() {
    window.location.href = integrationOAuthStartUrl('youtube');
  }

  function connectInstagram() {
    window.location.href = integrationOAuthStartUrl('instagram');
  }

  function connectGithubOAuth() {
    window.location.href = integrationOAuthStartUrl('github');
  }

  async function disconnectYoutube() {
    await integrationsApi.youtubeDisconnect();
    await load();
  }

  async function disconnectInstagram() {
    await integrationsApi.instagramDisconnect();
    await load();
  }

  async function connectGithub() {
    setGhBusy(true);
    try {
      await integrationsApi.githubConnect({ personalAccessToken: ghToken.trim() });
      setGhToken('');
      setBanner('GitHub connected.');
      setShowReconnect((r) => ({ ...r, github: false }));
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not connect GitHub.');
    } finally {
      setGhBusy(false);
    }
  }

  async function disconnectGithub() {
    await integrationsApi.githubDisconnect();
    await load();
  }

  async function connectWakaTime() {
    setWtBusy(true);
    try {
      await integrationsApi.wakatimeConnect({ apiKey: wtApiKey.trim() });
      setWtApiKey('');
      setBanner('WakaTime connected.');
      setShowReconnect((r) => ({ ...r, wakatime: false }));
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not connect WakaTime.');
    } finally {
      setWtBusy(false);
    }
  }

  async function disconnectWakaTime() {
    await integrationsApi.wakatimeDisconnect();
    await load();
  }

  async function saveInstagramManual(e) {
    e.preventDefault();
    setIgBusy(true);
    try {
      await integrationsApi.instagramManual({
        pageAccessToken: igPageToken.trim(),
        igUserId: igUserId.trim(),
      });
      setIgPageToken('');
      setIgUserId('');
      setBanner('Instagram connected.');
      setShowReconnect((r) => ({ ...r, instagram: false }));
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not connect Instagram.');
    } finally {
      setIgBusy(false);
    }
  }

  const igBannerClass =
    instagramExpiry?.expired
      ? 'border-red-500/40 bg-red-950/50 text-red-200'
      : instagramExpiry?.soon
        ? 'border-sky-500/40 bg-sky-950/40 text-sky-100'
        : 'border-emerald-500/30 bg-emerald-950/35 text-emerald-200';

  return (
    <div className="dash-reveal mx-auto max-w-7xl px-4 py-10">
      <div className="integration-hero mb-6 rounded-2xl border border-white/10 p-6">
        <p className="dash-eyebrow">Integration overview</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-white">Connect your platforms</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          One place to connect, reconnect tokens, and monitor active integrations. Click a platform card below
          to open its workspace (GitHub includes your contribution chart and full activity feed).
        </p>
      </div>

      <div className="integration-health panel mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">System health</p>
            <p className="mt-1 text-sm text-slate-300">
              {connectedCount} of {cards.length} integrations connected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-36 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all"
                style={{ width: `${integrationHealth}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-emerald-300">{integrationHealth}%</span>
          </div>
        </div>
      </div>

      {instagramExpiry && status?.instagram?.connected ? (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${igBannerClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                {instagramExpiry.expired
                  ? 'Instagram token has expired'
                  : instagramExpiry.soon
                    ? `Instagram token expires in ${instagramExpiry.days} day${instagramExpiry.days === 1 ? '' : 's'}`
                    : 'Instagram token is active'}
              </p>
              <p className="text-xs opacity-90">Expiry date: {fmtDate(instagramExpiry.date)}</p>
            </div>
            <button type="button" className="btn-secondary text-xs" onClick={connectInstagram}>
              Reconnect now
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {banner ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {banner}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading integrations…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.key}
                to={cardWorkspacePath(card.key)}
                className="integration-mini-card-link block rounded-2xl text-inherit no-underline outline-none ring-offset-2 ring-offset-[#0c0e13] transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                <div className={`integration-mini-card panel h-full p-4 integration-mini-card--${card.key}`}>
                  <div className="flex items-center justify-between">
                    <span className="integration-brand-icon grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-sm text-slate-200">
                      <CardBrandIcon cardKey={card.key} />
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        card.connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {card.connected ? 'Connected' : 'Not linked'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-100">{card.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{card.meta}</p>
                  {card.warning ? <p className="mt-1 text-[11px] text-sky-300">{card.warning}</p> : null}
                  <p className="mt-3 text-[11px] font-medium text-teal-400/90">Open workspace →</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel integration-detail-card integration-detail-card--youtube p-5">
              <h3 className="text-base font-semibold text-slate-100">YouTube</h3>
              <p className="mt-1 text-xs text-slate-500">OAuth connect for channel + recent likes summary.</p>
              <div className="mt-4 flex gap-2">
                {!status?.youtube?.connected ? (
                  <button type="button" className="btn-primary" onClick={connectYoutube}>
                    Connect
                  </button>
                ) : (
                  <button type="button" className="btn-secondary" onClick={connectYoutube}>
                    Reconnect
                  </button>
                )}
                {status?.youtube?.connected ? (
                  <button type="button" className="btn-secondary" onClick={disconnectYoutube}>
                    Disconnect
                  </button>
                ) : null}
              </div>
            </div>

            <div className="panel integration-detail-card integration-detail-card--instagram p-5">
              <h3 className="text-base font-semibold text-slate-100">Instagram</h3>
              <p className="mt-1 text-xs text-slate-500">
                Connect via Instagram app OAuth (recommended). Manual token is advanced fallback only.
              </p>
              <div className="mt-4 flex gap-2">
                {instagramOAuthReady ? (
                  <button type="button" className="btn-primary" onClick={connectInstagram}>
                    {status?.instagram?.connected ? 'Reconnect Instagram App' : 'Connect Instagram App'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowInstagramAdvanced((v) => !v)}
                >
                  {showInstagramAdvanced ? 'Hide advanced' : 'Advanced token fallback'}
                </button>
                {status?.instagram?.connected ? (
                  <button type="button" className="btn-secondary" onClick={disconnectInstagram}>
                    Disconnect
                  </button>
                ) : null}
              </div>

              {!instagramOAuthReady ? (
                <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
                  Instagram app OAuth is not configured on backend yet. Set
                  <code className="rounded bg-sky-950/70 px-1">META_APP_ID</code>,
                  <code className="rounded bg-sky-950/70 px-1">META_APP_SECRET</code>,
                  <code className="rounded bg-sky-950/70 px-1">META_REDIRECT_URI</code>
                  in <code className="rounded bg-white/10 px-1">backend/.env</code>.
                </p>
              ) : null}

              {showInstagramAdvanced ? (
                <form className="mt-4 space-y-2" onSubmit={saveInstagramManual}>
                  <p className="text-xs text-slate-400">
                    Advanced fallback: use Page access token + Instagram user id when OAuth is unavailable.
                  </p>
                  <input
                    value={igPageToken}
                    onChange={(e) => setIgPageToken(e.target.value)}
                    className="field-control text-xs"
                    type="password"
                    placeholder="Page token (EAA...)"
                  />
                  <input
                    value={igUserId}
                    onChange={(e) => setIgUserId(e.target.value)}
                    className="field-control text-xs"
                    type="text"
                    placeholder="Instagram user id"
                  />
                  <button
                    type="submit"
                    className="btn-secondary text-sm"
                    disabled={igBusy || !igPageToken || !igUserId}
                  >
                    {igBusy ? 'Saving…' : 'Save manual token'}
                  </button>
                </form>
              ) : null}
              {igSummary?.followersCount != null ? (
                <p className="mt-3 text-xs text-slate-300">
                  Followers: {igSummary.followersCount} · Posts: {igSummary.mediaCount ?? 0}
                </p>
              ) : null}
            </div>

            <div className="panel integration-detail-card integration-detail-card--github p-5">
              <h3 className="text-base font-semibold text-slate-100">GitHub</h3>
              <p className="mt-1 text-xs text-slate-500">
                Connect with GitHub OAuth app (recommended). PAT is advanced fallback.
              </p>
              <div className="mt-4 flex gap-2">
                {githubOAuthReady ? (
                  <button type="button" className="btn-primary" onClick={connectGithubOAuth}>
                    {status?.github?.connected ? 'Reconnect GitHub App' : 'Connect GitHub App'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setShowReconnect((r) => ({
                      ...r,
                      github: !r.github,
                    }))
                  }
                >
                  {showReconnect.github ? 'Hide PAT fallback' : 'PAT fallback'}
                </button>
              </div>
              {!githubOAuthReady ? (
                <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
                  GitHub OAuth app is not configured on backend yet. Set
                  <code className="rounded bg-sky-950/70 px-1">GITHUB_CLIENT_ID</code>,
                  <code className="rounded bg-sky-950/70 px-1">GITHUB_CLIENT_SECRET</code>,
                  <code className="rounded bg-sky-950/70 px-1">GITHUB_REDIRECT_URI</code>
                  in <code className="rounded bg-white/10 px-1">backend/.env</code>.
                </p>
              ) : null}
              {!status?.github?.connected || showReconnect.github ? (
                <div className="mt-4 space-y-2">
                  <input
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    className="field-control text-xs"
                    type="password"
                    placeholder="ghp_... or github_pat_..."
                  />
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={ghBusy || !ghToken}
                    onClick={connectGithub}
                  >
                    {ghBusy ? 'Connecting…' : status?.github?.connected ? 'Save new token' : 'Connect GitHub'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-1 text-xs text-slate-300">
                  <p>User: {ghSummary?.username || status?.github?.username || '—'}</p>
                  <p>Commits (7d): {ghSummary?.commitsLast7Days ?? 0}</p>
                  <p>Last sync: {fmtDate(status?.github?.lastSyncedAt)}</p>
                  <Link to="/integrations/github" className="btn-primary mt-3 inline-flex text-sm no-underline">
                    Open GitHub workspace
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-sm"
                    onClick={() =>
                      setShowReconnect((r) => ({
                        ...r,
                        github: true,
                      }))
                    }
                  >
                    Reconnect token
                  </button>
                  <button type="button" className="btn-secondary mt-2 text-sm" onClick={disconnectGithub}>
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            <div className="panel integration-detail-card integration-detail-card--wakatime p-5">
              <h3 className="text-base font-semibold text-slate-100">WakaTime</h3>
              <p className="mt-1 text-xs text-slate-500">Import coding time, language, and project trends.</p>
              {!status?.wakatime?.connected || showReconnect.wakatime ? (
                <div className="mt-4 space-y-2">
                  <input
                    value={wtApiKey}
                    onChange={(e) => setWtApiKey(e.target.value)}
                    className="field-control text-xs"
                    type="password"
                    placeholder="waka_..."
                  />
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={wtBusy || !wtApiKey}
                    onClick={connectWakaTime}
                  >
                    {wtBusy ? 'Connecting…' : status?.wakatime?.connected ? 'Save new key' : 'Connect WakaTime'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-1 text-xs text-slate-300">
                  <p>Today: {wtSummary?.todayText || '0 secs'}</p>
                  <p>Last 7d: {wtSummary?.totalText7d || '0 secs'}</p>
                  <p>Last sync: {fmtDate(status?.wakatime?.lastSyncedAt)}</p>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-sm"
                    onClick={() =>
                      setShowReconnect((r) => ({
                        ...r,
                        wakatime: true,
                      }))
                    }
                  >
                    Reconnect key
                  </button>
                  <button type="button" className="btn-secondary mt-2 text-sm" onClick={disconnectWakaTime}>
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

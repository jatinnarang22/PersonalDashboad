<script setup>
import { computed, onMounted, ref } from 'vue';
import { integrationsApi, integrationOAuthStartUrl } from '../services/api.js';

const loading = ref(true);
const error = ref('');
const banner = ref('');
const status = ref(null);
const ghSummary = ref(null);
const wtSummary = ref(null);
const igSummary = ref(null);

const ghToken = ref('');
const wtApiKey = ref('');
const igPageToken = ref('');
const igUserId = ref('');

const ghBusy = ref(false);
const wtBusy = ref(false);
const igBusy = ref(false);
const showInstagramAdvanced = ref(false);

const showReconnect = ref({
  github: false,
  wakatime: false,
  instagram: false,
});

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

const instagramExpiry = computed(() => {
  const days = daysUntil(status.value?.instagram?.tokenExpiresAt);
  const date = status.value?.instagram?.tokenExpiresAt;
  if (days == null || !status.value?.instagram?.connected) return null;
  return {
    days,
    date,
    expired: days <= 0,
    soon: days > 0 && days <= 14,
  };
});

const instagramOAuthReady = computed(() => Boolean(status.value?.config?.instagramOAuth));
const githubOAuthReady = computed(() => Boolean(status.value?.config?.githubOAuth));
const connectedCount = computed(() => cards.value.filter((c) => c.connected).length);
const integrationHealth = computed(() => {
  if (!cards.value.length) return 0;
  return Math.round((connectedCount.value / cards.value.length) * 100);
});

const cards = computed(() => {
  const s = status.value || {};
  const ig = instagramExpiry.value;
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
      subtitle: s.wakatime?.connected ? wtSummary.value?.todayText || 'Connected' : 'Not connected',
      meta: `Last sync: ${fmtDate(s.wakatime?.lastSyncedAt)}`,
      warning: '',
    },
  ];
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    ghSummary.value = null;
    wtSummary.value = null;
    igSummary.value = null;

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
          ghSummary.value = gh.data.summary;
        }
      } catch {
        /* keep status */
      }
    }
    status.value = data;
    if (data.github?.connected && !ghSummary.value) {
      try {
        ghSummary.value = (await integrationsApi.githubSummary()).data.summary;
      } catch {
        ghSummary.value = null;
      }
    }
    if (data.wakatime?.connected) {
      wtSummary.value = (await integrationsApi.wakatimeSummary()).data.summary;
    }
    if (data.instagram?.connected) {
      try {
        igSummary.value = (await integrationsApi.instagramSummary()).data.summary;
      } catch {
        igSummary.value = null;
      }
    }
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not load integrations.';
  } finally {
    loading.value = false;
  }
}

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
  ghBusy.value = true;
  try {
    await integrationsApi.githubConnect({ personalAccessToken: ghToken.value.trim() });
    ghToken.value = '';
    banner.value = 'GitHub connected.';
    showReconnect.value.github = false;
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not connect GitHub.';
  } finally {
    ghBusy.value = false;
  }
}

async function disconnectGithub() {
  await integrationsApi.githubDisconnect();
  await load();
}

async function connectWakaTime() {
  wtBusy.value = true;
  try {
    await integrationsApi.wakatimeConnect({ apiKey: wtApiKey.value.trim() });
    wtApiKey.value = '';
    banner.value = 'WakaTime connected.';
    showReconnect.value.wakatime = false;
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not connect WakaTime.';
  } finally {
    wtBusy.value = false;
  }
}

async function disconnectWakaTime() {
  await integrationsApi.wakatimeDisconnect();
  await load();
}

async function saveInstagramManual() {
  igBusy.value = true;
  try {
    await integrationsApi.instagramManual({
      pageAccessToken: igPageToken.value.trim(),
      igUserId: igUserId.value.trim(),
    });
    igPageToken.value = '';
    igUserId.value = '';
    banner.value = 'Instagram connected.';
    showReconnect.value.instagram = false;
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not connect Instagram.';
  } finally {
    igBusy.value = false;
  }
}

function humanizeOAuthError(raw) {
  if (!raw) return 'Connection failed. Please try again.';
  if (raw === 'invalid_state') return 'Connection failed: invalid session state. Please retry.';
  if (raw === 'session_expired_login_again') return 'Session expired. Please login again and reconnect.';
  if (raw === 'no_access_token') return 'GitHub did not return an access token.';
  return decodeURIComponent(String(raw).replace(/\+/g, ' '));
}

function applyOAuthResultFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const integration = params.get('integration');
  const msg = params.get('msg');
  if (!integration) return;

  if (integration === 'github_ok') {
    banner.value = 'GitHub app connected successfully.';
    error.value = '';
  } else if (integration === 'github_err') {
    banner.value = '';
    error.value = `GitHub connection failed: ${humanizeOAuthError(msg)}`;
  }

  params.delete('integration');
  params.delete('msg');
  const next = params.toString();
  const cleanUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash || ''}`;
  window.history.replaceState({}, '', cleanUrl);
}

onMounted(async () => {
  applyOAuthResultFromQuery();
  await load();
});
</script>

<template>
  <div class="dash-reveal mx-auto max-w-7xl px-4 py-10">
    <div class="integration-hero mb-6 rounded-2xl border border-white/10 p-6">
      <p class="dash-eyebrow">Integration overview</p>
      <h1 class="mt-1 font-display text-3xl font-semibold text-white">Connect your platforms</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-300">
        One place to connect, reconnect tokens, and monitor active integrations.
      </p>
    </div>

    <section class="integration-health panel mb-5 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">System health</p>
          <p class="mt-1 text-sm text-slate-300">
            {{ connectedCount }} of {{ cards.length }} integrations connected
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-2 w-36 overflow-hidden rounded-full bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all"
              :style="{ width: `${integrationHealth}%` }"
            />
          </div>
          <span class="text-sm font-semibold text-emerald-300">{{ integrationHealth }}%</span>
        </div>
      </div>
    </section>

    <div
      v-if="instagramExpiry && status?.instagram?.connected"
      class="mb-4 rounded-2xl border px-4 py-3 text-sm"
      :class="
        instagramExpiry.expired
          ? 'border-red-500/40 bg-red-950/50 text-red-200'
          : instagramExpiry.soon
            ? 'border-amber-500/40 bg-amber-950/40 text-amber-100'
            : 'border-emerald-500/30 bg-emerald-950/35 text-emerald-200'
      "
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="font-semibold">
            {{
              instagramExpiry.expired
                ? 'Instagram token has expired'
                : instagramExpiry.soon
                  ? `Instagram token expires in ${instagramExpiry.days} day${instagramExpiry.days === 1 ? '' : 's'}`
                  : 'Instagram token is active'
            }}
          </p>
          <p class="text-xs opacity-90">Expiry date: {{ fmtDate(instagramExpiry.date) }}</p>
        </div>
        <button
          type="button"
          class="btn-secondary text-xs"
          @click="connectInstagram"
        >
          Reconnect now
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200">
      {{ error }}
    </div>
    <div
      v-if="banner"
      class="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
    >
      {{ banner }}
    </div>

    <div v-if="loading" class="py-12 text-center text-slate-400">Loading integrations…</div>

    <template v-else>
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.key"
          class="integration-mini-card panel p-4"
          :class="`integration-mini-card--${card.key}`"
        >
          <div class="flex items-center justify-between">
            <span class="integration-brand-icon grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-sm text-slate-200">
              <svg
                v-if="card.key === 'youtube'"
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z"
                />
              </svg>
              <svg
                v-else-if="card.key === 'instagram'"
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              <svg
                v-else-if="card.key === 'github'"
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.3.8-4-1.4-4-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 2.1.8 2.6 1.5.3-.8.6-1.3 1.1-1.6-2.6-.3-5.4-1.3-5.4-6A4.7 4.7 0 0 1 5 7.7a4.4 4.4 0 0 1 .1-3.3s1-.3 3.4 1.3a11.8 11.8 0 0 1 6.1 0C17 4 18 4.4 18 4.4a4.4 4.4 0 0 1 .1 3.3 4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .6.5 1.2 1.4 1.2 2.9v3.4c0 .4.2.7.8.6A12 12 0 0 0 12 .5z"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M4 6h4l2 12H6L4 6zm8 0h4l2 12h-4L12 6zm8 0h2l-2 12h-2l2-12z" />
              </svg>
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="card.connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-500/20 text-slate-300'"
            >
              {{ card.connected ? 'Connected' : 'Not linked' }}
            </span>
          </div>
          <p class="mt-3 text-sm font-semibold text-slate-100">{{ card.title }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ card.subtitle }}</p>
          <p class="mt-1 text-[11px] text-slate-500">{{ card.meta }}</p>
          <p v-if="card.warning" class="mt-1 text-[11px] text-amber-300">{{ card.warning }}</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="panel integration-detail-card integration-detail-card--youtube p-5">
          <h3 class="text-base font-semibold text-slate-100">YouTube</h3>
          <p class="mt-1 text-xs text-slate-500">OAuth connect for channel + recent likes summary.</p>
          <div class="mt-4 flex gap-2">
            <button v-if="!status?.youtube?.connected" class="btn-primary" @click="connectYoutube">Connect</button>
            <button v-else class="btn-secondary" @click="connectYoutube">Reconnect</button>
            <button v-if="status?.youtube?.connected" class="btn-secondary" @click="disconnectYoutube">Disconnect</button>
          </div>
        </div>

        <div class="panel integration-detail-card integration-detail-card--instagram p-5">
          <h3 class="text-base font-semibold text-slate-100">Instagram</h3>
          <p class="mt-1 text-xs text-slate-500">
            Connect via Instagram app OAuth (recommended). Manual token is advanced fallback only.
          </p>
          <div class="mt-4 flex gap-2">
            <button
              v-if="instagramOAuthReady"
              class="btn-primary"
              @click="connectInstagram"
            >
              {{ status?.instagram?.connected ? 'Reconnect Instagram App' : 'Connect Instagram App' }}
            </button>
            <button
              class="btn-secondary"
              @click="showInstagramAdvanced = !showInstagramAdvanced"
            >
              {{ showInstagramAdvanced ? 'Hide advanced' : 'Advanced token fallback' }}
            </button>
            <button v-if="status?.instagram?.connected" class="btn-secondary" @click="disconnectInstagram">Disconnect</button>
          </div>

          <p
            v-if="!instagramOAuthReady"
            class="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
          >
            Instagram app OAuth is not configured on backend yet. Set
            <code class="rounded bg-amber-950/70 px-1">META_APP_ID</code>,
            <code class="rounded bg-amber-950/70 px-1">META_APP_SECRET</code>,
            <code class="rounded bg-amber-950/70 px-1">META_REDIRECT_URI</code>
            in <code class="rounded bg-white/10 px-1">server/.env</code>.
          </p>

          <form v-if="showInstagramAdvanced" class="mt-4 space-y-2" @submit.prevent="saveInstagramManual">
            <p class="text-xs text-slate-400">
              Advanced fallback: use Page access token + Instagram user id when OAuth is unavailable.
            </p>
            <input v-model="igPageToken" class="field-control text-xs" type="password" placeholder="Page token (EAA...)" />
            <input v-model="igUserId" class="field-control text-xs" type="text" placeholder="Instagram user id" />
            <button class="btn-secondary text-sm" :disabled="igBusy || !igPageToken || !igUserId">
              {{ igBusy ? 'Saving…' : 'Save manual token' }}
            </button>
          </form>
          <p v-if="igSummary?.followersCount != null" class="mt-3 text-xs text-slate-300">
            Followers: {{ igSummary.followersCount }} · Posts: {{ igSummary.mediaCount ?? 0 }}
          </p>
        </div>

        <div class="panel integration-detail-card integration-detail-card--github p-5">
          <h3 class="text-base font-semibold text-slate-100">GitHub</h3>
          <p class="mt-1 text-xs text-slate-500">
            Connect with GitHub OAuth app (recommended). PAT is advanced fallback.
          </p>
          <div class="mt-4 flex gap-2">
            <button
              v-if="githubOAuthReady"
              class="btn-primary"
              @click="connectGithubOAuth"
            >
              {{ status?.github?.connected ? 'Reconnect GitHub App' : 'Connect GitHub App' }}
            </button>
            <button class="btn-secondary" @click="showReconnect.github = !showReconnect.github">
              {{ showReconnect.github ? 'Hide PAT fallback' : 'PAT fallback' }}
            </button>
          </div>
          <p
            v-if="!githubOAuthReady"
            class="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
          >
            GitHub OAuth app is not configured on backend yet. Set
            <code class="rounded bg-amber-950/70 px-1">GITHUB_CLIENT_ID</code>,
            <code class="rounded bg-amber-950/70 px-1">GITHUB_CLIENT_SECRET</code>,
            <code class="rounded bg-amber-950/70 px-1">GITHUB_REDIRECT_URI</code>
            in <code class="rounded bg-white/10 px-1">server/.env</code>.
          </p>
          <div v-if="!status?.github?.connected || showReconnect.github" class="mt-4 space-y-2">
            <input v-model="ghToken" class="field-control text-xs" type="password" placeholder="ghp_... or github_pat_..." />
            <button class="btn-secondary text-sm" :disabled="ghBusy || !ghToken" @click="connectGithub">
              {{ ghBusy ? 'Connecting…' : status?.github?.connected ? 'Save new token' : 'Connect GitHub' }}
            </button>
          </div>
          <div v-else class="mt-4 space-y-1 text-xs text-slate-300">
            <p>User: {{ ghSummary?.username || status?.github?.username || '—' }}</p>
            <p>Commits (7d): {{ ghSummary?.commitsLast7Days ?? 0 }}</p>
            <p>Last sync: {{ fmtDate(status?.github?.lastSyncedAt) }}</p>
            <button class="btn-secondary mt-2 text-sm" @click="showReconnect.github = true">Reconnect token</button>
            <button class="btn-secondary mt-2 text-sm" @click="disconnectGithub">Disconnect</button>
          </div>
        </div>

        <div class="panel integration-detail-card integration-detail-card--wakatime p-5">
          <h3 class="text-base font-semibold text-slate-100">WakaTime</h3>
          <p class="mt-1 text-xs text-slate-500">Import coding time, language, and project trends.</p>
          <div v-if="!status?.wakatime?.connected || showReconnect.wakatime" class="mt-4 space-y-2">
            <input v-model="wtApiKey" class="field-control text-xs" type="password" placeholder="waka_..." />
            <button class="btn-secondary text-sm" :disabled="wtBusy || !wtApiKey" @click="connectWakaTime">
              {{ wtBusy ? 'Connecting…' : status?.wakatime?.connected ? 'Save new key' : 'Connect WakaTime' }}
            </button>
          </div>
          <div v-else class="mt-4 space-y-1 text-xs text-slate-300">
            <p>Today: {{ wtSummary?.todayText || '0 secs' }}</p>
            <p>Last 7d: {{ wtSummary?.totalText7d || '0 secs' }}</p>
            <p>Last sync: {{ fmtDate(status?.wakatime?.lastSyncedAt) }}</p>
            <button class="btn-secondary mt-2 text-sm" @click="showReconnect.wakatime = true">Reconnect key</button>
            <button class="btn-secondary mt-2 text-sm" @click="disconnectWakaTime">Disconnect</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

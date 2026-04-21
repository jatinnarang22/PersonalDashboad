import { User } from '../models/User.js';
import * as gh from './githubIntegrationService.js';
import * as wt from './wakatimeIntegrationService.js';
import { saveSnapshot } from './snapshotService.js';

let timer = null;
let running = false;

const enabled = () => process.env.INTEGRATION_SYNC_ENABLED !== 'false';
const intervalMinutes = () => Math.max(5, Number(process.env.INTEGRATION_SYNC_INTERVAL_MINUTES) || 60);

async function syncGitHubForUser(user) {
  const token = user?.integrations?.github?.personalAccessToken;
  if (!token) return false;
  const summary = await gh.fetchGitHubSummary(token);
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'integrations.github.username': summary.username || user?.integrations?.github?.username || '',
      'integrations.github.lastSummary': summary,
      'integrations.github.lastSyncedAt': new Date(),
    },
  });
  await saveSnapshot(user._id, 'github', summary);
  return true;
}

async function syncWakaTimeForUser(user) {
  const apiKey = user?.integrations?.wakatime?.apiKey;
  if (!apiKey) return false;
  const summary = await wt.fetchWakaTimeSummary(apiKey);
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'integrations.wakatime.lastSummary': summary,
      'integrations.wakatime.lastSyncedAt': new Date(),
    },
  });
  await saveSnapshot(user._id, 'wakatime', summary);
  return true;
}

export async function runIntegrationSyncOnce() {
  if (running) return { skipped: true };
  running = true;
  const startedAt = Date.now();
  let usersScanned = 0;
  let githubSynced = 0;
  let wakatimeSynced = 0;
  try {
    const users = await User.find(
      {
        $or: [
          { 'integrations.github.personalAccessToken': { $ne: '' } },
          { 'integrations.wakatime.apiKey': { $ne: '' } },
        ],
      },
      { integrations: 1 }
    ).lean();

    usersScanned = users.length;
    for (const user of users) {
      try {
        if (await syncGitHubForUser(user)) githubSynced += 1;
      } catch (err) {
        console.warn(`[integration-sync] github sync failed for user ${user._id}: ${err.message}`);
      }
      try {
        if (await syncWakaTimeForUser(user)) wakatimeSynced += 1;
      } catch (err) {
        console.warn(`[integration-sync] wakatime sync failed for user ${user._id}: ${err.message}`);
      }
    }
    return {
      skipped: false,
      usersScanned,
      githubSynced,
      wakatimeSynced,
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    running = false;
  }
}

export function startIntegrationSyncScheduler() {
  if (!enabled()) {
    console.log('[integration-sync] disabled');
    return () => {};
  }
  const minutes = intervalMinutes();
  const tick = async () => {
    const result = await runIntegrationSyncOnce();
    if (!result?.skipped) {
      console.log(
        `[integration-sync] users=${result.usersScanned} github=${result.githubSynced} wakatime=${result.wakatimeSynced} elapsed=${result.elapsedMs}ms`
      );
    }
  };

  setTimeout(tick, 15_000);
  timer = setInterval(tick, minutes * 60 * 1000);
  console.log(`[integration-sync] started (every ${minutes} min)`);
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
}

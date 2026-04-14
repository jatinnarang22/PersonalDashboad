# Personal dashboard — product roadmap & integration notes

Use this as a north star for job-search and “whole life” tracking. Build in **phases**: manual logging first, then automate where APIs allow.

## Phase 1 — You have now (foundation)

- Auth, profile, daily log (steps, screen, coding, mood).
- **Extended daily metrics** (see API): calories estimate, distance, running/active time, music listening time, LinkedIn outreach count, job applications — **manual entry** until you wire APIs.

## Phase 2 — Health & movement (realistic automation)

| Idea | How |
|------|-----|
| Steps / workouts | Apple Health / Google Fit export, or manual; later **Strava API** (running) if you use it. |
| Calories | Usually derived from wearables; many need **paid** or export files — manual is fine. |
| Sleep | Oura / Whoop / Apple Health — often **export or official API** with OAuth. |

## Phase 3 — Developer identity (good ROI for interviews)

| Idea | How |
|------|-----|
| GitHub contributions | **GitHub REST API** (public): contributions require GraphQL `contributionsCollection` or scrape-like solutions — public API is free with rate limits. Compare **personal vs org** by storing two usernames and fetching both. |
| LeetCode / similar | Official APIs limited; often **manual** counts or browser extension. |

## Phase 4 — Social & career (mostly manual or expensive)

| Idea | Reality |
|------|---------|
| LinkedIn connections / messages | **No official free API** for DMs or connection counts for personal apps. Terms forbid scraping. **Manual counts** weekly or spreadsheet import. |
| Job openings “for me” | **LinkedIn / Indeed** don’t offer nice free personal APIs — use **RSS**, **email forwarding**, or **Notion/Airtable** and sync. |
| Instagram time / profile | **Instagram Graph API** (implemented): Professional (Creator/Business) + Facebook Page — profile, followers, recent posts. Personal accounts are not supported by Meta’s API. Manual minutes still logged in dashboard. |

## Phase 5 — Music taste

| Idea | How |
|------|-----|
| Listening time / genres | **YouTube Data API** (implemented): Google OAuth + `youtube.readonly` — channel, liked-videos playlist sample. Private **watch history** is not exposed by Google to third-party apps. **Spotify** / **Last.fm** remain good alternatives for audio-centric stats. |

## Phase 6 — Schedule & focus

| Idea | How |
|------|-----|
| Calendar | **Google Calendar API** or **CalDAV** (OAuth). |
| Deep work blocks | Manual or integrate **Toggl** / **Clockify** APIs. |

## Principles

1. **Own your data** — MongoDB + exports beats relying on closed UIs alone.  
2. **Manual first** — proves the habit, then automate.  
3. **Respect ToS** — no scraping LinkedIn/IG for production; use official APIs or manual.  
4. **Interview story** — “I built a personal OS: auth, metrics, charts, roadmap to integrations” is credible.

---

## Next implementation steps (suggested order)

1. **YouTube + Instagram OAuth** — `GET /api/integrations/youtube/start` / `instagram/start` (session required); tokens stored on `User.integrations`. See `server/.env.example` for `GOOGLE_*` and `META_*`.
2. **GitHub snapshot** — public REST/GraphQL + profile usernames → dashboard cards (optional follow-up).
3. **Inbound webhook** — `POST /api/webhooks/daily-metrics` with a shared secret (from Shortcuts / cron).
4. **Production hardening** — `SESSION_SECRET`, `USE_MEMORY_MONGO=false`, MongoDB Atlas or Docker, HTTPS, `secure` cookies.

*Extend `DailyLog.metrics` in code for new numeric fields; add UI rows as you need them.*

export default function DashboardIntegrationsManager({
  integrationStatus,
  integrationsLoading,
  showDetailedIntegrations,
  setShowDetailedIntegrations,
  ytSummary,
  igSummary,
  ghSummary,
  wtSummary,
  igSummaryError,
  ghError,
  wtError,
  connectYoutube,
  disconnectYoutube,
  connectInstagram,
  disconnectInstagram,
  igManualPageToken,
  setIgManualPageToken,
  igManualIgUserId,
  setIgManualIgUserId,
  igManualBusy,
  igManualError,
  submitInstagramManual,
  igUserAccessToken,
  setIgUserAccessToken,
  igUserTokenBusy,
  submitInstagramUserToken,
  ghToken,
  setGhToken,
  ghBusy,
  submitGithubToken,
  disconnectGithub,
  wtApiKey,
  setWtApiKey,
  wtBusy,
  submitWakaTimeKey,
  disconnectWakaTime,
}) {
  return (
    <div className="dash-reveal mb-10">
      <div id="integration-manager" className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">Integrations manager</h2>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setShowDetailedIntegrations(!showDetailedIntegrations)}
        >
          {showDetailedIntegrations ? 'Hide details' : 'Show details'}
        </button>
      </div>
      <div className="mb-4 text-sm text-slate-500">
        Connect platforms, refresh tokens, and troubleshoot integration issues.
      </div>

      {integrationsLoading && !integrationStatus ? (
        <div className="text-sm text-slate-500">Loading connections…</div>
      ) : showDetailedIntegrations ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* YouTube */}
          <div className="panel min-h-[340px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">YouTube</h3>
                <div className="mt-1 text-xs text-slate-500">
                  Music and videos you have <span className="italic">liked</span> (Premium does not add extra API data).
                </div>
              </div>
              {integrationStatus?.youtube?.connected ? (
                <div className="shrink-0 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-200">
                  Connected
                </div>
              ) : null}
            </div>

            {integrationStatus && !integrationStatus.config?.youtubeOAuth ? (
              <div className="mt-3 text-xs text-sky-200/90">
                Set <code className="rounded bg-sky-950/60 px-1 text-sky-100">GOOGLE_CLIENT_*</code> and
                <code className="rounded bg-sky-950/60 px-1 text-sky-100"> GOOGLE_REDIRECT_URI</code> in
                <code className="rounded bg-white/10 px-1 text-slate-300"> backend/.env</code>, then restart the API.
              </div>
            ) : integrationStatus?.youtube?.connected && ytSummary ? (
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>
                  <span className="text-slate-500">Channel:</span>{' '}
                  {ytSummary.channelTitle || integrationStatus.youtube.channelTitle || '—'}
                </div>
                {ytSummary.subscriberCount != null ? (
                  <div>
                    <span className="text-slate-500">Subscribers:</span> {ytSummary.subscriberCount}
                  </div>
                ) : null}
                {ytSummary.likedVideos?.length ? (
                  <div className="text-slate-300">
                    <span className="block text-xs font-medium text-slate-500">Recent likes</span>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {ytSummary.likedVideos.map((v, idx) => (
                        <li key={idx}>{v.title || v.videoId}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="text-xs text-slate-500">{ytSummary.note}</div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {integrationStatus?.config?.youtubeOAuth && !integrationStatus?.youtube?.connected ? (
                <button
                  type="button"
                  className="btn-primary rounded-lg px-3 py-2"
                  onClick={connectYoutube}
                >
                  Connect YouTube
                </button>
              ) : null}
              {integrationStatus?.youtube?.connected ? (
                <button type="button" className="btn-secondary" onClick={disconnectYoutube}>
                  Disconnect
                </button>
              ) : null}
            </div>
          </div>

          {/* Instagram */}
          <div className="panel min-h-[340px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">Instagram</h3>
                <div className="mt-1 text-xs text-slate-500">
                  Profile stats and recent posts (Graph API — Professional accounts only).
                </div>
              </div>
              {integrationStatus?.instagram?.connected ? (
                <div className="shrink-0 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-200">
                  Connected
                </div>
              ) : null}
            </div>

            {integrationStatus &&
            !integrationStatus.instagram?.connected &&
            !integrationStatus.config?.instagramOAuth ? (
              <div className="mt-3 text-xs text-sky-200/90">
                Optional: set <code className="rounded bg-sky-950/60 px-1 text-sky-100">META_APP_ID</code>,
                <code className="rounded bg-sky-950/60 px-1 text-sky-100"> META_APP_SECRET</code>,
                <code className="rounded bg-sky-950/60 px-1 text-sky-100"> META_REDIRECT_URI</code> in
                <code className="rounded bg-white/10 px-1 text-slate-300"> backend/.env</code> to use
                &quot;Connect Instagram&quot;, or paste tokens below (no app secret needed).
              </div>
            ) : integrationStatus?.instagram?.connected && igSummary ? (
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {igSummaryError ? (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
                    {igSummaryError}
                  </div>
                ) : null}
                <div>
                  <span className="text-slate-500">@</span>
                  {igSummary.username || integrationStatus.instagram.username}
                </div>
                {igSummary.biography ? <div>{igSummary.biography}</div> : null}
                {igSummary.followersCount != null ? (
                  <div>
                    <span className="text-slate-500">Followers:</span> {igSummary.followersCount}
                  </div>
                ) : null}
                {igSummary.followsCount != null ? (
                  <div>
                    <span className="text-slate-500">Following:</span> {igSummary.followsCount}
                  </div>
                ) : null}
                {igSummary.mediaCount != null ? (
                  <div>
                    <span className="text-slate-500">Posts:</span> {igSummary.mediaCount}
                  </div>
                ) : null}
                {igSummary.recentMedia?.length ? (
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Recent images</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {igSummary.recentMedia.map((m) => (
                        <a
                          key={m.id}
                          href={m.permalink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block overflow-hidden rounded-lg border border-white/10 bg-slate-900/40"
                        >
                          {m.thumbnailUrl || m.mediaUrl ? (
                            <img
                              src={m.thumbnailUrl || m.mediaUrl}
                              alt={m.caption || 'Instagram media'}
                              className="h-28 w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-28 items-center justify-center text-[11px] text-slate-500">
                              No preview
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-slate-200">
                            {m.mediaType || 'MEDIA'}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="text-xs text-slate-500">{igSummary.note}</div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {integrationStatus?.config?.instagramOAuth && !integrationStatus?.instagram?.connected ? (
                <button
                  type="button"
                  className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 hover:opacity-95"
                  onClick={connectInstagram}
                >
                  Connect Instagram
                </button>
              ) : null}
              {integrationStatus?.instagram?.connected ? (
                <button type="button" className="btn-secondary" onClick={disconnectInstagram}>
                  Disconnect
                </button>
              ) : null}
            </div>

            {integrationStatus && !integrationStatus.instagram?.connected ? (
              <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-300">Real Instagram data:</strong> the API needs a{' '}
                  <strong className="text-brand-accent">Creator or Business</strong> IG linked to a Facebook Page.
                  Tokens are stored in your dashboard account only (never from chat). Graph API Explorer &quot;User&quot;
                  tokens with only{' '}
                  <code className="rounded bg-white/10 px-1">public_profile</code> cannot load Instagram media.
                </div>
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitInstagramManual();
                  }}
                >
                  <div className="text-xs font-medium text-slate-500">
                    Option A — Page access token + Instagram User ID
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-500">
                    Use a <strong className="text-slate-400">Facebook Page</strong> token (usually starts with{' '}
                    <code className="rounded bg-white/10 px-0.5">EAA</code>
                    ), not the &quot;Generate token&quot; from Meta&apos;s Instagram screen (often starts with{' '}
                    <code className="rounded bg-white/10 px-0.5">IG</code>
                    ). In{' '}
                    <a
                      className="text-brand-accent underline underline-offset-2 hover:text-brand-accentSoft"
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Graph API Explorer
                    </a>
                    : add <code className="rounded bg-white/10 px-0.5">pages_show_list</code> +{' '}
                    <code className="rounded bg-white/10 px-0.5">instagram_basic</code>, generate token, then run{' '}
                    <code className="break-all rounded bg-white/10 px-0.5">
                      {'{page-id}?fields=access_token'}
                    </code>{' '}
                    and paste the token here. IG id comes from{' '}
                    <code className="break-all rounded bg-white/10 px-0.5">
                      {'{page-id}?fields=instagram_business_account{id,username}'}
                    </code>
                    .
                  </div>
                  <label className="field-label text-xs" htmlFor="ig-manual-page-token">
                    Page access token
                  </label>
                  <input
                    id="ig-manual-page-token"
                    value={igManualPageToken}
                    onChange={(e) => setIgManualPageToken(e.target.value)}
                    type="password"
                    autoComplete="off"
                    className="field-control font-mono text-xs"
                    placeholder="EAA… (Page token from Graph API, not IG… from Instagram product UI)"
                  />
                  <label className="field-label text-xs" htmlFor="ig-manual-ig-user-id">
                    Instagram User ID (IG Business id)
                  </label>
                  <input
                    id="ig-manual-ig-user-id"
                    value={igManualIgUserId}
                    onChange={(e) => setIgManualIgUserId(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="field-control font-mono text-xs"
                    placeholder="Digits only, e.g. 17841407995283128 — not your email"
                  />
                  <button
                    type="submit"
                    className="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                    disabled={
                      igManualBusy || !igManualPageToken.trim() || !igManualIgUserId.trim()
                    }
                  >
                    {igManualBusy ? 'Saving…' : 'Save & load Instagram'}
                  </button>
                  {igManualError ? (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
                      {igManualError}
                    </div>
                  ) : null}
                </form>
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitInstagramUserToken();
                  }}
                >
                  <div className="text-xs font-medium text-slate-500">
                    Option B — User access token (with Instagram permissions)
                  </div>
                  <label className="field-label text-xs" htmlFor="ig-user-access-token">
                    User access token
                  </label>
                  <input
                    id="ig-user-access-token"
                    value={igUserAccessToken}
                    onChange={(e) => setIgUserAccessToken(e.target.value)}
                    type="password"
                    autoComplete="off"
                    className="field-control font-mono text-xs"
                    placeholder="Must include instagram_basic + pages_show_list"
                  />
                  <button
                    type="submit"
                    className="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                    disabled={igUserTokenBusy || !igUserAccessToken.trim()}
                  >
                    {igUserTokenBusy ? 'Connecting…' : 'Connect with user token'}
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          {/* GitHub */}
          <div className="panel min-h-[340px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">GitHub</h3>
                <div className="mt-1 text-xs text-slate-500">
                  Pull your recent commits and active repositories using a Personal Access Token.
                </div>
              </div>
              {integrationStatus?.github?.connected ? (
                <div className="shrink-0 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-200">
                  Connected
                </div>
              ) : null}
            </div>

            {integrationStatus?.github?.connected && ghSummary ? (
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>
                  <span className="text-slate-500">User:</span>{' '}
                  {ghSummary.username || integrationStatus.github.username || '—'}
                </div>
                {ghSummary.commitsLast7Days != null ? (
                  <div>
                    <span className="text-slate-500">Commits (7d):</span> {ghSummary.commitsLast7Days}
                  </div>
                ) : null}
                {ghSummary.eventsLast7Days != null ? (
                  <div>
                    <span className="text-slate-500">Events (7d):</span> {ghSummary.eventsLast7Days}
                  </div>
                ) : null}
                {ghSummary.publicRepos != null ? (
                  <div>
                    <span className="text-slate-500">Public repos:</span> {ghSummary.publicRepos}
                  </div>
                ) : null}
                {ghSummary.topRepos?.length ? (
                  <ul className="space-y-0.5 text-xs text-slate-300">
                    <li className="text-slate-500">Most active repos (7d)</li>
                    {ghSummary.topRepos.map((r) => (
                      <li key={r.name}>
                        {r.name} <span className="text-slate-500">({r.events} events)</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="text-xs text-slate-500">{ghSummary.note}</div>
              </div>
            ) : null}

            {ghError ? (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
                {ghError}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {integrationStatus?.github?.connected ? (
                <button type="button" className="btn-secondary" onClick={disconnectGithub}>
                  Disconnect
                </button>
              ) : null}
            </div>

            {integrationStatus && !integrationStatus.github?.connected ? (
              <form
                className="mt-5 space-y-2 border-t border-white/10 pt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitGithubToken();
                }}
              >
                <div className="text-xs text-slate-400">
                  Create a GitHub Personal Access Token and paste it here. Fine-grained tokens with read-only access to
                  your user events are recommended.
                </div>
                <label className="field-label text-xs" htmlFor="gh-pat-token">
                  GitHub Personal Access Token
                </label>
                <input
                  id="gh-pat-token"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  type="password"
                  autoComplete="off"
                  className="field-control font-mono text-xs"
                  placeholder="ghp_... or github_pat_..."
                />
                <button
                  type="submit"
                  className="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                  disabled={ghBusy || !ghToken.trim()}
                >
                  {ghBusy ? 'Connecting…' : 'Connect GitHub'}
                </button>
              </form>
            ) : null}
          </div>

          {/* WakaTime */}
          <div className="panel min-h-[340px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">WakaTime</h3>
                <div className="mt-1 text-xs text-slate-500">
                  Pull coding time, languages, and projects from your WakaTime account.
                </div>
              </div>
              {integrationStatus?.wakatime?.connected ? (
                <div className="shrink-0 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-200">
                  Connected
                </div>
              ) : null}
            </div>

            {integrationStatus?.wakatime?.connected && wtSummary ? (
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>
                  <span className="text-slate-500">Today:</span> {wtSummary.todayText || '0 secs'}
                </div>
                <div>
                  <span className="text-slate-500">Last 7 days:</span> {wtSummary.totalText7d || '0 secs'}
                </div>
                <div>
                  <span className="text-slate-500">Days tracked:</span> {wtSummary.daysTracked ?? 0}
                </div>
                {wtSummary.languagesToday?.length ? (
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Top languages (today)</span>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {wtSummary.languagesToday.map((lang) => (
                        <li key={lang.name}>
                          {lang.name}{' '}
                          <span className="text-slate-500">
                            ({lang.text || `${lang.percent ?? 0}%`})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {wtSummary.projectsToday?.length ? (
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Top projects (today)</span>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {wtSummary.projectsToday.map((proj) => (
                        <li key={proj.name}>
                          {proj.name}{' '}
                          <span className="text-slate-500">
                            ({proj.text || `${proj.percent ?? 0}%`})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="text-xs text-slate-500">{wtSummary.note}</div>
              </div>
            ) : null}

            {wtError ? (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
                {wtError}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {integrationStatus?.wakatime?.connected ? (
                <button type="button" className="btn-secondary" onClick={disconnectWakaTime}>
                  Disconnect
                </button>
              ) : null}
            </div>

            {integrationStatus && !integrationStatus.wakatime?.connected ? (
              <form
                className="mt-5 space-y-2 border-t border-white/10 pt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitWakaTimeKey();
                }}
              >
                <div className="text-xs text-slate-400">
                  Paste your WakaTime API key from settings. It stays on your account and is used only to fetch
                  summaries.
                </div>
                <label className="field-label text-xs" htmlFor="wt-api-key">
                  WakaTime API key
                </label>
                <input
                  id="wt-api-key"
                  value={wtApiKey}
                  onChange={(e) => setWtApiKey(e.target.value)}
                  type="password"
                  autoComplete="off"
                  className="field-control font-mono text-xs"
                  placeholder="waka_..."
                />
                <button
                  type="submit"
                  className="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                  disabled={wtBusy || !wtApiKey.trim()}
                >
                  {wtBusy ? 'Connecting…' : 'Connect WakaTime'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Detailed integration cards are hidden. Use <strong className="text-slate-100">Show details</strong> to
          connect/disconnect or update tokens.
        </div>
      )}
    </div>
  );
}

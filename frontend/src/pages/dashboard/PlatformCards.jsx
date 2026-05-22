import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, scaleIn } from '../../motion/presets.js';

function ConnectedBadge({ connected }) {
  return (
    <motion.span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        connected ? 'bg-teal-500/15 text-teal-200' : 'bg-slate-500/20 text-slate-400'
      }`}
      animate={connected ? { opacity: [1, 0.85, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {connected ? 'Connected' : 'Not connected'}
    </motion.span>
  );
}

function PlatformCard({ to, platform, title, connected, children }) {
  return (
    <motion.div variants={scaleIn} className="min-w-0" whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}>
      <Link
        to={to}
        className="platform-card-link block rounded-xl text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/45"
      >
        <article className={`panel platform-card platform-card--${platform} flex h-full flex-col overflow-hidden p-0`}>
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.03]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</span>
            <ConnectedBadge connected={connected} />
          </header>
          <div className="flex flex-1 flex-col gap-2 px-4 py-4 text-sm text-slate-300">{children}</div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function PlatformCards({
  integrationStatus,
  ytSummary,
  igSummary,
  ghSummary,
  wtSummary,
  igSummaryError,
  ghError,
  wtError,
}) {
  return (
    <motion.div
      className="platform-grid"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <PlatformCard
        to="/integrations/youtube"
        platform="youtube"
        title="YouTube"
        connected={integrationStatus?.youtube?.connected}
      >
        {integrationStatus?.youtube?.connected && ytSummary ? (
          <>
            <p>
              <span className="text-slate-500">Channel ·</span>{' '}
              {ytSummary.channelTitle || integrationStatus.youtube.channelTitle || '—'}
            </p>
            {ytSummary.subscriberCount != null && (
              <p>
                <span className="text-slate-500">Subscribers ·</span> {ytSummary.subscriberCount}
              </p>
            )}
          </>
        ) : integrationStatus?.youtube?.connected ? (
          <p className="text-slate-500">Loading summary…</p>
        ) : (
          <p className="text-slate-500">Connect to show channel activity.</p>
        )}
      </PlatformCard>

      <PlatformCard
        to="/integrations/instagram"
        platform="instagram"
        title="Instagram"
        connected={integrationStatus?.instagram?.connected}
      >
        {integrationStatus?.instagram?.connected && igSummary ? (
          <>
            <p>
              <span className="text-slate-500">Profile ·</span> @
              {igSummary.username || integrationStatus.instagram.username || '—'}
            </p>
            {igSummary.followersCount != null && (
              <p>
                <span className="text-slate-500">Followers ·</span> {igSummary.followersCount}
              </p>
            )}
          </>
        ) : integrationStatus?.instagram?.connected ? (
          <p className="text-slate-500">{igSummaryError || 'Loading…'}</p>
        ) : (
          <p className="text-slate-500">Connect for profile stats.</p>
        )}
      </PlatformCard>

      <PlatformCard
        to="/integrations/github"
        platform="github"
        title="GitHub"
        connected={integrationStatus?.github?.connected}
      >
        {integrationStatus?.github?.connected && ghSummary ? (
          <>
            <p>
              <span className="text-slate-500">User ·</span> {ghSummary.username || '—'}
            </p>
            {ghSummary.commitsLast7Days != null && (
              <p>
                <span className="text-slate-500">Commits (7d) ·</span> {ghSummary.commitsLast7Days}
              </p>
            )}
          </>
        ) : integrationStatus?.github?.connected ? (
          <p className="text-slate-500">{ghError || 'Loading…'}</p>
        ) : (
          <p className="text-slate-500">Connect for commits & activity.</p>
        )}
      </PlatformCard>

      <PlatformCard
        to="/integrations/wakatime"
        platform="wakatime"
        title="WakaTime"
        connected={integrationStatus?.wakatime?.connected}
      >
        {integrationStatus?.wakatime?.connected && wtSummary ? (
          <>
            <p>
              <span className="text-slate-500">Today ·</span> {wtSummary.todayText || '—'}
            </p>
            <p>
              <span className="text-slate-500">Last 7 days ·</span> {wtSummary.totalText7d || '—'}
            </p>
          </>
        ) : integrationStatus?.wakatime?.connected ? (
          <p className="text-slate-500">{wtError || 'Loading…'}</p>
        ) : (
          <p className="text-slate-500">Add API key for coding time.</p>
        )}
      </PlatformCard>
    </motion.div>
  );
}

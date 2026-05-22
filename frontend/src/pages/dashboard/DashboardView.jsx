import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { AnimatePresence, motion } from 'framer-motion';

import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import AnimatedNumber from '../../components/AnimatedNumber.jsx';
import LoadingSkeleton from '../../components/LoadingSkeleton.jsx';
import { fadeUp, staggerContainer, scaleIn } from '../../motion/presets.js';
import StatCard from '../../components/StatCard.jsx';
import ChartCard from '../../components/ChartCard.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';

import PlatformCards from './PlatformCards.jsx';
import DashboardIntegrationsManager from './DashboardIntegrationsManager.jsx';

import { DAILY_METRIC_FIELDS } from '../../constants/dailyMetrics.js';

export default function DashboardView(props) {
  const {
    moodLabels,
    dashboardTabs,
    reportWindowTabs,
    barChartOptions,
    loading,
    error,
    integrationBanner,
    setIntegrationBanner,
    integrationStatus,
    ytSummary,
    igSummary,
    ghSummary,
    wtSummary,
    igSummaryError,
    ghError,
    wtError,
    integrationsLoading,
    goals,
    insights,
    todayLog,
    allLogs,
    projects,
    form,
    setForm,
    metricsForm,
    setMetricsForm,
    newProject,
    setNewProject,
    goalsForm,
    setGoalsForm,
    goalsSubmitting,
    formSubmitting,
    projectSubmitting,
    igManualPageToken,
    setIgManualPageToken,
    igManualIgUserId,
    setIgManualIgUserId,
    igUserAccessToken,
    setIgUserAccessToken,
    igManualBusy,
    igUserTokenBusy,
    igManualError,
    ghToken,
    setGhToken,
    ghBusy,
    wtApiKey,
    setWtApiKey,
    wtBusy,
    showDetailedIntegrations,
    setShowDetailedIntegrations,
    today,
    selectedDate,
    setSelectedDate,
    chartWindowOffset,
    currentTheme,
    isDayTheme,
    activeTab,
    setActiveTab,
    reportWindow,
    setReportWindow,
    sampleWeekBusy,
    showAdvancedLog,
    setShowAdvancedLog,
    showPlatformPulse,
    setShowPlatformPulse,
    chartWeek,
    lineChartData,
    lineChartOptions,
    barChartData,
    sortedLogs,
    selectedLog,
    displayLog,
    selectedDateLabel,
    chartWindowInfo,
    summarySteps,
    summaryCoding,
    summaryIg,
    summaryMood,
    yesterdayLog,
    todayScore,
    codingDelta,
    focusStatus,
    chartInsights,
    integrationHealth,
    stepsGoalPct,
    codingGoalPct,
    commandCenterCards,
    platform3dRows,
    platform3dData,
    platformPulseBreakdown,
    platformPulseScore,
    platform3dOptions,
    integrationOverview,
    insertSampleWeek,
    connectYoutube,
    connectInstagram,
    disconnectYoutube,
    disconnectInstagram,
    submitGithubToken,
    disconnectGithub,
    submitWakaTimeKey,
    disconnectWakaTime,
    submitInstagramManual,
    submitInstagramUserToken,
    submitLog,
    addProject,
    updateProjectStatus,
    saveGoals,
    shiftSelectedDate,
    shiftChartWindow,
    summaryMetric,
    openIntegrationsManager,
  } = props;

  const showOverviewPerf = activeTab === 'overview' || activeTab === 'performance';
  const showOverviewInt = activeTab === 'overview' || activeTab === 'integrations';

  const wtMaxSeconds = Math.max(1, ...(wtSummary?.daily || []).map((x) => x.seconds || 0));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpiCards = [
    {
      key: 'score',
      label: 'Today score',
      value: (
        <>
          <AnimatedNumber value={todayScore} />
          <span className="kpi-unit">/100</span>
        </>
      ),
      animateNumber: true,
      accent: 'kpi-accent-score',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      key: 'steps',
      label: 'Steps',
      value: <AnimatedNumber value={summarySteps} />,
      animateNumber: true,
      accent: 'kpi-accent-steps',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      key: 'coding',
      label: 'Coding',
      value: (
        <>
          <AnimatedNumber value={summaryCoding} />
          <span className="kpi-unit">hrs</span>
        </>
      ),
      animateNumber: true,
      accent: 'kpi-accent-code',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      key: 'focus',
      label: 'Focus',
      value: <span className={focusStatus.tone}>{focusStatus.label}</span>,
      accent: 'kpi-accent-focus',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dash-page min-h-screen w-full min-w-0 overflow-x-clip pb-24">
      <motion.header
        className="dash-hero-modern"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="dash-hero-glow" aria-hidden />
        <motion.div
          className="hero-shine"
          aria-hidden
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <motion.p
                className="text-sm font-medium text-slate-500"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {greeting} · <span className="text-slate-300">{selectedDateLabel}</span>
              </motion.p>
              <motion.h1
                className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55 }}
              >
                Your <span className="text-gradient-brand text-gradient-animate">dashboard</span>
              </motion.h1>
              <motion.p
                className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
              >
                Steps, coding, mood & connected apps — one calm view for today.
              </motion.p>
            </motion.div>
            <motion.div
              className="flex flex-col gap-3 sm:items-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                className="live-pill"
                animate={{ boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 20px rgba(34,211,238,0.35)', '0 0 0 rgba(34,211,238,0)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <span className="live-dot" />
                <span>Live · UTC</span>
              </motion.div>
              <div className="date-stepper">
                <motion.button
                  type="button"
                  className="date-stepper-btn"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => shiftSelectedDate(-1)}
                  aria-label="Previous day"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <input
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  type="date"
                  className="date-stepper-input"
                />
                <motion.button
                  type="button"
                  className="date-stepper-btn"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => shiftSelectedDate(1)}
                  aria-label="Next day"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="dash-main mx-auto w-full min-w-0 max-w-7xl scroll-smooth px-4 py-8 sm:px-6 sm:py-10">
        {error ? (
          <div role="alert" className="dash-alert dash-alert-error mb-6">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0 text-base" aria-hidden="true">
                ⚠
              </div>
              <div>{error}</div>
            </div>
          </div>
        ) : null}

        {integrationBanner ? (
          <div
            className={`dash-alert ${
              integrationBanner.kind === 'error' ? 'dash-alert-error' : 'dash-alert-success'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0 text-base" aria-hidden="true">
                {integrationBanner.kind === 'error' ? '✕' : '✓'}
              </div>
              <div>{integrationBanner.text}</div>
            </div>
            <button
              type="button"
              className="rounded-full border border-current/20 px-3 py-1 text-xs font-medium opacity-90 hover:bg-white/10"
              onClick={() => setIntegrationBanner(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="dash-layout">
            <DashboardSidebar
              tabs={dashboardTabs}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              chartWindowInfo={chartWindowInfo}
              integrationHealth={integrationHealth}
            />

            <div className="dash-content min-w-0">
              <motion.section
                className="dash-toolbar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="dash-toolbar-chips">
                  {reportWindowTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`report-chip ${reportWindow === tab.key ? 'report-chip-active' : ''}`}
                      onClick={() => setReportWindow(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <Link to="/integrations" className="btn-primary shrink-0 px-4 py-2 text-xs">
                  Integrations
                </Link>
              </motion.section>

              <motion.section
                className="dash-kpi-section"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <div className="kpi-grid">
                  {kpiCards.map((card) => (
                    <motion.article
                      key={card.key}
                      className={`kpi-card ${card.accent}`}
                      variants={scaleIn}
                      whileHover={{ y: -4 }}
                    >
                      <motion.div
                        className="kpi-card-icon"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {card.icon}
                      </motion.div>
                      <div className="kpi-card-body">
                        <p className="kpi-card-label">{card.label}</p>
                        <p className="kpi-card-value">{card.value}</p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.section>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35 }}
                >

              {showOverviewInt ? (
                <section className="dash-reveal mb-14">
                  <div className="dash-section-head">
                    <div className="min-w-0 flex-1">
                      <div className="dash-eyebrow">Integrations</div>
                      <h2 className="dash-title">Connected platforms</h2>
                      <p className="dash-desc">
                        Status and key metrics per platform. Click a card to open that platform’s workspace.
                      </p>
                    </div>
                    <Link
                      to="/integrations"
                      className="btn-primary shrink-0 self-start px-5 py-2.5 text-xs font-semibold"
                    >
                      Manage integrations
                    </Link>
                  </div>

                  <PlatformCards
                    integrationStatus={integrationStatus}
                    ytSummary={ytSummary}
                    igSummary={igSummary}
                    ghSummary={ghSummary}
                    wtSummary={wtSummary}
                    igSummaryError={igSummaryError}
                    ghError={ghError}
                    wtError={wtError}
                  />
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal mb-14">
                  <div className="dash-section-head border-0 pb-0">
                    <div>
                      <div className="dash-eyebrow">Insights</div>
                      <h2 className="dash-title">Focus intelligence</h2>
                      <div className="dash-desc">
                        Score, momentum, and a single insight from your logs — skim this before diving into charts.
                      </div>
                    </div>
                  </div>
                  <div className="panel mb-6 p-5 sm:p-6">
                    <div className="dash-intel-grid">
                      <div className="dash-intel-cell">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Coding delta
                        </div>
                        <div className="mt-2 text-sm font-medium leading-snug text-slate-200">
                          {codingDelta?.text || 'Log today to compare with yesterday'}
                        </div>
                      </div>
                      <div className="dash-intel-cell">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Focus</div>
                        <div className={`mt-2 text-sm font-semibold leading-snug ${focusStatus.tone}`}>
                          {focusStatus.label}
                        </div>
                      </div>
                      <div className="dash-intel-cell md:col-span-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Insight
                        </div>
                        <div className="mt-2 text-sm font-medium leading-snug text-slate-200">
                          {chartInsights[1] || 'Patterns improve as you log more — try a consistent check-in time.'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Steps" value={summarySteps} />
                    <StatCard label="Coding hours" value={summaryCoding} />
                    <StatCard label="Instagram" value={summaryIg} />
                    <StatCard label="Mood" value={summaryMood} />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Calories (est.)" value={summaryMetric('caloriesBurned')} />
                    <StatCard label="Music (min)" value={summaryMetric('musicMinutes')} />
                    <StatCard label="Job applications" value={summaryMetric('jobApplications')} />
                    <StatCard label="Sleep" value={summaryMetric('sleepHours')} />
                  </div>

                  {goals ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="panel p-6">
                        <div className="text-sm font-medium text-slate-500">Steps vs goal</div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold">{summarySteps}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-lg text-slate-400">{goals.dailyStepsGoal}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(summarySteps) / goals.dailyStepsGoal) * 100 || 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="panel p-6">
                        <div className="text-sm font-medium text-slate-500">Coding vs goal</div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold">{summaryCoding}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-lg text-slate-400">{goals.dailyCodingGoal} hrs</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-600 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(summaryCoding) / goals.dailyCodingGoal) * 100 || 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal mb-14">
                  <div className="dash-section-head border-0 pb-4">
                    <div>
                      <div className="dash-eyebrow">Charts</div>
                      <h2 className="dash-title text-xl">Performance radar</h2>
                      <div className="dash-desc max-w-lg">
                        Cross-platform snapshot: coding, shipping, social signals, and overall link health.
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                      <div className="h-2 w-2 rounded-full bg-teal-400/90" aria-hidden="true" />
                      Health {integrationHealth.pct}%
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    {commandCenterCards.map((card) => (
                      <div
                        key={card.key}
                        className={`panel command-center-card group min-h-[128px] p-5 transition duration-300 command-center-card--${card.key}`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {card.title}
                        </div>
                        <div className="font-display mt-2 text-xl font-semibold tracking-tight text-slate-100">
                          {card.value}
                        </div>
                        <div className="mt-2 text-xs leading-relaxed text-slate-400">{card.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <article className="panel ring-card p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Steps goal
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div
                          className="ring-meter"
                          style={{
                            background: `conic-gradient(#22d3ee ${stepsGoalPct}%, rgba(148,163,184,0.22) ${stepsGoalPct}% 100%)`,
                          }}
                        >
                          <div className="ring-meter-inner">{stepsGoalPct}%</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {summarySteps} / {goals?.dailyStepsGoal || 0} steps
                        </div>
                      </div>
                    </article>
                    <article className="panel ring-card p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Coding goal
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div
                          className="ring-meter"
                          style={{
                            background: `conic-gradient(#60a5fa ${codingGoalPct}%, rgba(148,163,184,0.22) ${codingGoalPct}% 100%)`,
                          }}
                        >
                          <div className="ring-meter-inner">{codingGoalPct}%</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {summaryCoding} / {goals?.dailyCodingGoal || 0} hrs
                        </div>
                      </div>
                    </article>
                    <article className="panel ring-card p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Integration health
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div
                          className="ring-meter"
                          style={{
                            background: `conic-gradient(#34d399 ${integrationHealth.pct}%, rgba(148,163,184,0.22) ${integrationHealth.pct}% 100%)`,
                          }}
                        >
                          <div className="ring-meter-inner">{integrationHealth.pct}%</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {integrationHealth.connected}/{integrationHealth.total} channels online
                        </div>
                      </div>
                    </article>
                  </div>

                  {wtSummary?.daily?.length ? (
                    <div className="panel mt-4 p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-200">WakaTime coding trend (last 7 days)</div>
                        <div className="text-xs text-slate-500">{wtSummary.totalText7d || '0 secs'}</div>
                      </div>
                      <div className="space-y-2">
                        {wtSummary.daily.map((d) => (
                          <div
                            key={d.date}
                            className="grid grid-cols-[64px_1fr_auto] items-center gap-3"
                          >
                            <div className="text-xs text-slate-500">{d.date?.slice(5) || '--'}</div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-300/20">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-600"
                                style={{
                                  width: `${Math.min(100, ((d.seconds || 0) / wtMaxSeconds) * 100)}%`,
                                  opacity: d.seconds ? 1 : 0.28,
                                }}
                              />
                            </div>
                            <div className="text-xs text-slate-400">{d.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal mb-14">
                  <div className="dash-section-head border-0 pb-4">
                    <div>
                      <div className="dash-eyebrow">Trends</div>
                      <h2 className="dash-title text-xl">Ecosystem pulse</h2>
                      <div className="dash-desc max-w-lg">
                        Normalized intensity vs consistency — useful for spotting imbalance across channels.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                      onClick={() => setShowPlatformPulse(!showPlatformPulse)}
                    >
                      {showPlatformPulse ? 'Hide chart' : 'Show chart'}
                    </button>
                  </div>
                  {showPlatformPulse ? (
                    <div className="panel p-5">
                      <div className="mb-3 text-xs text-slate-500">
                        Unified score view for Instagram, GitHub, WakaTime, and YouTube.
                      </div>
                      <div className="mb-3 text-sm font-medium text-slate-200">
                        Platform Pulse Score: <span className="text-brand-accent">{platformPulseScore}/100</span>
                      </div>
                      <div className="relative min-h-[300px]">
                        <Bar data={platform3dData} options={platform3dOptions} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {platformPulseBreakdown.map((p) => (
                          <div key={p.name} className="dash-intel-cell rounded-xl px-4 py-3 text-sm">
                            <div className="font-display font-semibold text-slate-100">
                              {p.name} <span className="text-brand-accent">{p.score}</span>
                            </div>
                            <div className="mt-1 text-xs leading-relaxed text-slate-400">{p.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="dash-reveal mb-14">
                <div className="panel flex flex-wrap items-center gap-6 px-6 py-5">
                  <div className="min-w-[200px] flex-1">
                    <div className="dash-eyebrow text-[10px]">Links</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-300">
                      <span className="font-display text-lg font-semibold text-slate-100">
                        {integrationHealth.connected}
                      </span>
                      <span className="text-slate-500"> / {integrationHealth.total}</span>
                      integrations active ·
                      <Link to="/integrations" className="link-accent font-semibold">
                        {' '}
                        Configure
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {integrationOverview.map((item) => (
                      <div
                        key={item.key}
                        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] ${
                          item.connected
                            ? 'border-teal-500/22 bg-teal-500/10 text-teal-100'
                            : 'border-white/10 bg-white/[0.04] text-slate-400'
                        }`}
                      >
                        {item.name}
                        <span className="font-semibold">{item.connected ? 'On' : 'Off'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {integrationOverview.some((x) => x.warning) ? (
                  <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-950/35 px-4 py-3 text-xs text-sky-100">
                    {integrationOverview
                      .filter((x) => x.warning)
                      .map((item) => (
                        <div key={`${item.key}-w`}>
                          <strong>{item.name}:</strong> {item.warning}
                        </div>
                      ))}
                  </div>
                ) : null}
              </section>

              {activeTab === 'integrations' ? (
                <DashboardIntegrationsManager
                  integrationStatus={integrationStatus}
                  integrationsLoading={integrationsLoading}
                  showDetailedIntegrations={showDetailedIntegrations}
                  setShowDetailedIntegrations={setShowDetailedIntegrations}
                  ytSummary={ytSummary}
                  igSummary={igSummary}
                  ghSummary={ghSummary}
                  wtSummary={wtSummary}
                  igSummaryError={igSummaryError}
                  ghError={ghError}
                  wtError={wtError}
                  connectYoutube={connectYoutube}
                  disconnectYoutube={disconnectYoutube}
                  connectInstagram={connectInstagram}
                  disconnectInstagram={disconnectInstagram}
                  igManualPageToken={igManualPageToken}
                  setIgManualPageToken={setIgManualPageToken}
                  igManualIgUserId={igManualIgUserId}
                  setIgManualIgUserId={setIgManualIgUserId}
                  igManualBusy={igManualBusy}
                  igManualError={igManualError}
                  submitInstagramManual={submitInstagramManual}
                  igUserAccessToken={igUserAccessToken}
                  setIgUserAccessToken={setIgUserAccessToken}
                  igUserTokenBusy={igUserTokenBusy}
                  submitInstagramUserToken={submitInstagramUserToken}
                  ghToken={ghToken}
                  setGhToken={setGhToken}
                  ghBusy={ghBusy}
                  submitGithubToken={submitGithubToken}
                  disconnectGithub={disconnectGithub}
                  wtApiKey={wtApiKey}
                  setWtApiKey={setWtApiKey}
                  wtBusy={wtBusy}
                  submitWakaTimeKey={submitWakaTimeKey}
                  disconnectWakaTime={disconnectWakaTime}
                />
              ) : null}

              {goals && showOverviewPerf ? (
                <section className="dash-reveal mb-10">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Goals</h2>
                  <form
                    className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-end"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveGoals();
                    }}
                  >
                    <div className="flex-1">
                      <label className="field-label text-xs" htmlFor="goals-steps">
                        Daily steps goal
                      </label>
                      <input
                        id="goals-steps"
                        type="number"
                        min="0"
                        className="field-control text-sm"
                        required
                        value={goalsForm.dailyStepsGoal}
                        onChange={(e) =>
                          setGoalsForm((f) => ({ ...f, dailyStepsGoal: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="field-label text-xs" htmlFor="goals-coding">
                        Daily coding goal (hours)
                      </label>
                      <input
                        id="goals-coding"
                        type="number"
                        min="0"
                        step="0.5"
                        className="field-control text-sm"
                        required
                        value={goalsForm.dailyCodingGoal}
                        onChange={(e) =>
                          setGoalsForm((f) => ({ ...f, dailyCodingGoal: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <button type="submit" className="btn-primary rounded-xl px-5 py-2.5" disabled={goalsSubmitting}>
                      {goalsSubmitting ? 'Saving…' : 'Update goals'}
                    </button>
                  </form>
                </section>
              ) : null}

              {insights && showOverviewPerf ? (
                <section className="dash-reveal mb-10">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Smart brief</h2>
                  <div
                    className={`insights-panel rounded-2xl p-6 shadow-lg shadow-black/20 ${
                      isDayTheme
                        ? 'border border-blue-200/80 bg-gradient-to-br from-sky-50 to-blue-100'
                        : 'border border-white/8 bg-slate-900/55'
                    }`}
                  >
                    <ul className={`space-y-3 text-sm ${isDayTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      <li className="flex gap-2">
                        <span className={isDayTheme ? 'text-blue-500' : 'text-slate-500'}>●</span>
                        <span>
                          {insights.stepGoalMet
                            ? 'You met your step goal today'
                            : 'You have not met your step goal yet today'}
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-slate-400">●</span>
                        <span>
                          {insights.codingGoalMet
                            ? 'You met your coding goal today'
                            : 'You have not met your coding goal yet today'}
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className={isDayTheme ? 'text-cyan-600' : 'text-slate-500'}>●</span>
                        <span>
                          {insights.instagramUsageStatus === 'high'
                            ? 'You spent too much time on Instagram'
                            : insights.instagramUsageStatus === 'medium'
                              ? 'Instagram usage is moderate today'
                              : 'Instagram usage is low today'}
                        </span>
                      </li>
                    </ul>
                    <div className={`mt-4 text-xs ${isDayTheme ? 'text-slate-600' : 'text-slate-500'}`}>
                      Instagram bands: low under 30 min, medium 30–59 min, high 60+ min (UTC day).
                    </div>
                    <div className={`mt-2 text-xs ${isDayTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                      AI-lite suggestions update as your logs + integration trends grow.
                    </div>
                  </div>
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal mb-10">
                  <div
                    className={`intelligence-strip mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 ${
                      isDayTheme ? 'border-blue-200/70 bg-gradient-to-r from-white to-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Last 7 days intelligence
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-xs"
                          disabled={!chartWindowInfo.hasOlder}
                          onClick={() => shiftChartWindow(7)}
                        >
                          ◀ Older
                        </button>
                        <div className="text-[11px] text-slate-400">
                          {chartWindowInfo.first || '—'} → {chartWindowInfo.last || '—'}
                        </div>
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-xs"
                          disabled={!chartWindowInfo.hasNewer}
                          onClick={() => shiftChartWindow(-7)}
                        >
                          Newer ▶
                        </button>
                      </div>
                    </div>
                    <ul
                      className={`dash-chart-tips mt-2 space-y-1 text-sm ${
                        isDayTheme ? 'text-slate-700' : 'text-teal-50/90'
                      }`}
                    >
                      {chartInsights.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {chartWeek.isDemo ? (
                    <div
                      className={`mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                        isDayTheme
                          ? 'border-sky-500/25 bg-sky-950/30 text-sky-100/95'
                          : 'border-white/10 bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="text-xs leading-relaxed sm:text-sm">
                        <strong className={isDayTheme ? 'text-sky-50' : 'text-slate-200'}>Preview:</strong> charts
                        below use <strong>sample numbers</strong> until you add real logs. Click the button to save this
                        sample week to your database, or fill the daily log form.
                      </div>
                      <button
                        type="button"
                        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                          isDayTheme
                            ? 'border-sky-400/40 bg-sky-900/40 text-sky-50 hover:bg-sky-900/60'
                            : 'border-white/12 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                        }`}
                        disabled={sampleWeekBusy || loading}
                        onClick={insertSampleWeek}
                      >
                        {sampleWeekBusy ? 'Saving…' : 'Save sample week to database'}
                      </button>
                    </div>
                  ) : null}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <ChartCard title="Last 7 days" subtitle="Steps and coding hours">
                      <div className="relative min-h-[260px]">
                        {chartWeek.isDemo ? (
                          <div
                            className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-dashed ring-white/10"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Line data={lineChartData} options={lineChartOptions} />
                      </div>
                    </ChartCard>
                    <ChartCard title="Screen time" subtitle="Stacked minutes (last 7 days)">
                      <div className="relative min-h-[260px]">
                        {chartWeek.isDemo ? (
                          <div
                            className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-dashed ring-white/10"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Bar data={barChartData} options={barChartOptions} />
                      </div>
                    </ChartCard>
                  </div>
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal mb-10">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Daily log</h2>
                  <form
                    className="panel grid gap-4 p-6 md:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitLog();
                    }}
                  >
                    <div>
                      <label className="field-label text-xs" htmlFor="log-steps">
                        Steps
                      </label>
                      <input
                        id="log-steps"
                        type="number"
                        min="0"
                        className="field-control text-sm"
                        required
                        value={form.steps}
                        onChange={(e) => setForm((f) => ({ ...f, steps: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="log-ig">
                        Instagram (min)
                      </label>
                      <input
                        id="log-ig"
                        type="number"
                        min="0"
                        className="field-control text-sm"
                        required
                        value={form.instagram}
                        onChange={(e) => setForm((f) => ({ ...f, instagram: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="log-screen">
                        Total screen time (min)
                      </label>
                      <input
                        id="log-screen"
                        type="number"
                        min="0"
                        className="field-control text-sm"
                        required
                        value={form.totalScreen}
                        onChange={(e) => setForm((f) => ({ ...f, totalScreen: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="log-coding">
                        Coding hours
                      </label>
                      <input
                        id="log-coding"
                        type="number"
                        min="0"
                        step="0.25"
                        className="field-control text-sm"
                        required
                        value={form.codingHours}
                        onChange={(e) => setForm((f) => ({ ...f, codingHours: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="log-mood">
                        Mood
                      </label>
                      <select
                        id="log-mood"
                        className="field-control text-sm"
                        value={form.mood}
                        onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
                      >
                        <option value="productive">{moodLabels.productive}</option>
                        <option value="average">{moodLabels.average}</option>
                        <option value="low">{moodLabels.low}</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="field-label text-xs" htmlFor="log-notes">
                        Notes
                      </label>
                      <textarea
                        id="log-notes"
                        rows={3}
                        className="field-control text-sm"
                        placeholder="Reflections, wins, blockers…"
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        className="btn-secondary mb-3 text-xs"
                        onClick={() => setShowAdvancedLog(!showAdvancedLog)}
                      >
                        {showAdvancedLog ? 'Hide advanced metrics' : 'Show advanced metrics'}
                      </button>
                    </div>

                    {showAdvancedLog ? (
                      <div className="md:col-span-2 border-t border-white/10 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-200">
                          Extended metrics (manual — automate later per roadmap)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {DAILY_METRIC_FIELDS.map((field) => (
                            <div key={field.key}>
                              <label className="field-label text-xs" htmlFor={`metric-${field.key}`}>
                                {field.label}
                                {field.suffix ? (
                                  <span className="text-slate-400"> ({field.suffix})</span>
                                ) : null}
                              </label>
                              <input
                                id={`metric-${field.key}`}
                                type="text"
                                inputMode="decimal"
                                className="field-control text-sm"
                                placeholder="0"
                                value={metricsForm[field.key]}
                                onChange={(e) =>
                                  setMetricsForm((m) => ({ ...m, [field.key]: e.target.value }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                      <button type="submit" className="btn-primary rounded-xl px-5 py-2.5" disabled={formSubmitting}>
                        {formSubmitting ? 'Saving…' : 'Save log for today'}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {showOverviewPerf ? (
                <section className="dash-reveal">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Projects</h2>
                  <div className="panel mb-6 grid gap-4 p-6 md:grid-cols-2">
                    <div>
                      <label className="field-label text-xs" htmlFor="proj-name">
                        Name
                      </label>
                      <input
                        id="proj-name"
                        type="text"
                        className="field-control text-sm"
                        required
                        value={newProject.name}
                        onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="proj-status">
                        Status
                      </label>
                      <select
                        id="proj-status"
                        className="field-control text-sm"
                        value={newProject.status}
                        onChange={(e) => setNewProject((p) => ({ ...p, status: e.target.value }))}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label text-xs" htmlFor="proj-hours">
                        Hours spent
                      </label>
                      <input
                        id="proj-hours"
                        type="number"
                        min="0"
                        step="0.5"
                        className="field-control text-sm"
                        required
                        value={newProject.hoursSpent}
                        onChange={(e) =>
                          setNewProject((p) => ({ ...p, hoursSpent: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="field-label text-xs" htmlFor="proj-desc">
                        Description
                      </label>
                      <input
                        id="proj-desc"
                        type="text"
                        className="field-control text-sm"
                        value={newProject.description}
                        onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        className="btn-secondary rounded-xl px-5 py-2.5 font-semibold disabled:opacity-60"
                        disabled={projectSubmitting || !newProject.name}
                        onClick={addProject}
                      >
                        {projectSubmitting ? 'Adding…' : 'Add project'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {projects.map((p) => (
                      <ProjectCard key={p._id} project={p} onUpdateStatus={updateProjectStatus} />
                    ))}
                    {!projects.length ? <div className="text-sm text-slate-500">No projects yet.</div> : null}
                  </div>
                </section>
              ) : null}

              {activeTab === 'rag' ? (
                <section className="dash-reveal mb-10">
                  <div className="dash-section-head border-0 pb-4">
                    <div>
                      <div className="dash-eyebrow">Workspace</div>
                      <h2 className="dash-title text-xl">RAG workspace</h2>
                      <div className="dash-desc max-w-lg">
                        Plug your retrieval system here to generate real-time context insights from your dashboard data.
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="panel p-5 lg:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Context feed</div>
                      <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4">
                        <div className="text-sm text-slate-300">
                          RAG module not connected yet. This area will show retrieved context chunks and live citations
                          from integrations, logs, and projects.
                        </div>
                        <ul className="mt-3 space-y-1 text-xs text-slate-400">
                          <li>• Latest integration summaries</li>
                          <li>• Trend deltas over selected window</li>
                          <li>• Project updates + daily note embeddings</li>
                        </ul>
                      </div>
                    </div>

                    <div className="panel p-5">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Pipeline status</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        <div>
                          <span className="text-slate-500">Retriever:</span> Not connected
                        </div>
                        <div>
                          <span className="text-slate-500">Vector DB:</span> Not connected
                        </div>
                        <div>
                          <span className="text-slate-500">Indexer:</span> Ready for setup
                        </div>
                      </div>
                      <button type="button" className="btn-primary mt-4 w-full text-sm">
                        Configure RAG (coming soon)
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {!loading ? (
        <motion.div
          className="today-status-bar fixed bottom-4 left-1/2 z-30 flex w-[min(94vw,900px)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-white/10 bg-[rgba(12,14,20,0.88)] px-5 py-3 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.5 }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm">
            <span className="font-semibold text-slate-100">{selectedDateLabel}</span>
            <span className="text-slate-400">Score: {todayScore}</span>
            <span className="text-slate-200">Coding: {summaryCoding}</span>
            <span className="text-slate-200">Instagram: {summaryIg}</span>
            <span className={focusStatus.tone}>Focus: {focusStatus.label}</span>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

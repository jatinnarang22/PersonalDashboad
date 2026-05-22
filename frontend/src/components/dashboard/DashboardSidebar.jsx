import { motion } from 'framer-motion';
import DashboardTabIcon from '../DashboardTabIcon.jsx';
import { fadeUp, staggerContainer, easeSpring } from '../../motion/presets.js';

export default function DashboardSidebar({
  tabs,
  activeTab,
  onSelectTab,
  chartWindowInfo,
  integrationHealth,
}) {
  return (
    <motion.aside
      className="dash-sidebar panel min-w-0 w-full p-3 xl:sticky xl:top-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="sidebar-label">Workspace</p>

      <motion.nav
        className="dash-sidebar-nav mt-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        aria-label="Dashboard sections"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              type="button"
              className={`sidebar-tab ${isActive ? 'sidebar-tab-active' : ''}`}
              variants={fadeUp}
              whileHover={{ transition: easeSpring }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTab(tab.key)}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="sidebar-active-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <DashboardTabIcon name={tab.key} active={isActive} />
              <span className="relative z-10 min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold leading-tight">{tab.label}</span>
                <span className="sidebar-tab-hint hidden truncate text-[11px] font-normal text-slate-500 xl:block">
                  {tab.hint}
                </span>
              </span>
            </motion.button>
          );
        })}
      </motion.nav>

      <motion.div
        className="sidebar-widget mt-4 hidden xl:block"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chart window</p>
        <p className="mt-1.5 truncate text-xs text-slate-400">
          {chartWindowInfo.first || '—'} → {chartWindowInfo.last || '—'}
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Integration health</span>
            <span className="font-semibold text-cyan-300">{integrationHealth.pct}%</span>
          </div>
          <div className="health-bar mt-1.5">
            <motion.div
              className="health-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${integrationHealth.pct}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.15 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}

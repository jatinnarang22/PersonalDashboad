import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrandLogo from './components/BrandLogo.jsx';
import AnimatedBackground from './components/AnimatedBackground.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { pageTransition } from './motion/presets.js';

const NAV = [
  { key: 'dashboard', label: 'Home', to: '/' },
  { key: 'integrations', label: 'Integrations', to: '/integrations' },
  { key: 'blog', label: 'Blog', to: '/blog' },
  { key: 'profile', label: 'Profile', to: '/profile?edit=1' },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logoutAndClear } = useAuth();
  const [theme, setTheme] = useState('night');

  useEffect(() => {
    const saved = localStorage.getItem('pld-theme');
    if (saved === 'day' || saved === 'night') setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pld-theme', theme);
  }, [theme]);

  function isActive(item) {
    if (item.key === 'dashboard') return location.pathname === '/';
    if (item.key === 'integrations') {
      return location.pathname === '/integrations' || location.pathname.startsWith('/integrations/');
    }
    return location.pathname.startsWith(item.to.split('?')[0]);
  }

  return (
    <div className="app-shell relative min-h-screen w-full max-w-[100vw] overflow-x-clip">
      <AnimatedBackground />

      <motion.header
        className="app-nav sticky top-0 z-30 w-full"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      >
        <div className="mx-auto flex h-[60px] min-w-0 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/" className="shrink-0 rounded-lg outline-none ring-cyan-500/40 focus-visible:ring-2">
              <BrandLogo variant="nav" />
            </Link>
          </motion.div>

          {currentUser && (
            <nav className="nav-pill-group relative hidden items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`nav-pill relative z-10 ${isActive(item) ? 'nav-pill-active' : ''}`}
                >
                  {isActive(item) && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="nav-active-glow absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <motion.button
              type="button"
              className="btn-ghost"
              onClick={() => setTheme((t) => (t === 'night' ? 'day' : 'night'))}
              aria-label="Toggle theme"
              whileHover={{ scale: 1.08, rotate: 15 }}
              whileTap={{ scale: 0.92 }}
            >
              {theme === 'night' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>
            {currentUser ? (
              <>
                <span className="hidden max-w-[10rem] truncate text-xs text-slate-400 lg:inline">
                  {currentUser.email}
                </span>
                <motion.button
                  type="button"
                  className="btn-ghost text-xs"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    await logoutAndClear();
                    navigate('/login');
                  }}
                >
                  Log out
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-xs">
                  Log in
                </Link>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/register" className="btn-primary px-3 py-1.5 text-xs">
                    Sign up
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
        {currentUser && (
          <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <Link key={item.key} to={item.to} className={`nav-pill shrink-0 ${isActive(item) ? 'nav-pill-active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </motion.header>

      <div className="theme-page relative z-10 w-full min-w-0 overflow-x-clip">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

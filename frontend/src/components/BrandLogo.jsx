import { motion } from 'framer-motion';

/** Gradient icon mark — nav shows icon + “Pulse” wordmark (not plain text-only logo). */
export function BrandMark({ size = 40, className = '' }) {
  return (
    <motion.svg
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pld-bg" x1="4" y1="4" x2="36" y2="36">
          <stop stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#pld-bg)" />
      <rect x="9" y="22" width="4" height="9" rx="1.5" fill="#0f172a" fillOpacity="0.35" />
      <rect x="15" y="16" width="4" height="15" rx="1.5" fill="#f0fdfa" />
      <rect x="21" y="11" width="4" height="20" rx="1.5" fill="#f0fdfa" />
      <rect x="27" y="18" width="4" height="13" rx="1.5" fill="#f0fdfa" fillOpacity="0.85" />
    </motion.svg>
  );
}

export default function BrandLogo({ variant = 'nav' }) {
  if (variant === 'nav') {
    return (
      <span className="brand-logo-nav inline-flex items-center gap-2.5" title="Pulse">
        <motion.span
          className="brand-logo-ring"
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          <BrandMark size={36} />
        </motion.span>
        <span className="brand-wordmark hidden font-display text-[15px] font-bold tracking-tight sm:inline">
          <span className="text-gradient-brand">Pulse</span>
        </span>
      </span>
    );
  }

  if (variant === 'auth') {
    return (
      <div className="brand-logo-auth mx-auto flex flex-col items-center gap-4 text-center">
        <span className="brand-logo-ring brand-logo-ring-lg">
          <BrandMark size={56} />
        </span>
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gradient-brand">Pulse</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">Personal command center</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-logo-hero inline-flex items-center gap-4">
      <span className="brand-logo-ring brand-logo-ring-lg">
        <BrandMark size={48} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="text-gradient-brand">Pulse</span>
        </p>
        <p className="mt-0.5 text-sm text-slate-500">Goals, habits & integrations</p>
      </div>
    </div>
  );
}

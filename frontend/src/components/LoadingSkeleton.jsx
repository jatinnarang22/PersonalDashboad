import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../motion/presets.js';

export default function LoadingSkeleton() {
  const bars = ['w-full', 'w-[88%]', 'w-[72%]', 'w-[90%]'];

  return (
    <motion.div
      className="dash-loading py-16"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <motion.div variants={fadeUp} className="skeleton-shimmer h-12 w-2/3 rounded-2xl" />
        <motion.div variants={fadeUp} className="kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="skeleton-shimmer h-28 rounded-2xl"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </motion.div>
        <div className="space-y-3">
          {bars.map((w, i) => (
            <motion.div key={i} variants={fadeUp} className={`skeleton-shimmer h-3 ${w} rounded-full`} />
          ))}
        </div>
        <motion.p variants={fadeUp} className="text-center text-sm text-slate-500">
          Loading your dashboard…
        </motion.p>
      </div>
    </motion.div>
  );
}

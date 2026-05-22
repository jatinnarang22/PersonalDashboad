import { motion } from 'framer-motion';

const orbs = [
  { className: 'orb orb-1', duration: 22, x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.95, 1] },
  { className: 'orb orb-2', duration: 28, x: [0, -70, 50, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] },
  { className: 'orb orb-3', duration: 18, x: [0, 40, -60, 0], y: [0, 30, -50, 0], scale: [1, 1.08, 1, 1] },
];

export default function AnimatedBackground() {
  return (
    <div className="app-bg-orbs pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="mesh-grid" />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={orb.className}
          animate={{ x: orb.x, y: orb.y, scale: orb.scale }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

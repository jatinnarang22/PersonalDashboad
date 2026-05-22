import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useSpring } from 'framer-motion';

export default function AnimatedNumber({ value, className = '' }) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const spring = useSpring(safe, { stiffness: 140, damping: 24 });
  const [display, setDisplay] = useState(safe);

  useMotionValueEvent(spring, 'change', (v) => setDisplay(Math.round(v)));

  useEffect(() => {
    spring.set(safe);
  }, [safe, spring]);

  return (
    <motion.span
      className={className}
      key={display}
      initial={{ opacity: 0.6, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {display}
    </motion.span>
  );
}

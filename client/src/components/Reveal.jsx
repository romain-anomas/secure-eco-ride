import { motion, useReducedMotion } from 'framer-motion';

/** Gentle scroll reveal. Used sparingly, and skipped for people who prefer reduced motion. */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </Tag>
  );
}

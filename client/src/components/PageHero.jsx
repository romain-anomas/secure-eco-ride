import { motion, useReducedMotion } from 'framer-motion';
import Leaf from './art/Leaf.jsx';
import { smartImageProps } from '../utils/images.js';

/**
 * Dark banner used at the top of inner pages (sits under the fixed navbar).
 * Pass `image` (a photo URL) to use it as a full-bleed background with a
 * dark gradient overlay instead of the plain gradient + decorative lines.
 */
export default function PageHero({ title, intro, image, imageAlt = '', children }) {
  const reduce = useReducedMotion();
  const photo = image ? smartImageProps(image, { w: 1600 }) : null;

  return (
    <section className="relative isolate overflow-hidden bg-night pb-14 pt-32 text-white sm:pb-16 sm:pt-36">
      {photo ? (
        <>
          <img src={photo.src} srcSet={photo.srcSet} sizes="100vw" alt={imageAlt} className="absolute inset-0 -z-20 h-full w-full object-cover" loading="eager" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/95 via-night/70 to-night/40" />
          <div className="absolute inset-0 -z-10 bg-leaf/10 mix-blend-overlay" />
        </>
      ) : (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-20 340C220 250 380 380 640 300S1040 190 1240 260" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".5" strokeWidth="2" />
          <path d="M-20 375C240 300 400 410 660 335S1060 240 1240 300" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".22" strokeWidth="1.5" />
        </svg>
      )}
      {!photo && <Leaf className="pointer-events-none absolute -right-2 top-24 hidden w-16 rotate-[30deg] opacity-70 sm:block lg:right-16 lg:w-24" />}
      <div className="container-x relative">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="h-display max-w-3xl">{title}</h1>
          <div className="rule-green mt-5" />
          {intro && <p className="copy-lead mt-5 max-w-2xl text-white/85">{intro}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  );
}

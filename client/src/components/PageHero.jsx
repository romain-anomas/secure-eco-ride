import { motion, useReducedMotion } from 'framer-motion';
import { smartImageProps } from '../utils/images.js';

/** Light, editorial banner shared by the public inner pages. */
export default function PageHero({ title, intro, image, imageAlt = '', children }) {
  const reduce = useReducedMotion();
  const photo = image ? smartImageProps(image, { w: 1600 }) : null;

  return (
    <section className="relative isolate overflow-hidden bg-[#f4f7f5] pb-14 pt-32 text-night sm:pb-16 sm:pt-36">
      {photo ? (
        <>
          <img src={photo.src} srcSet={photo.srcSet} sizes="100vw" alt={imageAlt} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" loading="eager" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f4f7f5] via-[#f4f7f5]/95 to-[#f4f7f5]/65" />
        </>
      ) : (
        <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
      )}
      <div className="container-x relative">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">Secure Eco Ride · Rwanda</p>
          <h1 className="h-display max-w-3xl text-[#101b18]">{title}</h1>
          <div className="rule-green mt-5" />
          {intro && <p className="copy-lead mt-5 max-w-2xl not-italic text-night/70">{intro}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  );
}

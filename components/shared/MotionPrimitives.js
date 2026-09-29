"use client";
import { useEffect } from 'react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';

export const premiumTransition = { duration: 0.24, ease: [0.16, 1, 0.3, 1] };

// Progressive enhancement: SSR and reduced-motion users see readable content.
// One observer per heading; finished entrances never replay on scroll back.
export function useTextReveal() {
  const [scope, animate] = useAnimate();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver) return;
    const element = scope.current;
    if (!element) return;
    let controls;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      controls = animate('[data-motion-line]', { opacity: [0.35, 1], y: [10, 0] }, {
        duration: 0.6, ease: premiumTransition.ease,
        delay: index => Math.min(index * 0.07, 0.21)
      });
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => { observer.disconnect(); controls?.cancel(); };
  }, [animate, reduced, scope]);
  return scope;
}

// Keep the original article geometry and semantics, with no entrance/layout animation.
export function InteractiveCard({ children, ...props }) {
  const reduced = useReducedMotion();
  return <motion.article {...props} whileTap={reduced ? undefined : { scale: 0.997 }} transition={premiumTransition}>{children}</motion.article>;
}

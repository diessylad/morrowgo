"use client";

import { useEffect } from 'react';

const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Progressive enhancement: content stays visible without JS or observers.
export default function usePremiumMotion(root) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};

    function setup() {
      dispose();
      if (preference.matches) return;
      const animations = new Set();
      const targets = [...scope.querySelectorAll('h1, h2, h3, p, [data-motion-reveal]')]
        .filter(el => !el.closest('article, form, [aria-live], [role="status"], [role="alert"]'));
      const units = new Set();
      targets.forEach(el => {
        const lines = el.querySelectorAll('[data-motion-line]');
        (lines.length ? [...lines] : [el]).forEach(unit => {
          units.add(unit);
          unit.style.opacity = '0';
        });
      });
      const reveal = new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const headline = /^H[1-3]$/.test(el.tagName);
          const lines = el.querySelectorAll('[data-motion-line]');
          const distance = headline ? (window.innerWidth < 768 ? 28 : 40) : 20;
          (lines.length ? [...lines] : [el]).forEach((unit, index) => {
            const animation = unit.animate([
              { opacity: 0, transform: `translateY(${distance}px)` },
              { opacity: 1, transform: 'translateY(0)' }
            ], { duration: headline ? 900 : 750, delay: Math.min(stagger, 2) * 90 + index * 110, easing, fill: 'both' });
            animations.add(animation);
            animation.onfinish = () => {
              unit.style.removeProperty('opacity');
              animation.cancel();
              animations.delete(animation);
            };
          });
          stagger++;
          reveal.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      targets.forEach(el => reveal.observe(el));

      const visuals = [...scope.querySelectorAll('[data-motion-visual]')];
      const active = new Set();
      let frame = 0;
      const header = scope.querySelector('[data-motion-header]');
      function update() {
        frame = 0;
        const height = window.innerHeight;
        if (header) header.dataset.scrolled = String(window.scrollY > 40);
        active.forEach(el => {
          const rect = el.getBoundingClientRect();
          const current = Number(el.dataset.motionOffset || 0);
          const top = rect.top - current;
          const progress = Math.max(-1, Math.min(1, (height / 2 - top - rect.height / 2) / height));
          // Individual translate preserves the artwork's existing composition transforms.
          const offset = progress * (window.innerWidth < 768 ? 28 : 55);
          el.dataset.motionOffset = String(offset);
          el.style.translate = `0 ${offset}px`;
        });
      }
      function schedule() { if (!frame) frame = requestAnimationFrame(update); }
      const visible = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
        schedule();
      });
      visuals.forEach(el => visible.observe(el));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      dispose = () => {
        units.forEach(unit => unit.style.removeProperty('opacity'));
        if (header) delete header.dataset.scrolled;
        reveal.disconnect();
        visible.disconnect();
        animations.forEach(animation => animation.cancel());
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        visuals.forEach(el => { el.style.removeProperty('translate'); delete el.dataset.motionOffset; });
      };
    }
    setup();
    preference.addEventListener('change', setup);
    return () => { dispose(); preference.removeEventListener('change', setup); };
  }, [root]);
}

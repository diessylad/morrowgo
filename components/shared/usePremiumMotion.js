"use client";

import { useEffect } from 'react';

import { motionEasing as easing, motionPresets } from './motionPresets';

// Progressive enhancement: content stays visible without JS or observers.
export default function usePremiumMotion(root) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};

    function setup() {
      dispose();
      if (preference.matches || !window.IntersectionObserver || !Element.prototype.animate) return;
      const animations = new Set();
      const targets = [...scope.querySelectorAll('h1, h2, h3, p, [data-motion-reveal]')]
        .filter(el => !el.closest('article, form, [aria-live], [role="status"], [role="alert"]'));
      const reveal = new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const headline = /^H[1-3]$/.test(el.tagName);
          const lines = el.querySelectorAll('[data-motion-line]');
          const preset = lines.length ? motionPresets.maskedTextReveal : motionPresets.softReveal;
          (lines.length ? [...lines] : [el]).forEach((unit, index) => {
            const animation = unit.animate(preset, {
              duration: headline ? 1050 : 900,
              delay: (Number(el.dataset.motionDelay) || Math.min(stagger, 2) * 90) + index * (el.tagName === 'H1' ? 150 : 110),
              easing, fill: 'backwards'
            });
            animations.add(animation);
            animation.onfinish = () => {
              animation.cancel();
              animations.delete(animation);
            };
          });
          stagger++;
          reveal.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      targets.forEach(el => reveal.observe(el));

      // Entrance effects compose with (rather than replace) scroll transforms.
      const entered = new WeakSet();
      function enter(el, delay = 0, type = 'softReveal') {
        if (entered.has(el)) return;
        entered.add(el);
        const preset = motionPresets[type] || motionPresets.softReveal;
        const effects = [
          el.animate(preset.map(({ transform }) => ({ transform })),
            { duration: 1100, delay, easing, composite: 'add', fill: 'both' }),
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 850, delay, easing, fill: 'both' })
        ];
        effects.forEach(animation => {
          animations.add(animation);
          animation.onfinish = () => { animation.cancel(); animations.delete(animation); };
        });
      }
      const cards = new Set();
      const cardObserver = new IntersectionObserver(entries => {
        let order = 0;
        entries.forEach(entry => {
          entry.target.dataset.motionCentered = String(entry.isIntersecting);
          if (entry.isIntersecting) {
            const type = entry.target.dataset.motionEnter || (entry.target.closest('[data-motion-support]') ? 'sideReveal' : 'softReveal');
            const delay = Number(entry.target.dataset.motionDelay) || Math.min(order++, 3) * 100;
            enter(entry.target, delay, type);
            const art = entry.target.querySelector('[data-motion-card-art]');
            if (art) enter(art, delay + 100, 'imageReveal');
          }
        });
      }, { rootMargin: '-12% 0px -12% 0px', threshold: 0.15 });
      function registerCards() {
        scope.querySelectorAll('[data-motion-card], [data-motion-step], [data-motion-support] > *, [data-motion-enter]').forEach(el => {
          if (!cards.has(el)) { cards.add(el); cardObserver.observe(el); }
        });
      }
      registerCards();
      // Catalogue cards arrive asynchronously and filters can replace them.
      const additions = new MutationObserver(registerCards);
      additions.observe(scope, { childList: true, subtree: true });

      // Paused additive animations are scrubbed by actual scroll progress.
      // The original CSS transforms (including the artwork's rotations) remain intact.
      const profiles = {
        phone: { y: -48, x: 4, scale: 1.025, rotate: -0.6 },
        japan: { y: -70, x: -5, scale: 1.015, rotate: -1 },
        travel: { y: -58, x: -3, scale: 1.02, rotate: 1 },
        tomorrow: { y: -38, x: 4, scale: 1.01, rotate: -0.8 },
        ape: { y: 30, x: 2, scale: 1.015, rotate: 0 },
        app: { y: -60, x: 0, scale: 1.03, rotate: 1 },
        suitcase: { y: -35, x: 0, scale: 1.015, rotate: 0 }
      };
      const visuals = [...scope.querySelectorAll('[data-motion-visual]')];
      const layers = visuals.map(el => {
        const profile = profiles[el.dataset.motionVisual] || profiles.app;
        const mobile = window.innerWidth < 768;
        const factor = mobile ? 0.55 : 1;
        const hero = el.closest('[data-motion-scene]');
        const anchor = hero || el.closest('section, main') || scope;
        const initialScale = el.dataset.motionVisual === 'app' ? 0.96 : 1;
        const animation = el.animate([
          { transform: `translate3d(0,0,0) scale(${initialScale}) rotate(0deg)` },
          { transform: `translate3d(${profile.x * factor}px,${profile.y * factor}px,0) scale(${1 + (profile.scale - 1) * factor}) rotate(${profile.rotate * factor}deg)` }
        ], { duration: 1000, fill: 'both', composite: 'add', easing: 'linear' });
        animation.pause();
        animation.currentTime = 0;
        return { el, anchor, hero: Boolean(hero), animation, current: 0 };
      });
      const active = new Set();
      let frame = 0;
      let previousTime = 0;
      const header = scope.querySelector('[data-motion-header]');
      if (header) enter(header, 100, 'softReveal');
      function update(time) {
        frame = 0;
        const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
        previousTime = time;
        const blend = 1 - Math.exp(-elapsed / 95);
        const height = window.innerHeight;
        // Read all geometry first, then write compositor animation times.
        const positions = [...active].map(layer => {
          const rect = layer.anchor.getBoundingClientRect();
          const progress = layer.el.dataset.motionVisual === 'suitcase'
            ? Math.max(0, Math.min(1, window.scrollY / Math.max(rect.bottom + window.scrollY - height, 1)))
            : layer.hero
            ? Math.max(0, Math.min(1, window.scrollY / Math.max(rect.top + window.scrollY + rect.height, 1)))
            : Math.max(0, Math.min(1, (height - rect.top) / Math.max(height + rect.height, 1)));
          return [layer, progress];
        });
        if (header) header.dataset.scrolled = String(window.scrollY > 40);
        let settling = false;
        positions.forEach(([layer, progress]) => {
          const target = progress * 1000;
          layer.current += (target - layer.current) * blend;
          if (Math.abs(target - layer.current) < 0.15) layer.current = target;
          else settling = true;
          layer.animation.currentTime = layer.current;
        });
        if (settling) frame = requestAnimationFrame(update);
        else previousTime = 0;
      }
      function schedule() { if (!frame) frame = requestAnimationFrame(update); }
      const visible = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          layers.filter(layer => layer.anchor === entry.target).forEach(layer => {
            if (entry.isIntersecting) { active.add(layer); enter(layer.el, layer.hero ? ({ phone: 450, japan: 600, travel: 700, tomorrow: 850, ape: 900 }[layer.el.dataset.motionVisual] || 450) : 100, layer.el.dataset.motionVisual === 'ape' ? 'imageReveal' : 'scaleReveal'); }
            else active.delete(layer);
          });
        });
        schedule();
      }, { rootMargin: '100px 0px' });
      [...new Set(layers.map(layer => layer.anchor))].forEach(anchor => visible.observe(anchor));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      dispose = () => {
        if (header) delete header.dataset.scrolled;
        additions.disconnect();
        cardObserver.disconnect();
        cards.forEach(el => delete el.dataset.motionCentered);
        reveal.disconnect();
        visible.disconnect();
        animations.forEach(animation => animation.cancel());
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        layers.forEach(layer => layer.animation.cancel());
      };
    }
    setup();
    preference.addEventListener('change', setup);
    return () => { dispose(); preference.removeEventListener('change', setup); };
  }, [root]);
}

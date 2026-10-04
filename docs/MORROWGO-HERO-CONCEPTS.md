# MORROWGO local hero concepts

Scope: local review only at /local-hero-review. The route returns notFound in production. The approved homepage keeps its original palette and scene; new hero features are opt-in. No auth, payments, pricing, catalogue or ownership handlers changed.

## Concepts

1. Original ink: same existing MORROWGO.
2. Cobalt: #183ca7 primary search action on the existing cream surface, hover #102c82. Recommended stronger action hierarchy.
3. Sage: #cbd7bd action with #18231b text; quieter option.

Two hero scenes: approved phone/monkey travel composition and The world is yours / Go further with the supplied people canvas and existing globe asset. Search remains present in both. An 8-second black segmented progress line, manual scene buttons, pause/play, keyboard/focus/hover pauses, page visibility and viewport pauses. Reduced motion disables autoplay and canvas walking.

## Supplied component

Adapted from the user-supplied Skiper39/CrowdCanvas implementation. Same 15x7 sprite slicing, depth ordering, randomized bidirectional walking. Native canvas + one requestAnimationFrame loop replaces GSAP for this decorative preview, preserving existing dependencies. Not a verbatim GSAP port. DPR capped at 2, ResizeObserver, IntersectionObserver, visibility handling and unmount cleanup. Crowd limited to 20 on small screens and 40 otherwise.

Attribution: Skiper UI (@gurvinder-singh02, https://gxuri.me), original inspiration https://codepen.io/zadvorsky/pen/xxwbBQV, illustrations by Pablo Stanley / Open Peeps https://www.openpeeps.com/ (CC0 for personal and commercial use). The supplied free-component notice requires Skiper UI attribution; visible attribution accompanies the scene. Sprite source: https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png . Local PNG is about 372KB.

Taste and Impeccable colorize/craft guidance used under the existing MORROWGO contract. Higgsfield image generation was attempted and rejected by the service because the connected account requires Basic or higher; no image was generated and no generated asset is claimed.

## Changed files in this pass

- app/local-hero-review/page.js
- components/hero-review/HeroReview.js
- components/hero-review/heroReview.module.css
- components/hero-review/CrowdCanvas.js
- components/hero-review/useHeroStories.js
- components/studio/Experience.js (optional props and hero scenes)
- components/studio/studio.module.css (scoped variants and scenes)
- locales/dictionaries.json (new scene/control strings in all five languages)
- public/brand/open-peeps-sprite.png
- docs/MORROWGO-HERO-CONCEPTS.md

## Verification

Local review route returned HTTP 200 and compiled. Final Next production build passed; existing 284 tests passed. No package or lockfile change. Cobalt #183ca7 on #fefefc contrast: 9.27:1; sage #18231b on #cbd7bd: 10.81:1 (WCAG sRGB calculation). Browser inspection was blocked by repeated in-app-browser CDP timeouts; desktop/mobile visual checks and autoplay behavior are not claimed as verified. No deploy or commit.

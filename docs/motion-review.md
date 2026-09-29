# Motion refinement — 2026-09-29

## Scope

Preserves existing colors, typography, artwork sizes, content and desktop composition. Previous uncommitted design-system changes remain separate from this pass. No backend, auth, catalogue, checkout logic or production deployment changed.

## Setup

- Next.js 14.2.35 / React 18.3.1.
- Added `motion` 13.4.6; imports use `motion/react`. No separate direct `framer-motion` dependency; Motion itself depends on it internally.
- npm synchronized the previously stale lockfile with existing Three.js/Tailwind dependencies as well.
- UI/UX Pro Max installed in the user's Codex skills directory from nextlevelbuilder/ui-ux-pro-max-skill; reduced-motion guidance reviewed. No 21st.dev or smooth-scroll package added.

## Changes

- Shared `useTextReveal` and `InteractiveCard` primitives: restrained transform/opacity heading reveals and tariff press feedback. Readable SSR, cleanup on unmount, reduced-motion handling.
- Existing heading markup/line breaks retained. Removed legacy heading observer targeting to prevent double animation.
- Reduced parallax to 35% on desktop and zero on narrow screens; recalculates when crossing the 767px breakpoint. Removed the app image's initial 0.96 scroll scale.
- Disabled automatic touch-card artwork zoom; reduced generic button hover lift; native anchor scrolling reserves space for navbar.
- Fixed destination mobile flex order: purchase spacer now follows content instead of creating a blank area under navbar.
- Fixed tablet artwork being a 1086px flow row. At 768–1100px it remains 724px wide and is cropped inside the right 42% area, avoiding card overlap. Desktop and mobile image dimensions remain unchanged.

## Files changed in this pass

- package.json
- package-lock.json
- components/shared/MotionPrimitives.js (new)
- components/shared/MotionHeading.js
- components/shared/usePremiumMotion.js
- components/shared/motion.module.css
- components/destination/PlanCard.js
- components/destination/plans.tailwind.css
- components/destination/plans.module.css (generated)
- app/destination/[iso]/destination.module.css
- docs/motion-review.md (new)

## Verification

Production build passed. `git diff --check` passed. Tests: 266 passed, 1 previously known Stripe cancellation URL assertion failed (`/checkout` vs `/destination/DE`). No payment changes made.

`npm run lint` cannot run non-interactively because the existing project has no ESLint configuration; it opens the setup prompt. No typecheck script or TypeScript configuration exists.

Homepage and JP destination DOM overflow/artwork dimension checks: 1440, 1366, 1280, 1024, 768, 430, 390, 375px (900px viewport height). No horizontal document overflow detected. Detailed visual review at desktop, 1024/768 tablet and 375 mobile; Fixed/Unlimited switching verified. Browser error logs were empty for tested pages. Reduced-motion behavior reviewed in code, not OS-emulated. These checks do not constitute a full browser/device matrix or an authentication/payment test.

Preview: http://localhost:3131

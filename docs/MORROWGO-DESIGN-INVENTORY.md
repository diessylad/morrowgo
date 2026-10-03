# MORROWGO frontend inventory before skill installation

Inspected 2026-10-03. Repository HEAD: `3b043ae8c150bddfdf6bc0074d8214757e7ca452`.

- Next.js 14.2.35 App Router, React 18.3.1, JavaScript/JSX; no TypeScript configuration found.
- pnpm 10.34.6 declared by packageManager; existing lockfile remains untouched.
- app/ contains marketing, destinations, destination detail, checkout/success, auth and authenticated account routes. components/ contains corresponding UI modules, shared header/i18n and account components. lib/ owns business/data/auth integrations.
- CSS Modules dominate. Shared tokens: components/design-system/tokens.css; recipes: primitives.module.css. app/layout.js loads responsive.css, globals.css, then tokens.css.
- Tailwind 3.4.17 generates destination/plans.module.css from plans.tailwind.css; predev/prebuild run that generator. It is not a whole-site utility system.
- Font: Arial, Helvetica, sans-serif. No next/font imports or @font-face declarations found in app/ or components/.
- Motion 13.4.6 (motion/react); shared MotionPrimitives, MotionHeading, motionPresets, usePremiumMotion. Existing CSS/WAAPI reveals and canvas/WebGL brand visuals; three 0.186.0 and canvas-confetti 1.9.4 installed.
- Main semantic colors: page #f5f5f2, paper #fefefc, surface #fcfcfa, ink #0a0a0a, muted #666762, border #deded8.
- No repo-level AGENTS.md, .codex/ or .agents/ found before setup. Global skills already exist; this task does not change global installation.
- Existing assets include monkey/ape, phone/device, suitcase, logo and travel globe; retain them.

## Existing dirty working tree — not created by this task

Modified: app/checkout/checkout.module.css, app/checkout/page.js, components/account/AccountStates.js, components/account/dashboard.module.css, components/studio/Experience.js, components/studio/studio.module.css.

Untracked: app/checkout/CheckoutView.js and app/local-checkout-review/ (page.js, Preview.js).

These UI changes predate this setup and are left byte-for-byte unchanged. The setup adds only skill/instruction/documentation files. A pre-task SHA-256 baseline is used to verify this distinction.

## Known discrepancies to document, not repair

The requested conceptual palette (#F5F4EF/#ECE8DF/#DAD7D0/#2B2B29) is not identical to current semantic tokens. Brand documentation must distinguish intent from implementation. Page CSS contains local literal values and repeated overrides. Legacy globals include dark colors overridden by later tokens; account glass is a deliberate existing treatment, not a license to spread glass throughout the site.

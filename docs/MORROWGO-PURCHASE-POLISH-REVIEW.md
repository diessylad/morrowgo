# MORROWGO: purchase polish review

Local changes only. No commit, deployment, dependency installation, or backend changes. Earlier uncommitted work was retained.

## Visible changes

| Area | Before | After | Purpose |
|---|---|---|---|
| Hero purchase entry | Arrow-only search; vague supporting copy | Find plans, clearer supporting copy, popular country shortcuts, animated suggestions with real catalogue prices | Make the next step obvious without moving the artwork |
| Quick purchase | Repeated Buy now buttons | Native selectable radio rows, compact allowance/duration/network/total, one Continue action | Reduce competing actions and retain keyboard access |
| Account | Not started for an installable eSIM; generic Manage action | Ready to install and direct installation link; explicit sandbox note | Explain the next customer action |
| Purchase result | Existing local result presentation | Three verified presentation steps and explicit test-eSIM heading | Payment → readiness → installation details, without implying sandbox is usable |

Original homepage artwork dimensions, composition, navbar, typography direction and palette retained. QR retrieval, session/authentication, prices, catalogue requests and payment handling unchanged.

## Skills

Added three repository-scoped skills from emilkowalski/skills, pinned to e8a175de22ae1e49370fc144c1f3bb9aeedf988d: emil-design-eng, review-animations, mobile-native. MIT source and attribution included; originals stored as references. Existing motion/react retained, no Framer Motion dependency added. Total repository skill entries: 17. Restart Codex to discover newly installed skills automatically.

Used Impeccable polish/craft guidance and Taste workflow with the MORROWGO design contract. Impeccable automatic context command was unavailable; read implementation and design documentation directly. Higgsfield website-builder is for a separate hosted site; it was not invoked because this task preserves the existing repository and artwork.

## Verification

- Existing test suite: 284 passed, 0 failed.
- Final Next production build passed, including its configured lint/type checking. Existing autoprefixer warning about legacy end alignment remains.
- Browser: search Italy returned real price; selecting 5 GB updated total; compatibility checkbox enabled Continue; Escape closed modal and restored focus to opener. No real payment or login submitted.
- Homepage DOM width checks: 1440, 1366, 1280, 1024, 768, 430, 390, 375: no horizontal overflow.
- Visual screenshots: homepage and quick purchase desktop/mobile; purchase result desktop at 1280 and mobile at 390; account desktop and mobile at 390. Account retains a pre-existing 2px mobile shell extent; not claimed as a full responsive audit.
- Desktop/mobile emulation only; real iOS, real sandbox purchase and all translated text lengths were not verified.
- Account/result previews use clearly identified sample data in an isolated temporary app; no auth bypass was added to MORROWGO. Preview links are for visual inspection, not functional payment or installation testing.

## Local review

- Main website: http://localhost:3011/ (verified production build)
- Purchase result example: http://localhost:3012/
- Account example: http://localhost:3012/account

Screenshots saved in /tmp/morrowgo-polish-review/: home-before-desktop.png, quick-buy-before-desktop.png, home-after-desktop.png, quick-buy-after-desktop.png, home-after-mobile.png, quick-buy-after-mobile.png, success-after-desktop.png, success-after-mobile.png, account-after-desktop.png. Temporary preview files are outside the production repository.

## Files changed relative to this task baseline

- `.codex/design-skills.lock.json`
- `.codex/skills/emil-design-eng/LICENSE`
- `.codex/skills/emil-design-eng/SKILL.md`
- `.codex/skills/emil-design-eng/references/upstream.md`
- `.codex/skills/mobile-native/LICENSE`
- `.codex/skills/mobile-native/SKILL.md`
- `.codex/skills/mobile-native/references/upstream.md`
- `.codex/skills/morrowgo-design/SKILL.md`
- `.codex/skills/review-animations/LICENSE`
- `.codex/skills/review-animations/SKILL.md`
- `.codex/skills/review-animations/references/STANDARDS.md`
- `.codex/skills/review-animations/references/upstream.md`
- `components/account/ConnectionSteps.js`
- `components/account/connectionSteps.module.css`
- `components/quick-buy/QuickBuyPlan.js`
- `app/checkout/success/PurchaseResult.js`
- `app/checkout/success/success.module.css`
- `components/account/DashboardOverview.js`
- `components/account/dashboard.module.css`
- `components/purchase/PurchaseBar.js`
- `components/quick-buy/QuickBuy.js`
- `components/quick-buy/quickBuy.module.css`
- `components/studio/Experience.js`
- `components/studio/studio.module.css`
- `locales/dictionaries.json`
- `docs/MORROWGO-PURCHASE-POLISH-REVIEW.md` (this report)

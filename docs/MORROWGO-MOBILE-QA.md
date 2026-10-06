# MORROWGO mobile responsive pass

Desktop styling and production artwork are retained. Mobile uses a shared accessible overlay menu, compact account header, solid surfaces, plan-first dashboard, shared eSIM rows and mobile filters. No media was generated; no dependency was added.

## Verification

- Browser viewport checks: 375, 390, 393, 430 and 768px.
- Public pages: homepage, login, signup, destinations, support and compatibility. No horizontal overflow in 30 combinations.
- Account components: dashboard, My eSIMs, orders, wallet, profile and account shell. No horizontal overflow in 30 combinations using local sample data. Settings shell was checked with a placeholder body, not an authenticated settings session. Temporary QA route removed.
- Menu opening, closing, Escape, body scroll restoration, keyboard boundaries, language picker, navigation and empty eSIM filter verified.
- RU/DE menu labels fit; text inputs are 16px at phone/tablet widths. Email form verified at 390px.
- Desktop dashboard checked at 1440px; mobile menu and alternate rows are hidden. New surface/layout overrides are scoped to responsive breakpoints.
- 18 account presentation, middleware, usage and return-route tests pass.

## Limits

No real iPhone Safari/device session was available. Safe-area CSS and viewport-fit=cover are implemented; browser checks are viewport emulation, not proof on hardware. Authenticated UI was exercised with local sample data. OAuth, purchases and installation were not submitted, and user data was not changed. No deployment was performed.

## Approved compact dashboard release

Mobile-only dashboard now uses the existing featured-eSIM selection, real usage and existing installation/manage routes. The selected eSIM is excluded from the compact list of other connections. Orders and support use their existing routes; desktop overview is retained above 700px. No auth/payment/activation logic changed.

Component fixtures checked ready/active/empty/unavailable states at 320, 375, 390, 393, 430, 768 and 1440px; no horizontal overflow. RU/DE menu and dashboard checked at 390px. Details expose actual operator/status. 18 relevant regression tests pass. Temporary local fixture removed before production build. Hardware iPhone Safari and authenticated live account actions were not tested.

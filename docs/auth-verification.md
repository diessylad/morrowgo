# Authentication verification — 2026-09-25

## Completed

- `npm test`: **259 passed**, zero failures.
- `npm run build`: passed. Existing unrelated studio CSS `align-items: end`/autoprefixer warnings remain; no auth compile failures.
- `git diff --check`: passed.
- Browser UI widths: **375, 390, 430, 768, 1440px**, no horizontal overflow.
- Isolated real Next.js + Supabase SSR SDK browser flow: registration form, resend, confirmation without the original browser cookies, session cookie creation, account refresh, authenticated homepage navbar, logout, logged-out account guard, wrong/correct password, reset request and single-use-token submission sequencing, expired-link error, Google/Apple PKCE initiation and callback, expired access-session refresh, disabled-provider message. No browser runtime errors.
- Built application with the real project's public settings: disabled Google returns a friendly form message; missing/invalid callback inputs redirect to the canonical production login URL; logged-out `/account` redirects to login.
- Confirmation template rendered at 390px without overflow.
- Read-only production `/login` returned HTTP 200. This is a reachability check of the old deployment, not proof that these changes are deployed.

## Test boundaries

Browser integration uses a temporary copy of the app, the actual SSR SDK and routes, and a local fake Auth/REST backend. It creates no real Supabase users, sends no emails and does not complete real Google/Apple consent. Backend simulation cannot prove inbox delivery, single-use enforcement in the hosted project, Google/Apple account provisioning/linking, or private SMTP/allowlist settings.

The hosted project reported email enabled, signup enabled, email confirmation required, Google disabled, Apple disabled. No dashboard settings or production deployment were changed.

Real signup → inbox → confirmation, real reset email, Google new/returning accounts, Apple new/returning accounts and private-relay delivery remain launch gates after the manual steps in [auth-setup.md](auth-setup.md). Existing account layout, payments, Airalo and destination files were not edited.

## Repeat the browser check

The harness is `tests/auth-browser.cjs`. It needs Node 22+, installed project dependencies, Playwright with a browser available, and free ports 3111/3112. It copies app sources to an OS temporary directory (without `.env` files), uses fake local Auth credentials and removes that directory on exit. It does not overwrite the repository's production build.

If Playwright is installed in your development environment:

```sh
node tests/auth-browser.cjs
```

For an externally installed Playwright package/browser, set `MORROWGO_PLAYWRIGHT_MODULE` to its absolute module path and optionally `MORROWGO_BROWSER_PATH` to the browser executable. These are tooling paths, not authentication credentials. The script writes desktop/mobile screenshots to the OS temporary directory.

The full manual A–O production acceptance checklist and exact provider/SMTP settings are in [auth-setup.md](auth-setup.md).

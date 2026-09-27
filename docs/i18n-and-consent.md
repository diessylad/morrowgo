# Languages and cookie preferences

## Language architecture

`LanguageProvider` in the root layout owns EN/DE/ES/RU/FR. The initial server render is English; after hydration, the saved `morrowgo-language` value wins over the browser language list, with English as fallback. Selection updates React context and `html.lang` without navigation or remounting forms. Tabs synchronize via the storage event. Storage failure does not block browsing.

`locales/en.json` contains stable source-message keys. `locales/dictionaries.json` contains the five local dictionaries. No external translation service is called. Existing entries use generated stable keys; new entries should use descriptive keys. Use `Text` for source messages, `Message` for interpolated whole sentences, `Localized` for native element accessibility labels, and `useLanguage().t` in client logic. Keep grammatical phrases together instead of translating fragments. `Message` values are not translated unless explicitly listed in its `localize` prop. Country labels include all countries in the current catalogue. Dates and prices use Intl where rendered by account/plan components.

Never wrap user data, company/operator names, installation codes, IDs or keys in translation components. Keep routing, form names, API values and package identifiers unchanged. Add a dictionary entry to all five languages; missing translations display the English source. Original artwork is preserved, including English text baked into bitmap assets. External Google/Apple/Stripe screens and Supabase email templates are controlled by their respective services; these dictionaries cover the MORROWGO website UI.

## Cookie consent

`CookieConsent` is mounted once in the root layout. First visit offers accept all, reject optional, and preferences. Necessary storage is always enabled. Analytics/marketing are false before consent; no optional tracking scripts were found or added. Consent is versioned and stored for 180 days in `morrowgo-cookie-consent`. Invalid, future-dated, expired and old-version records require a new choice. Footer links reopen the accessible native dialog. Authentication cookies are never deleted or modified by the consent component.

Future optional integrations must be mounted under `ConsentGate category="analytics"` or `category="marketing"`, or read `useConsent()` and load only after consent. Do not initialize SDKs at module scope. An integration must clean up listeners, stop sending events and remove its own optional cookies when consent is withdrawn; unmounting a script alone does not undo an SDK. Update the category descriptions and the statement that no optional tracking is installed when adding one.

## Configuration and checks

No new secrets, external accounts or dashboard settings are needed. Deploy the code through the normal workflow. Supabase, Airalo and Stripe configuration is unchanged. Production authentication and payments were not exercised with customer accounts during this change.

Run `npm run build`, `node --test tests/language-consent.test.mjs`, and `npm test`. The existing `npm run lint` prompts for ESLint setup because the repository has no ESLint configuration. The existing Stripe cancel-URL test expects the old `/checkout` route, while the unchanged implementation returns to `/destination/DE`; this unrelated baseline failure is not a localization regression.

## Verification performed

- Production build passes. `git diff --check` passes.
- 263 automated tests: 262 pass; the single baseline Stripe cancel-route assertion described above fails. Four focused language/consent tests pass.
- HTTP smoke check covers all 17 page routes: public routes return 200; account routes redirect unauthenticated users to login. Legacy demo/account also redirects to login.
- Browser checks: homepage language switching at 390, 768, 1024 and 1440 px; all five languages preserve the current page/search/form state, with no detected horizontal overflow. Mobile auth, catalogue, destination, help, compatibility and checkout error/success states checked. Quick Buy and nested compatibility dialog checked on mobile.
- Language survives reload/direct navigation. Cookie refusal survives reload; enabling analytics while leaving marketing off survives reload and reopening preferences. Necessary stays checked and disabled. Optional choices can be revoked.
- No errors/warnings captured by the browser during the inspected flows. Original motion still runs. Signed-in private account data and real payments were not exercised; account components and protected redirects were covered by code/tests.

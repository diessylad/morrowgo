# MORROWGO frontend design system

The existing site is the visual reference. Page compositions, artwork, data flows and authentication are preserved.

## Audit and decisions

- Public customer flows had a second navigation implementation. `components/customer/Header.js` now delegates to the shared header.
- Repeated neutral colors, green interactive accents, radii, spacing and button typography differed between auth, destination, purchase and account styles. Neutral tokens govern shared values; original per-component interactive colors are preserved.
- Legacy dark surfaces on customer utility pages were visually disconnected from the cream homepage. Light surface overrides align them with the existing brand.
- Ordinary hover transitions used several durations, some as long as 700ms. UI feedback now uses 240ms and overlay entrances use 320ms.
- Automatic reveals targeted every heading and paragraph. Reveals now require explicit motion attributes.
- The account shader competed with functional content. Its opacity is reduced to 12% on desktop and 8% on mobile; redundant dashboard panel entrance animations are removed.

## Sources of truth

`components/design-system/tokens.css` is imported after global styles in the root layout. It defines the neutral palette, typography roles, a 4px-based spacing scale, radii, shadows, glass values and motion durations.

`components/design-system/primitives.module.css` provides shared CSS Module recipes. Button styles are composed by auth, customer, account, purchase, Quick Buy and checkout success controls. Existing component-specific dimensions and responsive behavior remain local.

Use tokens for new styles. Keep the established homepage and destination display typography where changing its size would change composition. Do not force identical geometry onto different functional surfaces.

## Accent and surfaces

Magenta identifies interactive selection, focus and progress. Main black CTAs and official provider branding remain intact. Do not recolor embedded artwork, flags or semantic success/error colors. Large areas remain cream, white or warm gray.

Card radius is 24px, compact surfaces 16px, inputs 14px and pill controls fully rounded. Existing editorial glass surfaces retain their composition; avoid adding extra shader layers.

## Motion

Use `--motion-ui` with `--motion-ease` for controls and `--motion-enter` for overlays. Preserve the existing expressive homepage hero choreography. Destination motion is restrained; dashboard motion is ambient. Reduced-motion overrides disable token-driven transitions as well as existing component animations. Do not animate all text by default.

## Validation

- Production build passed.
- Test suite: 266/267 passed. The existing Stripe checkout test expects a cancellation path of `/checkout`; the implementation returns `/destination/DE`. No payment logic was changed in this visual task.
- Browser review: homepage, auth, destination plans and device compatibility overlay; desktop and mobile dashboard using isolated sample-data preview.
- Mobile overflow checks at 390px: support, compatibility, destinations, checkout empty state, registration, forgot/reset password, and dashboard.
- Account preview fixtures are outside the repository and are not part of production.
- No deployment or live payment was performed. This review does not replace end-to-end OAuth, payment or real account data verification.

Original interactive colors restored from Git HEAD. Do not introduce a shared accent color or alter the MORROWGO palette during motion work.

# MORROWGO prototype — 3028 baseline

The preserved baseline is the native editorial version originally reviewed at http://127.0.0.1:3028. Refinements are limited to the hero phone, hero artwork blending and bottom app Coming soon showcase. Typography, destination browsing, homepage sequence and demo checkout are preserved.

All device frames, UI labels, buttons, icons and feature panels are React/CSS. The supplied original `public/brand/editorial-ape.jpg` is the only image in the hero; it is secondary decoration, used once, masked into the background and hidden on mobile. No cropped screenshots are used as interface components.

The bottom device includes My eSIM, usage, time remaining, top-up and expandable plan, installation and support details. Store labels are non-interactive and explicitly Coming soon. Coverage, prices, usage and app features are prototype data; 24/7 support is labeled as planned. No real payments, eSIM issuance or backend calls take place in this flow.

Files: `components/studio/Experience.js`, `components/studio/studio.module.css`. No package or backend changes. Local check: `npm test`, `npm run build`, then `npm run start -- -H 127.0.0.1 -p 3028`.

Browser verification covers 1440, 1024, 768, 390 and 320 px, search, filtering, plans, demo checkout, active state, both Top up buttons, empty search, Escape dismissal and console errors. Reduced-motion styles and pointer motion limits remain in place. Do not publish automatically.

## Close-reference pass

The hero now follows the supplied title-case headline, pill text, larger device, upper Japan card, lower editorial card and visible right-side ape arrangement. Fuji and the decorative globe are inline SVG; no screenshot pieces or extra bitmap assets are used. The app section is a cropped CSS hardware close-up with the existing four-petal mark, four dark feature rows and inactive store labels. Destination browsing and the purchase-demo implementation remain intact. Verification includes 1280 px in addition to the prior five viewport widths.

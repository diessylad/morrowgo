# MORROWGO design system — current implementation

Source inventory, 2026-10-03; not a replacement design specification. See MORROWGO-DESIGN-INVENTORY.md for baseline. Reviewed source code only during this setup; no rendered visual audit is claimed.

## 1. Brand principles

Premium, calm, editorial consumer travel-tech. Preserve existing assets and functional clarity; this inventory authorizes no redesign.

## 2. Color tokens

Actual tokens: page #f5f5f2; paper #fefefc; surface #fcfcfa; ink #0a0a0a; muted #666762; border #deded8. Source: components/design-system/tokens.css. Brief intent Cream #F5F4EF / Mist #ECE8DF / Warm Gray #DAD7D0 / Graphite #2B2B29 differs; do not substitute it silently. Existing muted sage states remain.

## 3. Typography

--font-sans: Arial, Helvetica, sans-serif. No next/font or @font-face found. Preserve current setup; no external-font installation.

## 4. Type scale

Shared xs12/sm14/body16/label13/button14px; page heading clamp(36px,4.8vw,64px), section clamp(28px,3.4vw,48px), panel24px. Local modules override these; some account/artwork labels use 8–11px and require a future visual readability audit.

## 5. Font weights

Shared button recipe weight400. Display and local labels vary; do not normalize globally without inspecting affected selectors and computed styles.

## 6. Line heights

Shared body1.6, heading1.1; button recipe1.4 and inputs1.5. Local overrides must be assessed in context.

## 7. Letter spacing

Heading token -.035em; editorial uppercase labels have local tracking. Do not apply display tracking to body text.

## 8. Spacing scale

4,8,12,16,20,24,32,40,48,64px tokens (space1/2/3/4/5/6/8/10/12/16). Local geometry also uses percentages/clamps; document justified exceptions.

## 9. Content/container widths

Studio hero/section max1600px. Customer wrapper max1240 with 60px32px90 padding. Destination index max1312px. Destination detail max1440px, 7.8% horizontal padding, left content48%/max580px. Account has legacy1240 rules plus later glass overrides; verify computed width before relying on legacy values.

## 10. Border radii

Input14px, card24px, compact16px, pill999px. Existing glass shell uses larger local geometry; not a universal new radius.

## 11. Borders

Shared 1px semantic border #deded8; glass border #ffffffb8. Module literals and repeated rules coexist; audit cascade before consolidating.

## 12. Shadows

Panel 0 12px 32px #17171708; overlay 0 20px 64px #00000020; button 0 3px 10px #0000000d. No blanket elevation changes.

## 13. Buttons

Shared primitives.module.css: 14px/400/1.4, pill radius, existing background/border/shadow transitions. Black primary, restrained secondary. Retain focus-visible and touch feedback; do not remove compatibility or authorization guards.

## 14. Inputs

Shared input16px/1.5, paper surface, ink text, 1px border and14px radius. Country search and language popover have intentional local variants. Ensure labels and error association.

## 15. Cards/surfaces

Shared surface/card radius/subtle panel shadow. Account uses deliberate translucent glass (surface #ffffffad, blur20px). Do not spread glass to marketing sections. Real data and truthful pending/error/empty states only.

## 16. Navbar

Existing liquid/floating header: desktop top14px, width calc(100% - 88px), max1600px, radius30px, rgba(250,249,244,.38), blur28px. Mobile rules at767px and tablet768–1023px. Preserve structures and controls. Inspect destination mobile background and overscroll continuity rather than assume desktop glass works on iOS.

## 17. Hero

Retain current phone, monkey, headings, CTA and final composition. Existing layered movement must not create clipping or shrink artwork. Inspect actual geometry at each width.

## 18. Image/art direction

Use existing brand/hero-japan-phone.png, brand/editorial-ape-right.png and existing suitcase, logo and globe assets. Preserve aspect ratios and resting sizes. Source references are visual direction, not extractable asset packages. No random stock/image generation.

## 19. Motion system

Motion13.4.6 via motion/react, shared MotionPrimitives/MotionHeading/motionPresets/usePremiumMotion. Also CSS/WAAPI and canvas/WebGL effects. Tokens180/240/320/600ms, easing cubic(.16,1,.3,1), reduced-motion0. Presets use opacity/transform; WAAPI local850/1050ms differs. Current scroll profiles include phone-48, Japan-70, travel-58, ape+30. No heavy scroll library or mandatory GSAP.

## 20. Breakpoints

Studio uses many local ranges:1500,1200,1100,1000,850,800,700,360. Account1550/1250/1050/700. Destinations1100/800/767/540. Detail1100/700. Not a single uniform system; no global normalization during setup.

## 21. Responsive rules

Verify1440/1366/1280/1024/768/430/390/375px, long DE/FR/RU labels, portrait and touch. No horizontal overflow, clipped controls or aggressive mobile parallax. Preserve image sizes. Emulated viewport tests do not establish real iOS Safari overscroll behavior.

## 22. Accessibility requirements

Semantic controls, visible keyboard focus, labels, sensible reading order, contrast, ~44px touch targets, Escape/outside-dismiss where relevant, status announcement for loading, reduced motion. First visit English; preserve explicit locale choice. Keep existing security/payment semantics.

## 23. Visual QA checklist

Compare same-size before/after views; verify nav/search/filter/card/button/popover/modal interactions; loading/success/error/empty states; long strings; artwork overlap; background continuity; reduced motion; console/hydration errors if tooling available. Report limitations. No real payment or production mutation without authorization.

## Recorded inconsistencies, unchanged

Conceptual palette differs from implemented tokens. Legacy globals contain dark colors overridden by later styles. CSS Modules contain local literals and repeated overrides; global selectors can influence module styles. Type sizes and motion durations are not uniform. Breakpoints vary by page. Glass is intentionally limited to current account/header contexts. These observations are future audit inputs, not automatically approved fixes.

---
name: frontend-ui-engineering
description: "Use for implementing approved frontend changes with component consistency, accessibility and production quality."
---

# frontend-ui-engineering

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Inspect existing component boundaries and reuse design recipes. Keep JS/JSX; do not migrate to TypeScript or install a state library without need. Preserve server/client boundaries and authenticated ownership behavior. Model pending/success/error truthfully, retain SearchingOrb and existing request behavior. Check semantic controls, focus, keyboard, touch targets and reduced motion. Run relevant existing checks; avoid tests that merely mirror cosmetic CSS.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

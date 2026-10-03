---
name: interaction-design
description: "Use for deliberate micro-interactions, feedback and motion refinement within approved scope."
---

# interaction-design

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Use motion/react already installed, existing motion primitives and prefers-reduced-motion. Prefer transforms and opacity, stable final positions and native scrolling. No heavy smooth-scroll libraries or continuous effects by default. Keep mobile motion lighter; provide touch feedback, keyboard focus and truthful loading/error states. Do not change payment, auth or request semantics for animation.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

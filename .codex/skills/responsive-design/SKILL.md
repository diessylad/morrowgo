---
name: responsive-design
description: "Use for responsive QA and scoped fixes on desktop, laptop, tablet and mobile."
---

# responsive-design

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Check 1440, 1366, 1280, 1024, 768, 430, 390 and 375px. Inspect overflow, clipping, long translated labels, stacking, touch targets, sticky headers and overscroll backgrounds. Preserve phone/monkey/suitcase sizes and resting composition; do not shrink artwork to hide overflow. Reuse existing breakpoints when appropriate; do not normalize the entire site without approval. Device emulation is not real Safari verification.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

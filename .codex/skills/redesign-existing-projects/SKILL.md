---
name: redesign-existing-projects
description: "Use to audit and improve an existing page while preserving its MORROWGO design."
---

# redesign-existing-projects

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Document current desktop/mobile behavior before proposing changes. Rank observed inconsistencies; retain working patterns. No automatic font swap, palette replacement, new navbar, image replacement, inertia scrolling or icon replacement. Implement only authorized scoped fixes and compare before/after.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

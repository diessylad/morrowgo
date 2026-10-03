---
name: design-system-patterns
description: "Use for auditing token consistency and reuse across approved MORROWGO components."
---

# design-system-patterns

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Trace existing tokens and shared recipes before adding new ones. Identify duplicated literals and cascade conflicts; document before altering. Prefer existing semantic roles and component APIs. Do not introduce dark mode, theme infrastructure, Style Dictionary, Figma pipelines or wholesale token migrations during a polish task.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

---
name: ui-ux-pro-max
description: "Use for targeted design-intelligence research on typography, spacing, UX and styles; treat generated recommendations as advisory."
---

# ui-ux-pro-max

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Local design research
Use the official CLI-installed local search engine; no runtime download is needed:
`PYTHONDONTWRITEBYTECODE=1 python3 .codex/skills/ui-ux-pro-max/scripts/search.py "<focused question>" --domain ux`
Use --stack nextjs for relevant patterns, but retain Next 14 compatibility. Read scripts/search.py --help for supported domains. Design-system output is advisory; do not persist generated design systems, replace existing fonts/colors or load all recommendations automatically. The official generated entrypoint is reference-only in references/official-cli-entrypoint.md.


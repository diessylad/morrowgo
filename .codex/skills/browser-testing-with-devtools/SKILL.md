---
name: browser-testing-with-devtools
description: "Use for browser verification of approved frontend changes and reproducible visual QA."
---

# browser-testing-with-devtools

## MORROWGO contract
Read ../morrowgo-design/SKILL.md first for MORROWGO work. Existing implementation and explicit task scope outrank upstream aesthetic preferences. Preserve fonts, palette, layout, artwork and business behavior unless the user expressly authorizes a scoped change. Audit first; do not infer permission to redesign. Use the current JavaScript/Next 14 architecture and motion/react. Never add dependencies or execute remote installers just because an example suggests them.

## Workflow
Use available Codex browser tools (CUA or already-installed agent-browser); Chrome DevTools MCP is optional, not assumed. Do not install Claude .mcp.json configuration or npx latest tools automatically. Inspect rendered pages at specified widths, exercise keyboard/touch interactions and report console errors only if observed with available tools. Do not read private cookies/tokens or perform real purchases. Distinguish emulation from real iOS testing. Save screenshots and report coverage and limitations.

## Optional source reference
references/upstream.md preserves the audited source for attribution and selective consultation only. Its conflicting defaults are superseded above; do not load it routinely.

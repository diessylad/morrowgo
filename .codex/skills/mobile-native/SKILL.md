---
name: mobile-native
description: "Use for touch and mobile-browser quality checks of approved MORROWGO UI changes."
---

# mobile-native

Read ../morrowgo-design/SKILL.md first. Explicit MORROWGO scope and current branding outrank upstream defaults.

Gate hover by hover:hover and pointer:fine. Preserve zoom; inputs at least16px. Use touch-action:manipulation on buttons and retain active/focus feedback. Use dvh and safe areas for sheets, native scroll and overscroll containment inside dialogs. Do not disable root document scrolling/selection globally. Emulation is not real iOS verification; state this limitation.

Pinned MIT source: emilkowalski/skills at e8a175de22ae1e49370fc144c1f3bb9aeedf988d, skills/mobile-native. Optional references/upstream.md is attribution/reference, not a competing instruction source. Examples importing framer-motion use motion/react here; no dependency installs or global styling changes by default.

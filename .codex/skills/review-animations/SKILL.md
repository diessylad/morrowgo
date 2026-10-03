---
name: review-animations
description: "Use for a focused final animation review of changed MORROWGO controls and transitions."
---

# review-animations

Read ../morrowgo-design/SKILL.md first. Explicit MORROWGO scope and current branding outrank upstream defaults.

Review purpose, frequency, interruptibility, easing, reduced motion and mobile performance. Prefer transform/opacity, no transition:all, no permanent will-change. Constant marquee motion stays linear; interactions use existing premium easing. Keyboard navigation must remain immediate. Report only relevant defects; never rewrite unrelated animations.

Pinned MIT source: emilkowalski/skills at e8a175de22ae1e49370fc144c1f3bb9aeedf988d, skills/review-animations. Optional references/upstream.md is attribution/reference, not a competing instruction source. Examples importing framer-motion use motion/react here; no dependency installs or global styling changes by default.

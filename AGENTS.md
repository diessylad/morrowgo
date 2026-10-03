# MORROWGO frontend work

Use the repo-scoped `.codex/skills/morrowgo-design/SKILL.md` for frontend design work; `.agents/skills/` exposes these same skills to Codex. Prefer these repo adaptations over generic global versions for this project. Follow its routing; do not load every skill.

Audit before changing an existing page. Preserve branding, fonts, colors, layouts, navbar and monkey/phone/suitcase/logo assets unless explicitly authorized otherwise. Never rebuild pages from scratch or silently substitute assets. Keep changes scoped and retain responsive behavior and accessibility. Verify desktop/mobile visually and report actual coverage.

Design tasks must not alter authentication, ownership, Airalo, Stripe, backend, data/pricing or business logic. No deploy/commit without authorization. Existing dirty changes belong to the user; do not overwrite or revert them. Experimental gpt-taste requires explicit invocation.

Current implementation and inconsistencies: `docs/MORROWGO-DESIGN-SYSTEM.md`. Setup provenance: `.codex/design-skills.lock.json` and `docs/MORROWGO-DESIGN-SKILLS-AUDIT.md`.

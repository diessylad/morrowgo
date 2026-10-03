# MORROWGO Design Skills Stack audit

Setup only, 2026-10-03. No redesign, deployment or commit. All pre-existing files match the pre-task SHA-256 snapshot, including the nine dirty UI files listed in the inventory.

## A–C. Installed skills, sources and exact versions

| Skill | Source | Pinned revision |
|---|---|---|
| design-taste-frontend | Leonxlnx/taste-skill | `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b` |
| redesign-existing-projects | Leonxlnx/taste-skill | `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b` |
| high-end-visual-design | Leonxlnx/taste-skill | `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b` |
| image-to-code | Leonxlnx/taste-skill | `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b` |
| gpt-taste | Leonxlnx/taste-skill | `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b` |
| frontend-ui-engineering | addyosmani/agent-skills | `a06bc63b3f8b829c14b0bbf53d99fefc39d58092` |
| browser-testing-with-devtools | addyosmani/agent-skills | `a06bc63b3f8b829c14b0bbf53d99fefc39d58092` |
| visual-design-foundations | wshobson/agents | `156b7a5e7a8b93642628a339ee4039c925b34c7f` |
| design-system-patterns | wshobson/agents | `156b7a5e7a8b93642628a339ee4039c925b34c7f` |
| responsive-design | wshobson/agents | `156b7a5e7a8b93642628a339ee4039c925b34c7f` |
| interaction-design | wshobson/agents | `156b7a5e7a8b93642628a339ee4039c925b34c7f` |
| ui-ux-pro-max | nextlevelbuilder/ui-ux-pro-max-skill | `CLI 2.15.0; npm gitHead a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5` |
| web-design-guidelines | vercel-labs/web-interface-guidelines | `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1` |
| morrowgo-design | This repository | `Local MORROWGO coordinator` |

The six requested upstream repositories were inspected at the SHAs in `.codex/design-skills.lock.json`. UIUX repository HEAD declares CLI 2.5.0, which is not published; registry release 2.15.0 was independently pinned and its integrity recorded. Do not conflate these two sources. Official installation ran in a temporary staging directory using `npm exec --yes --ignore-scripts --package=ui-ux-pro-max-cli@2.15.0 -- uipro init --ai codex --offline`; only its principal skill/data/search scripts were copied into this repo. No global install, --force, package.json or lockfile edits. Six automatically generated sibling skills were excluded.

## D–E. Files

Only new setup files were created. No pre-existing file was modified. Canonical entries live in `.codex/skills`; individual `.agents/skills` symlinks expose them to Codex without duplicated implementations. Full file inventory follows below. Existing uncommitted site changes remain untouched, so the whole working-tree diff still includes older UI work; the incremental diff of this task is exclusively setup.

## F. Provider adaptation

Active entrypoints use Codex-neutral wording and existing tools. Addy's Chrome DevTools workflow does not assume Claude .mcp.json or installed MCP; use available browser tools and disclose unsupported checks. UIUX official generated entrypoint is archived as optional reference, with a concise active adapter. Taste screenshot-generation instructions do not automatically invoke tools or manufacture assets. Original licensed upstream text remains reference-only for attribution; it is not routinely loaded and does not override the local entrypoints.

## G. Rejected or excluded

Anthropic frontend-design at the pinned SHA was reviewed, not installed: its typography/composition/art-direction and motion advice substantially duplicates Taste + UIUX. Apache-2.0 license inspected; no active conversion needed. Vercel agent-skills lacks a root license, so its original entrypoint was not copied; an original local QA adapter uses the separately MIT-licensed web-interface-guidelines command.md pinned at e3d624baaf29dc1fc645aff3e38f03e564d2d6b1. UIUX CLI sibling banner-design, brand, design, design-system, slides and ui-styling were excluded as duplicate/out-of-scope. No unrelated backend/CI skills installed.

## H. Audit and resolved conflicts

Selected Taste/Addy/Wshobson sources are MIT. Their selected skills have no scripts requiring execution; only SKILL.md and licenses were retained, with upstream text as non-active reference. UIUX search scripts use Python standard-library/local CSV data; --persist can write a generated design system and is not part of the default workflow. CLI bundled install code was inspected; template offline initialization was used, not legacy latest-release/network/update paths. Package scripts and potential network/install behavior were reviewed before execution. Vercel mutable-main runtime fetching was replaced with local pinned guidelines. No unreviewed installer or remote shell script was run.

Conflicts removed from active guidance: compulsory Arial/Helvetica replacement; palette swaps; mandatory floating navbar/nested glass/hardware cards; random stock imagery; simulated tool/RNG results; forced GSAP/AIDA/hero resizing; heavy smooth-scroll inertia; dark-mode/theming infrastructure; framer-motion examples and blue example accents; generic form rules that could remove compatibility/security gating. Existing Motion, assets, CSS architecture and truthful request states remain authoritative. Browser-locale auto-selection in generic QA does not override MORROWGO first-visit EN and manual language persistence. Current brief palette differs from actual tokens: both are documented; neither was changed.

## I. Routing

MORROWGO brand coordinator applies to frontend design tasks. Ordinary work: design-taste-frontend + frontend-ui-engineering. Existing page: redesign-existing-projects + frontend-ui-engineering. Premium polish: high-end-visual-design. Reference recreation: image-to-code + frontend-ui-engineering. Final QA: web-design-guidelines + responsive-design + browser-testing-with-devtools. UIUX and narrow specialists load only for targeted questions. gpt-taste has allow_implicit_invocation:false and requires an explicit request. Do not load the whole stack. Repo adaptations take precedence for MORROWGO work; global skills were not edited.

## J. Verification and unchanged website

Actual Codex app-server skills/list with repository cwd and forceReload discovered all 14 enabled skills with zero errors; saved in MORROWGO-SKILL-DISCOVERY.json. All frontmatter parsed successfully; official skill-creator validation was also run. Local UIUX search smoke test returned relevant UX results. SHA-256 comparison confirms every pre-existing file is unchanged. No UI, functionality, dependencies, auth, backend, routes, database or payments were altered. No visual site test/redesign is claimed. Build/lint/typecheck were not run: no app code changed; prebuild writes CSS, no TypeScript setup exists, and lint can require creating configuration.

## K. Next request, after setup approval

`$morrowgo-design Проведи только визуальный аудит текущего MORROWGO с $redesign-existing-projects и $frontend-ui-engineering. Ничего не меняй. Проверь desktop/mobile, перечисли наблюдаемые проблемы с файлами и скриншотами, предложи приоритетный план.`

## Created file inventory

- `.agents/skills/browser-testing-with-devtools`
- `.agents/skills/design-system-patterns`
- `.agents/skills/design-taste-frontend`
- `.agents/skills/frontend-ui-engineering`
- `.agents/skills/gpt-taste`
- `.agents/skills/high-end-visual-design`
- `.agents/skills/image-to-code`
- `.agents/skills/interaction-design`
- `.agents/skills/morrowgo-design`
- `.agents/skills/redesign-existing-projects`
- `.agents/skills/responsive-design`
- `.agents/skills/ui-ux-pro-max`
- `.agents/skills/visual-design-foundations`
- `.agents/skills/web-design-guidelines`
- `.codex/design-skills.lock.json`
- `.codex/skills/browser-testing-with-devtools/LICENSE`
- `.codex/skills/browser-testing-with-devtools/SKILL.md`
- `.codex/skills/browser-testing-with-devtools/references/PROVENANCE.md`
- `.codex/skills/browser-testing-with-devtools/references/upstream.md`
- `.codex/skills/design-system-patterns/LICENSE`
- `.codex/skills/design-system-patterns/SKILL.md`
- `.codex/skills/design-system-patterns/references/PROVENANCE.md`
- `.codex/skills/design-system-patterns/references/upstream.md`
- `.codex/skills/design-taste-frontend/LICENSE`
- `.codex/skills/design-taste-frontend/SKILL.md`
- `.codex/skills/design-taste-frontend/references/PROVENANCE.md`
- `.codex/skills/design-taste-frontend/references/upstream.md`
- `.codex/skills/frontend-ui-engineering/LICENSE`
- `.codex/skills/frontend-ui-engineering/SKILL.md`
- `.codex/skills/frontend-ui-engineering/references/PROVENANCE.md`
- `.codex/skills/frontend-ui-engineering/references/upstream.md`
- `.codex/skills/gpt-taste/LICENSE`
- `.codex/skills/gpt-taste/SKILL.md`
- `.codex/skills/gpt-taste/agents/openai.yaml`
- `.codex/skills/gpt-taste/references/PROVENANCE.md`
- `.codex/skills/gpt-taste/references/upstream.md`
- `.codex/skills/high-end-visual-design/LICENSE`
- `.codex/skills/high-end-visual-design/SKILL.md`
- `.codex/skills/high-end-visual-design/references/PROVENANCE.md`
- `.codex/skills/high-end-visual-design/references/upstream.md`
- `.codex/skills/image-to-code/LICENSE`
- `.codex/skills/image-to-code/SKILL.md`
- `.codex/skills/image-to-code/references/PROVENANCE.md`
- `.codex/skills/image-to-code/references/upstream.md`
- `.codex/skills/interaction-design/LICENSE`
- `.codex/skills/interaction-design/SKILL.md`
- `.codex/skills/interaction-design/references/PROVENANCE.md`
- `.codex/skills/interaction-design/references/upstream.md`
- `.codex/skills/morrowgo-design/SKILL.md`
- `.codex/skills/redesign-existing-projects/LICENSE`
- `.codex/skills/redesign-existing-projects/SKILL.md`
- `.codex/skills/redesign-existing-projects/references/PROVENANCE.md`
- `.codex/skills/redesign-existing-projects/references/upstream.md`
- `.codex/skills/responsive-design/LICENSE`
- `.codex/skills/responsive-design/SKILL.md`
- `.codex/skills/responsive-design/references/PROVENANCE.md`
- `.codex/skills/responsive-design/references/upstream.md`
- `.codex/skills/ui-ux-pro-max/LICENSE`
- `.codex/skills/ui-ux-pro-max/SKILL.md`
- `.codex/skills/ui-ux-pro-max/data/app-interface.csv`
- `.codex/skills/ui-ux-pro-max/data/catalog-summary.json`
- `.codex/skills/ui-ux-pro-max/data/charts.csv`
- `.codex/skills/ui-ux-pro-max/data/colors.csv`
- `.codex/skills/ui-ux-pro-max/data/data-provenance.json`
- `.codex/skills/ui-ux-pro-max/data/google-font-licenses.json`
- `.codex/skills/ui-ux-pro-max/data/google-fonts.csv`
- `.codex/skills/ui-ux-pro-max/data/icons.csv`
- `.codex/skills/ui-ux-pro-max/data/landing.csv`
- `.codex/skills/ui-ux-pro-max/data/motion.csv`
- `.codex/skills/ui-ux-pro-max/data/phosphor-icons-upstream.json`
- `.codex/skills/ui-ux-pro-max/data/products.csv`
- `.codex/skills/ui-ux-pro-max/data/react-performance.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/angular.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/astro.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/avalonia.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/flutter.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/html-tailwind.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/javafx.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/jetpack-compose.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/laravel.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/nextjs.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/nuxt-ui.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/nuxtjs.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/react-native.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/react.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/shadcn.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/svelte.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/swiftui.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/threejs.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/uno.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/uwp.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/vue.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/winui.csv`
- `.codex/skills/ui-ux-pro-max/data/stacks/wpf.csv`
- `.codex/skills/ui-ux-pro-max/data/styles.csv`
- `.codex/skills/ui-ux-pro-max/data/typography.csv`
- `.codex/skills/ui-ux-pro-max/data/ui-reasoning.csv`
- `.codex/skills/ui-ux-pro-max/data/ux-guidelines.csv`
- `.codex/skills/ui-ux-pro-max/references/official-cli-entrypoint.md`
- `.codex/skills/ui-ux-pro-max/scripts/core.py`
- `.codex/skills/ui-ux-pro-max/scripts/design_system.py`
- `.codex/skills/ui-ux-pro-max/scripts/reasoning_contract.py`
- `.codex/skills/ui-ux-pro-max/scripts/search.py`
- `.codex/skills/ui-ux-pro-max/scripts/validate_data.py`
- `.codex/skills/visual-design-foundations/LICENSE`
- `.codex/skills/visual-design-foundations/SKILL.md`
- `.codex/skills/visual-design-foundations/references/PROVENANCE.md`
- `.codex/skills/visual-design-foundations/references/upstream.md`
- `.codex/skills/web-design-guidelines/LICENSE`
- `.codex/skills/web-design-guidelines/SKILL.md`
- `.codex/skills/web-design-guidelines/references/web-interface-guidelines.md`
- `AGENTS.md`
- `docs/MORROWGO-DESIGN-INVENTORY.md`
- `docs/MORROWGO-DESIGN-SYSTEM.md`
- `docs/MORROWGO-SKILL-DISCOVERY.json`
- `docs/MORROWGO-DESIGN-SKILLS-AUDIT.md`

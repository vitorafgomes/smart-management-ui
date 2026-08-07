# AGENTS.md — frontend skills & agents routing (Smart Management UI)

Referenced from `CLAUDE.md`. This file maps **tasks → the agents and skills available in this environment**. It does **not** change the vault-first workflow: the vault is the source of truth for *what this codebase is and why*; these skills and agents are the source of truth for *how to do a frontend task well*.

## Order of operations

1. **Vault first.** `vault/index.md` → `vault/pages/features/<feature>.md` → linked `vault/pages/invariants/*` / `decisions/*` / `conventions/*`. *(Populated in Phase 2; until then, use the root `CLAUDE.md` Rules A–G + source.)*
2. **Then a skill/agent from the table below** for the mechanics — invoke by name; don't reason from pretraining when a skill covers the task.
3. **Then grep source** only if vault + skill leave a gap.
4. **Crystallize** new findings back with `/wiki-crystallize`.

## How to invoke

- **Skill** → `Skill` tool with `skill: "<name>"` or `skill: "<plugin>:<skill>"`, e.g. `ui-ux-pro-max:ui-ux-pro-max`. Skills are procedural guidance you run inline.
- **Agent** → `Agent` tool with `subagent_type: "<name>"`, e.g. `angular-architect`. Agents are multi-step workers; use them for real implementation and large sweeps, not one-line edits.

---

## Tier 1 — Primary (use routinely on this repo)

| Task | Skill / Agent | Notes |
|---|---|---|
| Angular architecture, signals, state, routing, NgRx/SignalStore, SSR decisions | Agent `angular-architect` | The default owner of non-trivial Angular implementation here. Pair with Rule A. |
| Cross-framework frontend work, or full-stack wiring | Agent `frontend-developer` | Reach for it when the task is not Angular-specific. |
| Type-system-heavy work (generics, discriminated unions, strict typing, build config) | Agent `typescript-pro` | Also the right call for `tsconfig` / type-safety debt. |
| **Before building or designing any UI surface** | Skill `ui-ux-pro-max:ui-ux-pro-max` | Blocking for new screens, components, and layout work — run it before writing markup. |
| Visual / aesthetic direction, typography, making a UI not read as templated | Skill `frontend-design:frontend-design` | Use alongside the UX skill when the look is being decided. |
| **Before ANY chart, graph, or dashboard work** | Skill `dataviz` | Read it before the first line of chart code or a single color choice. |
| Accessibility audit, WCAG compliance, assistive-tech support | Agent `accessibility-tester` | Run on any new user-facing surface; a11y failures are Rule B structural failures. |
| Test strategy, coverage planning, QA sweeps | Agents `qa-expert`, `test-automator` | `qa-expert` for strategy and gaps; `test-automator` for building out the Vitest suite. |
| Writing a feature or fix test-first | Skill `superpowers:test-driven-development` | The default process for the feature and bugfix lanes. |
| A bug, test failure, or unexplained behavior | Skill `superpowers:systematic-debugging` | Before proposing any fix — see the `diagnose` lane. |
| **Before any PR touching an external boundary** (HTTP, storage, browser APIs) | Skill `production-readiness-checks` | Minimum: one test per boundary simulating the call failing. Pairs with Rule G. |

## Tier 2 — Situational (reach for when the task arises)

| When | Skill / Agent |
|---|---|
| Bundle size, runtime performance, rendering cost, budget overruns | Agent `performance-engineer` |
| Broad code-quality review of a change set | Agent `code-reviewer` |
| Auth flows, token handling, XSS/CSRF surface, dependency risk | Agent `security-auditor` |
| Module Federation / independently deployed frontends | Agent `microfrontend-architect` — **only if this app is ever federated**; it is a single standalone app today. |

## Not applicable to this repo

- `dotnet-*` plugins (`dotnet-test`, `dotnet-data`, `dotnet-msbuild`, `dotnet-diag`, …) — no .NET code here.
- Backend / server-side agent lanes (`backend-developer`, `csharp-developer`, `postgres-pro`, `microservices-architect`, …) — this repo is the frontend only; API work belongs in the service that owns it.

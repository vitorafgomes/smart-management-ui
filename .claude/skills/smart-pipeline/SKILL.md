---
name: smart-pipeline
description: smart-management-ui task orchestration. Always use this skill BEFORE writing or editing any code in this repo - for bug fixes ("fix", "broken", "error", "stale", "wrong value", "doesn't work"), features ("add", "implement", "create", "new page", "new component"), refactors ("clean up", "restructure", "rename", "optimize"), and diagnostics ("why", "investigate", "debug", "what causes", "diagnose"). Use even when the user gives a plain one-line request with no command. When in doubt whether a code task is being requested, use this skill.
---

# smart-management-ui task pipeline

This file carries the full stage order so the pipeline works standalone. Once the vault is populated (Phase 2), the canonical, repo-specific definition lives in `vault/pages/conventions/orchestration-pipeline.md` and repo facts live in the vault pages; read it if anything below is unclear.

## 1. Classify and announce

Classify: **Feature / Bug / Refactor / Investigate** (per `vault/CLAUDE.md` routing table). Check the fast path:

- **FAST PATH** (all must hold: doc/comment-only OR a single-line change with no logic, signature, template, or DI impact): edit -> gate (`ng build` clean; if any `src/` file changed, also `ng test --no-watch` green and `prettier --check` on the touched files - doc-only edits build nothing) -> propose commit message. Done.
- **Never trivial:** route configuration, guards, resolvers, interceptors, forms and validation, HTTP services, state services, and auth code. These always take the full lane no matter how small the diff looks.

State classification + tier + one-line reason + **model plan** (which stages dispatch to pinned cheaper models - see §Token rules) before any edit.

## 2. Read the lane file

Read exactly one from this directory: `feature.md` | `bugfix.md` | `refactor.md` | `diagnose.md`. Follow its stages in order.

## 3. Hard gates (every non-trivial code lane)

1. **Vault first** - feature page + linked invariants BEFORE editing. A change violating an invariant stops here (revise, or draft a superseding ADR). *The vault is currently unpopulated (Phase 2 pending) - fall back to the root `CLAUDE.md` Rules (A-G) and the actual code.*

   **Capability check.** A feature page says what a surface *does*; it does not carry the rules for a capability you are about to *add*. Also read the page for each surface the change touches:

   | The change... | Read first | The trap it exists for |
   |---|---|---|
   | adds or changes a **route** | [[vault/pages/conventions/routing]] | a new route that skips the established guard; a feature added eagerly when every sibling is lazy-loaded; a guard that redirects but leaves stale state behind |
   | adds a **form** | [[vault/pages/conventions/forms]] + root Rule G | validation that exists on the client only; a submit path with no error surface; a disabled-button "guard" that is not backed by real validation |
   | adds an **HTTP call** | [[vault/pages/conventions/correlation-id]] + root Rule G | `HttpClient` injected straight into a component; an untyped response; a failure that reaches only the console and never the user; hand-adding `X-Correlation-Id` / `X-Session-Id` — **never do this**, the shared-kernel interceptor owns both headers; bypassing `HttpClient` with `fetch`, so the interceptor never runs |
   | adds or changes **shared state** | root Rule A | the same server data fetched and held by two components; a second async idiom introduced alongside the established one; state that outlives the route that owns it |
   | adds a **user-facing surface** | [[vault/pages/conventions/ui-ux]] | shipping markup before running `ui-ux-pro-max`; no keyboard path; loading and error states that were never designed |
   | adds a **new module** | [[vault/pages/decisions/0001-modular-monolith-architecture]] + [[vault/pages/conventions/modular-architecture]] | a screen mistaken for a bounded context; layers skipped "just for this one"; an `index.ts` that re-exports everything, which is a deep import with a shorter path |
   | adds a **cross-module import** | [[vault/pages/invariants/module-boundaries]] | reaching into another module's internals through the alias, which looks legitimate and is not; a dependency that should have gone through `shell/` or `shared-kernel/` |
   | adds **state** | [[vault/pages/conventions/signals-state]] | a public writable signal; a derived value kept in sync by hand instead of `computed()`; a new `BehaviorSubject`, which introduces a second state idiom alongside signals |

   Reading the feature page is not a substitute for reading the convention that governs the capability.
2. **Rule B per edit** - edit -> test -> validate structure/architecture (root CLAUDE.md).
3. **Diff-gated skills** - run ONLY the skills/agents whose surface the diff touches (routing in `AGENTS.md`). Never hand-roll an audit a skill covers. A UI surface runs `ui-ux-pro-max` **before** the markup is written, not after.
4. **Build gate** - `ng build` completes with **zero errors AND zero warnings**. Bundle-budget warnings count: fix them, or consciously adjust the budget in `angular.json` and say why in the summary.
5. **Test gate** - `ng test --no-watch` **fully green, no filtering**. Then `npx prettier --check` clean on every touched file. Gates 4 and 5 dispatch to `smart-mechanic`.
6. **Review gate** - dispatch `smart-reviewer` with the affected feature area. A diff touching **auth, route guards, or form validation** -> 3 parallel `smart-reviewer` instances with lenses: `invariants` / `ux-a11y` / `regression-coverage`. Fix CONFIRMED findings, re-gate.
7. **Crystallize** - vault updates + one `log.md` line.
8. **STOP at commit message** - propose it in a code block; never run `git commit` (Rule E).

## Token rules

- A skill whose surface the diff doesn't touch does not run. A 10-line component fix runs zero audits.
- Don't re-run gates on an unchanged diff; reuse session findings.
- **Model routing**: the policy table lives in the root `CLAUDE.md` **Model routing** section - follow it, don't restate it here. Pipeline-specific notes: the mechanic never fixes (failures come back verbatim), and a stage whose expected output is under ~50 lines runs inline instead of dispatching.

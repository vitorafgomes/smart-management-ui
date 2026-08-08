# CLAUDE.md — Smart Management UI

This file is auto-loaded into every Claude Code session in this repo. Rules here are project-level and apply to me, to any subagents I spawn, and to anyone pairing with Claude in this workspace.

> **Setup status (2026-08-07):** the LLM-wiki framework + `.claude` pipelines were ported from the WayUp Backend template. The vault is currently **EMPTY** — Phase 2 population is pending. Until it is populated, work from the Rules below plus the source, and `/wiki-crystallize` findings back as pages land.

## Vault (LLM Wiki) — Read First

This repo has an LLM wiki at [`./vault/`](./vault/). **Before any code search, read [`vault/index.md`](./vault/index.md) and follow wikilinks to relevant pages.** If the vault can answer, use it; only grep source as fallback, and append findings back with `/wiki-crystallize`.

- Entry point: `vault/index.md`
- Per-vault schema / operation contract: @vault/CLAUDE.md
- Config: `vault/wiki-config.md` | Page schema: `vault/wiki-schema.md`
- Page templates: `vault/templates/` (`_service.md`, `_adr.md`, `_invariant.md`, `_incident.md`, `_runbook.md`, `_roadmap-initiative.md`, `_history-change.md`, `_domain-term.md`, `_flow.md`)

**On every nontrivial code change:** read the matching `vault/pages/features/<feature>.md`, every invariant it links to (`vault/pages/invariants/*`), and relevant ADRs in `vault/pages/decisions/`. Flag any change that would violate a documented invariant before proposing code. *(These pages arrive in Phase 2; until then, use the Rules below.)*

## Project snapshot

- **What:** `smart-management-ui` — the back-office/admin frontend for the Smart Management ecosystem.
- **Migration target.** This repo replaces the production Angular 21 micro-frontend app at `/home/vitorafgomes/WorkSpace/Dev/Smart.Management/smart-management-ui` (**read-only — inspect, never modify**). Nothing is migrated yet: [[vault/pages/migration/migration-status]], [[vault/pages/migration/legacy-source-overview]].
- **Data & auth are MOCKED** this phase — no backend, no identity provider. [[vault/pages/decisions/0002-mock-first-auth-and-data]]
- **Deploy:** Cloudflare Workers static assets only (Workers Builds on push to `main`, config in `wrangler.jsonc`). No Docker, no Helm. [[vault/pages/conventions/deployment]]
- **Framework:** Angular 22.1, standalone application (no NgModules), SCSS, **no SSR**.
- **Tests:** Vitest + jsdom, run through the `@angular/build:unit-test` builder. Single run: `ng test --no-watch`.
- **Formatting:** Prettier (`.prettierrc` at the repo root). Check touched files with `npx prettier --check <files>`.
- **Linting:** `angular-eslint` + `eslint-plugin-boundaries` (flat config in `eslint.config.js`). **`npm run lint` is a mandatory gate** alongside build and test — it enforces the Rule H boundaries mechanically, not just by review.
- **E2E:** Playwright, `npm run e2e` (chromium, `webServer` starts `ng serve`). Per PR, not per edit.
- **CI:** `.github/workflows/ci.yml` runs lint, build, unit and E2E on every PR and on push to `main`.
- **Package manager:** npm (`packageManager: npm@11.17.0`).
- **Entry points:** `src/main.ts` (bootstrap), `src/app/app.routes.ts` (routing), `src/styles.scss` (global styles).
- **Build:** `ng build` (defaults to the production configuration, which enforces bundle budgets).
- **Node:** via nvm — `~/.nvm/versions/node/v24.19.0/bin` must be on `PATH` for any `ng` command.

## Project conventions, architecture, and per-feature rules

All conventions, architecture decisions, invariants, and per-feature rules live in the **vault**. Start at [`vault/index.md`](./vault/index.md) and follow wikilinks. *(Empty until Phase 2 — until then this file is the authority.)*

## Team rules

*The rule **letters** below are referenced by the hooks and the `smart-pipeline` skill — keep them stable.*

### Rule A — State & data discipline

Component state is **signals-first**. Shared and server state lives in an injectable service, never duplicated across components — two components showing the same server data read one service, they do not each fetch and hold their own copy. **HTTP access goes through a typed service**; a component never injects `HttpClient` and calls it inline. Use the async pattern already established in the codebase for a given surface (signals, resource, or RxJS where it is already the idiom) — do not introduce a parallel one alongside it.

### Rule B — Edit → Test → Validate cycle (per edit, not per PR)

Every code edit must run through this cycle before moving on to the next edit:

1. **Edit.** Make the change.
2. **Test.** If the change is testable (pure function, service method, component behavior, guard, validator, pipe), add or update a Vitest spec for the scenario. If it's wiring with nothing meaningful to assert, say so explicitly — don't silently skip.
3. **Validate structure.** Standalone components only; `input()` / `output()` functions over `@Input()` / `@Output()` decorators; `inject()` over constructor injection where the codebase already does so; no `any` without a written justification; OnPush / zoneless-compatible patterns (no reliance on implicit change detection). **The full checklist is [[vault/pages/conventions/angular-best-practices]]** — native control flow, `@defer`, `host` metadata, typed forms, `NgOptimizedImage`, naming, and template accessibility. Use it, don't work from memory.
4. **Validate architecture.** Does the edit respect the rules in this file and the vault pages it touches?
5. **Gates.** `ng build` completes with **zero errors AND zero warnings** — budget warnings count; fix them or consciously adjust the budget in `angular.json` and say why. `ng test --no-watch` fully green, no test filtering. `npx prettier --check` clean on every touched file.

### Rule C — No new generic abstractions "for the future"

Three similar lines is better than a premature abstraction. If you find yourself adding a wrapper service, a base class, a generic helper, or a shared `utils` module that currently has one concrete consumer, don't. Bug fixes don't need surrounding cleanup; one-shot operations don't need helpers.

### Rule D — Always verify before recommending from memory or past state

Repos accumulate stale directories, commented-out providers, and half-finished state. If you're about to recommend or call something, grep/read it first — don't trust that because it was referenced somewhere it's live.

### Rule E — Claude never commits; propose message, the human commits

Claude **must not** run `git commit`, `git push`, `git tag`, `git merge`, `git rebase`, `git revert`, `git reset --hard`, `git cherry-pick`, or any other history-writing git operation. After a change is implemented and validated, Claude **proposes a commit message in chat** (in a code block, ready to copy-paste) and stops. The human reviews, edits if needed, and runs the commit. The per-instance exception ("commit this for me" overrides the default for that one operation only) is preserved — the `pre-git-guard` hook surfaces these as a permission *ask*, not a hard deny. Read-only git (`status`, `diff`, `log`, `show`, `blame`) is unrestricted.

### Rule F — Clean imports

No unused imports — in TypeScript files or in a standalone component's `imports:` array. No deep relative-path spaghetti (`../../../`) where a `tsconfig` path mapping exists. Keep import groups tidy and consistently ordered. When editing a file, clean up any import drift you notice in that file.

### Rule G — Errors are handled at the boundary, typed, and surfaced to the user

Every HTTP call returns a **typed** result, and its failure path is handled at the boundary that owns it — the service, or an interceptor.

- A component **never swallows an error silently.** A failed call always produces a user-visible state: an error message, an empty-with-reason state, or a retry affordance.
- A failure logged only to the console is not handled. The user must be able to tell the difference between "no data" and "the request failed".
- **No empty `catch {}` blocks**, and no `catch` that discards the error without either surfacing it or rethrowing.
- Loading, success, and error are all real states. A surface that can fail must be able to render its failure.

### Rule H — Module boundaries

The app is a **modular monolith**: `src/app/shell/` (composition), `src/app/shared-kernel/` (cross-cutting), and `src/app/modules/<context>/` bounded contexts layered `domain/` (pure TS) → `application/` (signals facades) → `infrastructure/` (adapters) → `ui/`. The decision and its rationale: [[vault/pages/decisions/0001-modular-monolith-architecture]]; the folder tree, import examples, and the "adding a module" checklist: [[vault/pages/conventions/modular-architecture]].

Two rules, both non-negotiable:

- **A module is reached only through its public API.** Import `@modules/<context>`, which resolves to that module's `index.ts` — never a path into another module's internals, aliased or relative. [[vault/pages/invariants/module-boundaries]]
- **Layer dependencies point one way.** `ui` → `application` → `domain`, never backwards; `infrastructure` implements the ports `domain` declares and nothing depends on it except the DI binding; `domain/` imports no Angular, no RxJS, no HTTP. [[vault/pages/invariants/layer-dependencies-one-way]], [[vault/pages/invariants/domain-layer-purity]]

Two more invariants follow from the same decision: state is signals-first ([[vault/pages/invariants/state-is-signals-first]], expanding Rule A) and every HTTP request carries both correlation headers via the single shared-kernel interceptor ([[vault/pages/invariants/every-http-request-carries-correlation-id]]) — services never hand-add those headers.

**Enforced since Phase 0.** `angular-eslint` + `eslint-plugin-boundaries`, the `tsconfig` path mapping, and the correlation interceptor with its pinning spec are all in place and run in CI. `src/app/modules/` is still empty, so the boundary rules currently hold vacuously — but they were proven to fire against deliberate violations before landing, so the first module is governed from its first commit rather than setting a precedent nobody checked. The one invariant that stays review-only is signals-first state ([[vault/pages/invariants/state-is-signals-first]]): every version of that violation depends on what the state means, not on which file imports which.

### Rule I — Dependency discipline: security first

**Adding a package is a security decision, not a convenience.** Before any `npm i`: necessity (Rule C — can ~30 lines of ours do it?), provenance (exact name verified, real maintainer/repo), health (maintained, adopted, no open advisories), transitive surface, install scripts read if any, and `npm audit` clean of new high/critical findings afterwards. The answers go in the PR that adds the package. Lockfile committed and installed with `npm ci`; dependabot bumps are consolidated with a regenerated lockfile, never merged blind; CI blocks on `npm audit --omit=dev --audit-level=high`. The full gate: [[vault/pages/conventions/dependency-security]].

## Model routing

Which model does what. Applies to me and to every subagent I spawn.

| Work | Model |
|---|---|
| Planning, architecture, design decisions, final validation | **Main thread** (top model). Never writes code directly on a non-trivial task. |
| Non-trivial implementation — features, refactors, diagnosed bugfixes | **Opus** subagent |
| Review gate (`smart-reviewer`) | **Opus**, effort high |
| Mechanical edits — renames, boilerplate, applying a ready plan | **Sonnet** |
| Commits, push, PR mechanics | **Sonnet** |
| Build / test / lint runs (`smart-mechanic`) | **Haiku**, effort low |
| Codebase surveys (`Explore`) | **Haiku** |
| Test writing from a defined spec | **Sonnet** |
| Vault and docs writing | **Sonnet**, reviewed by the main thread |

The main thread plans and validates; it does not implement. A stage that can be pinned to a cheaper model is pinned — see the `smart-pipeline` skill's Token rules.

## When working here

- **Every code task routes through the `smart-pipeline` skill (blocking requirement).** Bug fix, feature, refactor, or diagnostic — invoke `smart-pipeline` before writing or editing any code; it classifies the task and walks the gated pipeline (trivial edits take its fast path). Do not start editing from a plain request without it.
- **Vault first, code second.** `vault/index.md` → `vault/pages/features/<feature>.md` → `vault/pages/invariants/*` → then grep source. *(While the vault is empty, go to source sooner — but still crystallize findings back.)*
- **After every session with new findings:** `/wiki-crystallize` into the vault. Append one line to `vault/log.md`: `## [YYYY-MM-DD] crystallize | <short title>`.
- Use the **Explore** subagent for codebase surveys >3 queries.
- Agent and skill routing lives in **[`AGENTS.md`](./AGENTS.md)** — consult it after the vault, before grepping source.
- **All comments in English. All identifiers in English. No emojis in code.**
- Prefer editing existing files over creating new ones.
- Don't write planning/analysis markdown outside the vault. The vault and this file are the exceptions and already exist — update them, don't fork them.

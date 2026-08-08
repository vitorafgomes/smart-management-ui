---
title: "Migration plan"
version: "1.0"
date: 2026-08-08
changes: "Initial phased plan from foundation to module waves"
page_type: roadmap
status: active
description: "Phased plan for migrating the legacy micro-frontend app into the modular monolith, with per-phase exit criteria and user decision checkpoints."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Migration plan

The sequenced companion to [[pages/migration/migration-status]] (which tracks *state*; this page tracks *order and criteria*). Grounded in the legacy inventory: [[pages/migration/legacy-source-overview]]. Target shape: [[pages/decisions/0001-modular-monolith-architecture]]. Everything runs mock-first: [[pages/decisions/0002-mock-first-auth-and-data]].

Working rules for every phase: one consolidated branch per phase, one PR, the user merges; merge to `main` deploys ([[pages/conventions/deployment]]); all gates green before the PR opens (root CLAUDE.md Rule B); the legacy repo is read-only reference.

## Phase 0 - Enforcement foundation

The pattern exists only on paper until the tooling makes it self-enforcing. Smallest possible code PR:

- `angular-eslint` + `eslint-plugin-boundaries` configured with the layer/module rules; a deliberate forbidden-import must fail the lint (negative test) before the PR opens.
- `tsconfig` paths: `@modules/*` resolving only to module `index.ts` files; `@shared-kernel/*`.
- `shared-kernel/correlation/`: the two-header interceptor + its pinning spec ([[pages/conventions/correlation-id]]).
- Playwright harness (`npm run e2e`) with the boot smoke test only.
- GitHub Actions CI: lint + build + unit + e2e on every PR.

Partial work for this phase existed in git stash `parked: modular-architecture code` on `feat/modular-architecture`; its eslint config and correlation implementation were reused (re-implemented on the Phase 0 branch, not stash-applied), its module scaffolding was not.

**Exit criteria:** all four gates runnable and green in CI; boundary lint proven to fire; invariant pages updated with real `enforced_by`/`verified_by` references.

**Status: done, 2026-08-08.** All four gates green; the negative proof caught two rules that were silently not firing (domain purity expressed as a boundaries policy, and deep alias imports classified as external packages) - both are now closed by `no-restricted-imports`. The app is unchanged visually, as intended.

## Phase 1 - Shell and theming

The chrome every module renders inside; nothing module-specific.

- SmartAdmin sass/webfonts/icons payload into global styles (largest mechanical chunk; port, do not redesign).
- `shell/`: main layout, auth layout, routing skeleton; layout store and dynamic menu (menu data mocked).
- `shared-kernel/`: mock auth service + guards, mock tenant storage, global error handler, toast/notification services.

**Exit criteria:** app boots into the ported layout with mock auth gating routes; E2E smoke covers login-redirect and layout render; gates green.

**Status: done, 2026-08-08.** All four gates green. The theme forced a deliberate budget change (initial 500 kB to 1 MB warning) - the SmartAdmin global CSS alone is 507 kB raw / 61 kB transferred, and it is the product's look, not accidental weight. What was consciously left out: everything in the ported chrome that needed a dependency with no consumer yet (`@ng-bootstrap` collapse/dropdown/offcanvas, simplebar, ngx-toastr, vanta.js) was re-expressed with signals or dropped, so the only new dependency is `bootstrap` for the sass the theme imports. See [[pages/migration/migration-status]].

## Phase 2 - First module: identity

`mfe-identity-tenant` goes first (per the recommendation in [[pages/migration/migration-status]]): it already separates domain/application/infrastructure/presentation, so it exercises the pattern without a redesign.

- Port into `modules/identity/` mapping `presentation/` to `ui/`; every repository port gets an in-memory mock implementation.
- Facades become signals-first per [[pages/conventions/signals-state]] (the legacy code predates this - expect rework here, not in the layer split).
- E2E smoke for its main flows; module page `pages/modules/identity.md`; migration-status row flips.

**Exit criteria:** identity usable end-to-end on mock data; gates green; a retro updates the conventions with what the port taught us before any second module starts.

## Phase 3+ - Module waves

One module (or coherent group) per wave, order decided with the user at each checkpoint - business priority beats technical convenience. Standing sequence principles:

- Low-coupling, high-visibility candidates early (dashboards is a natural second: visible value, minimal domain logic).
- The finance group (finance/accounting/treasury/tax) enters as ONE decision: bounded-context analysis first, module count second.
- `i18n` dissolves into `shared-kernel/` when the first module needs translations, not as its own wave.
- The event-bus ADR is written when the second module needs to react to the first - reference the legacy `event-bus/` implementation then.

**Per-wave exit criteria (same every time):** gates green; E2E smoke extended; `pages/modules/<context>.md` written; migration-status updated; no new boundary-lint exemptions.

## User decision checkpoints

| When | Decision |
|---|---|
| After Phase 2 retro | Which module/wave next (and after every wave) |
| When finance's turn comes | One finance module or several |
| When mock auth becomes limiting | Un-mock auth: port the legacy `core/auth/` stack against the real identity provider |
| When real HTTP appears per port | Mock-to-real swap order, per port |
| When tracing needs to grow | Evolve two-header correlation toward the legacy OpenTelemetry setup (read `trace-context.interceptor.ts` first) |

## Explicitly out of plan

Everything in migration-status's "explicitly not migrating" list (federation, Docker, Helm, nginx gateway, container CI, the standalone cloudflare-worker project, the 20-server dev fleet) is retired, not sequenced.

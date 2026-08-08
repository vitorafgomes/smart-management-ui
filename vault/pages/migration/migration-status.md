---
title: "Migration status"
version: "1.5"
date: 2026-08-08
changes: "Landing visual fidelity restored: vanta hero canvas, app-theme mechanism, gallery assets"
page_type: roadmap
status: active
description: "Module map from the legacy micro frontends to target modules, with per area status and cross cutting porting work."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Migration status

The tracker for moving the legacy micro-frontend app into this repository's modular monolith. Source app: [[pages/migration/legacy-source-overview]]. Target shape: [[pages/decisions/0001-modular-monolith-architecture]].

**One bounded-context module is migrated.** `identity` landed in Phase 2 on mock data ([[pages/modules/identity]]); every other row in the module map below `shell` is still `not started`. The chrome moved in Phase 1: the app boots into the ported SmartAdmin layout behind a mock auth guard.

> **Phase 0 (enforcement foundation) landed on 2026-08-08.** It deliberately ports no feature: what it delivers is the tooling that makes the architecture self-enforcing before the first module is written - `angular-eslint` + `eslint-plugin-boundaries` with the layer and module rules proven to fire against deliberate violations, the `tsconfig` path mapping, the correlation interceptor and its pinning spec, a Playwright boot smoke test, and a GitHub Actions pipeline running lint, build, unit and E2E on every PR. The only cross-cutting row below that moves as a result is observability and correlation. See [[pages/roadmap/migration-plan]].

> **The public face landed on 2026-08-08.** `/` is no longer a redirect to login: an anonymous visitor gets the ported SmartAdmin **landing page** (`shell/pages/landing/`, lazy-loaded), and an authenticated one is forwarded to `/dashboard` by `publicGuard`. Signup is live as a mock: `shell/pages/register/` drives `AuthStateService.register()`, which records the account under `smart-management-auth-accounts` in `localStorage` so a duplicate email produces a real, visible failure per root Rule G - **no password is ever stored**, because mock login accepts any password anyway ([[pages/decisions/0002-mock-first-auth-and-data]]). Both auth screens now sit on the theme's gradient backdrop rather than a bare page. **Forgot-password, lock-screen and two-factor were deliberately not ported**: mock auth has no recovery, no lock and no second factor, so each screen would be a control that does nothing (root Rule C).

> **Phase 2 (first module: identity) landed on 2026-08-08.** `modules/identity/` holds the users, roles and permission-catalogue surfaces from `mfe-identity-tenant`, on in-memory mock adapters. **The legacy module's auth screens were deliberately not ported** - login, register, forgot-password, two-factor and lock-screen, plus its Keycloak auth service, all duplicate a surface `shared-kernel/auth/` and `shell/pages/login/` already own since Phase 1, so authentication stays shell-owned. The legacy entities and repositories with no screen behind them (tenants, subscriptions, tenant settings, branding, company profiles, audit logs, groups) were left behind rather than ported as dead code. Full detail, including the mock failure seam: [[pages/modules/identity]].

> **Visual fidelity pass on 2026-08-08.** The earlier judgement that the animated hero backdrop was a dependency with no consumer was wrong: it *is* the look of the reference page, and without it the port did not read as the same product. `vanta` + `three` are now dependencies, wrapped by `shell/components/background-animation/`, which both the landing hero and the auth layout mount. Both libraries are pulled in by **dynamic import** so they land in lazy chunks of their own (three ~702 kB raw / 146 kB transferred) rather than in the initial bundle, which grew by 2.25 kB raw; the effect is torn down through `DestroyRef` so the WebGL context is released with the component. The theme's gradient in `src/styles.scss` stays as the pre-init backdrop and as the fallback if either chunk fails to load. Also landed: the runtime **theme mechanism** - the `<link id="app-theme">` in `index.html` plus skin state in `LayoutStoreService`, which points it at `assets/css/<skin>.css` and leaves it href-less on `default` (upstream blanks the href instead, which makes the browser fetch the page as a stylesheet). The **picker** for it is still absent, because it lives in the `@ng-bootstrap` customizer offcanvas; the mechanism and the persisted default are in place for whatever surface exposes it. Finally, `assets/img/demo/gallery/` (118 files) was copied over - the last asset gap; `src/assets/` now matches the legacy tree exactly apart from `federation.manifest.json`, which is retired with native federation.

> **Phase 1 (shell and theming) landed on 2026-08-08.** The SmartAdmin sass, webfonts, icon sprite and imagery are in `src/assets/` and compile through `src/styles.scss`; the main and auth layouts, topbar, sidenav, menu, logo and footer are ported into `src/app/shell/` as standalone OnPush components on signals and native control flow; `shared-kernel/` gained mock auth with both guards, mock tenant storage, the global error handler and a signals-based toast service with its outlet. Everything auth- and menu-shaped is a **mock** per [[pages/decisions/0002-mock-first-auth-and-data]] - the rows below that say `done` mean the seam exists and the chrome renders against it, not that anything talks to a backend.



## How migration order gets decided

**Per module, with the user, one at a time.** There is deliberately no sequenced plan on this page. Ordering depends on business priority, on what the backend can support, and on what is learned porting the first module - none of which is knowable now, and a plan written today would be obsolete by the second module.

What *is* decided: `mfe-identity-tenant` is the strongest technical candidate to go first, because it already separates domain, application, infrastructure and presentation, so the port exercises the pattern without also being a redesign. That is a recommendation, not a commitment.

Update the status column here as each module lands, and add its own `pages/modules/<context>.md` page at that point.

## Module map

| Legacy area | Legacy project | Target module | Status |
|---|---|---|---|
| Shell layout, nav, chrome | `projects/shell` (`layouts/`, `views/`, `components/`) | `src/app/shell/` | done (chrome only) |
| Landing page | `shell/views/landing/` and its `components/` | `src/app/shell/pages/landing/` | **done** - every section but the newsletter, see below |
| Auth screens | `shell/views/auth/` | `src/app/shell/pages/{login,register}/` | **done (mock)** - login and register only; forgot-password, lock-screen and two-factor deliberately not ported |
| Identity, tenants, users, admin | `mfe-identity-tenant` | `modules/identity/` | **done (mock data)** - users, roles, permissions. See [[pages/modules/identity]] |
| Dashboards | `mfe-dashboards` | `modules/dashboards/` | not started |
| Management | `mfe-management` | `modules/management/` | not started |
| Master data | `mfe-master-data` | `modules/master-data/` | not started |
| Sales | `mfe-sales` | `modules/sales/` | not started |
| Purchasing | `mfe-purchasing` | `modules/purchasing/` | not started |
| Manufacturing | `mfe-manufacturing` | `modules/manufacturing/` | not started |
| Inventory | `mfe-inventory` | `modules/inventory/` | not started |
| Logistics | `mfe-logistics` | `modules/logistics/` | not started |
| Trade | `mfe-trade` | `modules/trade/` | not started |
| Finance | `mfe-finance` | `modules/finance/` (grouping under review) | not started |
| Accounting | `mfe-accounting` | `modules/finance/` or its own (grouping under review) | not started |
| Treasury | `mfe-treasury` | `modules/finance/` or its own (grouping under review) | not started |
| Tax | `mfe-tax` | `modules/finance/` or its own (grouping under review) | not started |
| HR | `mfe-hr` | `modules/hr/` | not started |
| CRM | `mfe-crm` | `modules/crm/` | not started |
| Settings | `mfe-settings` | `modules/settings/` | not started |
| Compliance | `mfe-compliance` | `modules/compliance/` | not started |
| i18n | `mfe-i18n` | `shared-kernel/` (likely not a module) | not started |

Two rows need a decision rather than a port:

- **The finance group.** Finance, accounting, treasury and tax were four remotes because they were four deployables, which is a deployment fact, not a domain fact. They may well be one bounded context with four screens. Decide against the "is this a bounded context" test in [[pages/conventions/modular-architecture]] before creating four modules by reflex.
- **i18n.** Translation is cross-cutting infrastructure, not a business context. It probably belongs in `shared-kernel/`, and it probably should not have been a remote. Confirm when it comes up.

Target module names above are **provisional**. The legacy project name is a starting point, not a naming decision.

## Cross-cutting to port

Shell-level concerns with no equivalent in this repo yet. These are not owned by any single module, and several are prerequisites for the first module rather than follow-ups.

| Concern | Legacy location | Target | Status |
|---|---|---|---|
| Observability and correlation | `shell/src/app/core/tracing/` (`otel-tracing.service.ts`, `trace-context.interceptor.ts`) | `shared-kernel/correlation/` per [[pages/conventions/correlation-id]] | done (interceptor + spec) |
| Auth: guards, interceptor, token refresh | `shell/src/app/core/auth/` | `shared-kernel/auth/` - **mocked first**, see [[pages/decisions/0002-mock-first-auth-and-data]] | done (mock) |
| Multi-tenancy: tenant interceptor and storage | `shell/src/app/core/auth/tenant.interceptor.ts`, `tenant-storage.service.ts` | `shared-kernel/tenant/` | done (mock storage; no interceptor yet) |
| Global error handling | `shell/src/app/core/error/global-error-handler.ts` | `shared-kernel/errors/` | done |
| Theming: SmartAdmin sass and assets | `shell/src/assets/sass/`, `css/`, `webfonts/`, `icons/` | `src/assets/` compiled through `src/styles.scss` | done |
| Layout store, dynamic menu | `shell/src/app/core/services/layout-store.service.ts`, `dynamic-menu.service.ts` | `shell/` | done (menu mocked) |
| Notifications and toasts | `shell/src/app/core/services/notification.service.ts`, `toast.service.ts` | `shared-kernel/toasts/` | toasts done; notifications not started (need a backend) |
| Cross-module events | `shell/src/app/infrastructure/event-bus/`, `core/services/domain-event.service.ts` | **deferred** - see below | not started |

### The event bus is deferred, not forgotten

The legacy app has a working event bus, and [[pages/decisions/0001-modular-monolith-architecture]] deliberately does not port it yet: per root Rule C, an abstraction with zero consumers is a liability. It gets designed as its own ADR when a **second** module genuinely needs to react to something in the first.

The legacy implementation is the reference to read at that point - it already encodes which cross-module conversations actually happen in this product, which is exactly the information a fresh design would be guessing at.

### Tracing note

The legacy app uses real OpenTelemetry with an OTLP/HTTP exporter, which is **further along** than the two-header design this repo starts from. The correlation-id convention is a deliberate first step with a documented path to `traceparent` and OpenTelemetry; porting the legacy tracing service may turn out to be the way that path is walked, rather than a separate migration. Read `trace-context.interceptor.ts` before finalising.

## Explicitly not migrating

Retired with the architecture, not pending. Do not port these, and do not treat their absence as a gap:

- **Native federation** - `federation.config.js` in all twenty projects, `tsconfig.federation.json`, the `strictVersion` singleton sharing block, `@angular-architects/native-federation`, `@softarc/native-federation-node`. Modules become bounded contexts inside one app; boundaries are enforced by lint instead of by network isolation.
- **Docker** - root `Dockerfile`, `.dockerignore`, `docker-compose.yml`, and `docker/` (`Dockerfile.ci`, `Dockerfile.gateway`, `entrypoint.sh`, `gateway.conf`, `nginx.conf`).
- **Helm and Kubernetes** - `helm/deploy.sh`, `values-shell.yaml`, `values-mfe.yaml`, `values-gateway.yaml`.
- **The nginx gateway** - it existed to front independently deployed remotes. One app needs no gateway.
- **Container CI workflows** - `docker-build-local.yml` and the container stages of `ci.yml`.
- **The standalone `cloudflare-worker/` project** - the new repo serves static assets directly from `wrangler.jsonc`; no separate worker project.
- **The twenty-project dev-server fleet** - `start:all`, and the per-remote `start:*` and `build:*` scripts. One `ng serve`.

Deployment is exclusively Cloudflare Workers static assets: [[pages/conventions/deployment]].

## Explicitly deferred

Not retired, just not now:

- **Backend integration.** All data and all auth are mocked in this phase - [[pages/decisions/0002-mock-first-auth-and-data]]. Swapping a mock for a real adapter is a DI binding change per port, tracked **per port** as each module lands, not as one cutover. First three ports on the board, all still mocked: `identity/UserRepository`, `identity/RoleRepository`, `identity/PermissionRepository` ([[pages/modules/identity]]).
- **The cross-module event bus**, as above.
- **Real identity provider wiring.** The legacy `core/auth/` stack is the reference implementation to port when mock auth is replaced. Phase 1 ported its *shape* only: `AuthStateService`, `authGuard` and `publicGuard` exist, `auth.interceptor.ts`, `tenant.interceptor.ts`, `token-refresh.service.ts` and `auth-event-listener.service.ts` do not, because there is no token to attach or refresh.
- **The landing sections that had nothing behind them.** The legacy newsletter band is a form with no endpoint, and its "Start free trial" / "Contact sales" buttons pointed at `[routerLink]="[]"`. The newsletter section was dropped and the final call to action was repointed at `/auth/register` and `/auth/login`, so every control on the public page does something real. The legacy five-column link footer went the same way: twenty dead links replaced by the four destinations that exist. The typed.js headline animation stays out for the same reason - a rotating strapline is copy, not a control, and the hero says one thing instead.
- **The shell chrome the mock cannot support.** Deliberately not ported from `layouts/`: the theme customizer and the offcanvas drawer (`@ng-bootstrap`), the notification dropdown and virtual assistant (both need a backend), and the simplebar custom scrollbar. Each is a dependency with no consumer today, per root Rule C. The theme-switching *mechanism* is now live even though its picker is not - see the visual fidelity note above.

## Related

- Legacy app facts: [[pages/migration/legacy-source-overview]]
- Target architecture: [[pages/decisions/0001-modular-monolith-architecture]]
- Mock-first phase: [[pages/decisions/0002-mock-first-auth-and-data]]
- Module structure to port into: [[pages/conventions/modular-architecture]]
- Deployment: [[pages/conventions/deployment]]

---
title: "Migration status"
version: "1.0"
date: 2026-08-07
changes: "Initial module map with everything not started"
page_type: roadmap
status: active
description: "Module map from the legacy micro frontends to target modules, with per area status and cross cutting porting work."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Migration status

The tracker for moving the legacy micro-frontend app into this repository's modular monolith. Source app: [[pages/migration/legacy-source-overview]]. Target shape: [[pages/decisions/0001-modular-monolith-architecture]].

**Nothing is migrated. Every row below is `not started`, and that is accurate rather than pessimistic** - this repo holds the plain Angular 22 scaffold.

## How migration order gets decided

**Per module, with the user, one at a time.** There is deliberately no sequenced plan on this page. Ordering depends on business priority, on what the backend can support, and on what is learned porting the first module - none of which is knowable now, and a plan written today would be obsolete by the second module.

What *is* decided: `mfe-identity-tenant` is the strongest technical candidate to go first, because it already separates domain, application, infrastructure and presentation, so the port exercises the pattern without also being a redesign. That is a recommendation, not a commitment.

Update the status column here as each module lands, and add its own `pages/modules/<context>.md` page at that point.

## Module map

| Legacy area | Legacy project | Target module | Status |
|---|---|---|---|
| Shell layout, nav, chrome | `projects/shell` (`layouts/`, `views/`, `components/`) | `src/app/shell/` | not started |
| Identity, tenants, users, admin | `mfe-identity-tenant` | `modules/identity/` | not started |
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
| Observability and correlation | `shell/src/app/core/tracing/` (`otel-tracing.service.ts`, `trace-context.interceptor.ts`) | `shared-kernel/http/` per [[pages/conventions/correlation-id]] | not started |
| Auth: guards, interceptor, token refresh | `shell/src/app/core/auth/` | `shared-kernel/` - **mocked first**, see [[pages/decisions/0002-mock-first-auth-and-data]] | not started |
| Multi-tenancy: tenant interceptor and storage | `shell/src/app/core/auth/tenant.interceptor.ts`, `tenant-storage.service.ts` | `shared-kernel/` | not started |
| Global error handling | `shell/src/app/core/error/global-error-handler.ts` | `shared-kernel/errors/` | not started |
| Theming: SmartAdmin sass and assets | `shell/src/assets/sass/`, `css/`, `webfonts/`, `icons/` | global styles plus `shared-kernel/ui/` | not started |
| Layout store, dynamic menu | `shell/src/app/core/services/layout-store.service.ts`, `dynamic-menu.service.ts` | `shell/` | not started |
| Notifications and toasts | `shell/src/app/core/services/notification.service.ts`, `toast.service.ts` | `shared-kernel/` | not started |
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

- **Backend integration.** All data and all auth are mocked in this phase - [[pages/decisions/0002-mock-first-auth-and-data]]. Swapping a mock for a real adapter is a DI binding change per port, tracked **per port** as each module lands, not as one cutover.
- **The cross-module event bus**, as above.
- **Real identity provider wiring.** The legacy `core/auth/` stack is the reference implementation to port when mock auth is replaced.

## Related

- Legacy app facts: [[pages/migration/legacy-source-overview]]
- Target architecture: [[pages/decisions/0001-modular-monolith-architecture]]
- Mock-first phase: [[pages/decisions/0002-mock-first-auth-and-data]]
- Module structure to port into: [[pages/conventions/modular-architecture]]
- Deployment: [[pages/conventions/deployment]]

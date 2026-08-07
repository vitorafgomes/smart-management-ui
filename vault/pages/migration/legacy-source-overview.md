---
title: "Legacy SmartAdmin UI source overview"
version: "1.0"
date: 2026-08-07
changes: "Initial factual survey of the legacy micro frontend app"
page_type: survey
status: active
description: "First pass factual overview of the production Angular 21 micro frontend app that this repo is migrating from."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Legacy SmartAdmin UI source overview

The production app this repository is migrating **from**. It lives at:

```
/home/vitorafgomes/WorkSpace/Dev/Smart.Management/smart-management-ui
```

**That repository is read-only for us.** Inspect it freely; never modify it. It is the running production system, and this repo is the migration target - see [[pages/migration/migration-status]] for what moves where and [[pages/decisions/0001-modular-monolith-architecture]] for the shape it moves into.

Everything below was verified by reading the legacy repo on 2026-08-07. Paths are given without line numbers, since the code will change independently of this page.

## What it is

An **Angular 21 workspace** running a micro-frontend architecture on `@angular-architects/native-federation` (`^21.0.4`, with `@softarc/native-federation-node`). One shell composes nineteen independently built and independently deployable remotes at runtime.

The package manager is **bun** (`bun.lock` at the root; `package.json` declares no `packageManager` field). Contrast with this repo, which is npm.

The workspace root also carries `MFE-ARCHITECTURE.md`, the legacy architecture write-up. Read it for the original intent behind the federation setup.

## Workspace layout

`angular.json` declares twenty projects: `shell` plus nineteen remotes.

```
projects/
  shell/                  the host: layout, nav, auth, tracing, routing to remotes
  mfe-identity-tenant/    auth, tenants, users, admin
  mfe-dashboards/         mfe-management/     mfe-master-data/
  mfe-sales/              mfe-purchasing/     mfe-manufacturing/
  mfe-inventory/          mfe-logistics/      mfe-trade/
  mfe-finance/            mfe-accounting/     mfe-treasury/
  mfe-tax/                mfe-hr/             mfe-crm/
  mfe-settings/           mfe-i18n/           mfe-compliance/
```

Each project has its own `federation.config.js`, `tsconfig.app.json` and `tsconfig.federation.json`. In development each runs on its own port - `shell` on 4200, `mfe-identity-tenant` on 4201 (`bun run start:auth`), and so on up to 4219 - with `start:all` running the whole set concurrently.

### The shell

`projects/shell/src/app/` contains:

| Folder | Contents |
|---|---|
| `core/auth/` | `auth.guard.ts`, `public.guard.ts`, `auth.interceptor.ts`, `auth-state.service.ts`, `token-refresh.service.ts`, `tenant.interceptor.ts`, `tenant-storage.service.ts`, `auth-event-listener.service.ts` |
| `core/tracing/` | `otel-tracing.service.ts`, `trace-context.interceptor.ts` |
| `core/error/` | `global-error-handler.ts` |
| `core/services/` | `domain-event.service.ts`, `layout-store.service.ts`, `notification.service.ts`, `toast.service.ts`, `dynamic-menu.service.ts` |
| `infrastructure/` | `event-bus/`, `cloudflare/` |
| `layouts/` | `main-layout/`, `auth-layout/`, `content-with-right-penal/`, `components/` |
| `views/` | `auth/`, `landing/`, `user-profile/`, `error/`, `blank-page/` |
| Also | `pages/`, `components/`, `shared-kernel/`, `types/`, `constants/`, `utils/`, `helpers/` |

`projects/shell/src/assets/` holds the SmartAdmin template payload: `sass/`, `css/`, `webfonts/`, `icons/`, `img/`.

Two things in the shell are worth flagging early because they are the cross-cutting concerns that must be ported rather than rewritten per module: the **auth stack** in `core/auth/` (guards, interceptors, token refresh, and a tenant dimension carried in its own interceptor and storage service), and the **tracing stack** in `core/tracing/`.

### mfe-identity-tenant

The most structurally relevant remote, because **it is already layered along the lines this repo is adopting**:

```
projects/mfe-identity-tenant/src/app/
  domain/          entities/, repositories/     <- ports already separated
  application/     use-cases/
  infrastructure/  repositories/                <- adapters implementing the ports
  presentation/    auth/, admin/, landing/, shared/
  shared-kernel/   interfaces/, enums/
  components/
```

That maps almost one-to-one onto the target `domain / application / infrastructure / ui` structure in [[pages/conventions/modular-architecture]], with `presentation/` playing the role this repo calls `ui/`. It is the natural first migration candidate: the layer separation work is largely already done, so the port is mostly mechanical rather than a redesign.

Whether the other eighteen remotes follow the same internal convention has **not** been verified - only `mfe-identity-tenant` was inspected in depth. Check each before assuming.

## Stack

| Concern | Package |
|---|---|
| Micro-frontends | `@angular-architects/native-federation` `^21.0.4`, `@softarc/native-federation-node` |
| UI toolkit | `bootstrap` `^5.3.7`, `@ng-bootstrap/ng-bootstrap` `^19.0.1` |
| Template | SmartAdmin, as sass and asset payload under `projects/shell/src/assets/` |
| Charts | `apexcharts` `^5.3.3`, `ng-apexcharts` `^2.0.0` |
| Calendar | `@fullcalendar/*` `^6.1.19` (angular, core, daygrid, timegrid, list, interaction) |
| Toasts | `ngx-toastr` `^19.0.0` |
| Misc UI | `ngx-typed-js` |
| Tracing | `@opentelemetry/*` - `sdk-trace-web`, `sdk-trace-base`, `exporter-trace-otlp-http`, `instrumentation-fetch`, `instrumentation-xml-http-request`, `instrumentation-document-load`, `context-zone-peer-dep`, `resources`, `semantic-conventions`, `api` |

The OpenTelemetry setup is real browser tracing with an OTLP/HTTP exporter and automatic fetch/XHR/document-load instrumentation - not a hand-rolled header scheme. This matters for [[pages/conventions/correlation-id]]: the legacy app is already further along the tracing path than the two-header design this repo starts from, and `trace-context.interceptor.ts` is the piece to read before finalising that evolution.

### Federation sharing

`projects/shell/federation.config.js` shares the Angular packages plus `rxjs` and `tslib` as `singleton: true, strictVersion: true, requiredVersion: 'auto'`, and additionally shares `bootstrap` and `@ng-bootstrap/ng-bootstrap` as singletons. It skips `rxjs/ajax`, `rxjs/fetch`, `rxjs/testing` and `rxjs/webSocket`.

That `strictVersion` singleton block is the version-skew machinery the modular monolith removes outright: with one application there is one dependency graph and nothing to negotiate at runtime.

## Build and deployment

- **Shell build:** `ng build shell --configuration production` (npm script `build`), output `dist/shell`. Each remote has its own `build:<name>` script producing `dist/<project>`, with `build:all` chaining all twenty.
- **Tests:** `ng test shell`, plus `test:auth`, `test:dashboards`, `test:management`. Only four of the twenty projects have a test script.
- **Formatting:** Prettier over `projects/**/*.{ts,html,scss}`.

The deployment surface is substantial and is **deliberately not being ported** (see [[pages/conventions/deployment]]):

- `Dockerfile`, `.dockerignore`, `docker-compose.yml` at the root
- `docker/` - `Dockerfile.ci`, `Dockerfile.gateway`, `entrypoint.sh`, `gateway.conf`, `nginx.conf`
- `helm/` - `deploy.sh`, `values-shell.yaml`, `values-mfe.yaml`, `values-gateway.yaml`
- `cloudflare-worker/` - a separate worker project with its own `wrangler.toml`, `package.json` and `bun.lock`
- `.github/workflows/` - `ci.yml`, `cloudflare-worker.yml`, `docker-build-local.yml`, `discord-release.yml`, `grafana-alert-issue.yml`, `auto-issue-on-failure.yml`, `pr-labeler.yml`, `stale.yml`

An nginx gateway fronting independently deployed remotes, Helm values split three ways, and a CI pipeline sized to match are all direct costs of the federated topology. The new repo replaces the whole of it with one `wrangler.jsonc` and Workers Builds.

## What this means for the migration

Three observations to carry forward:

1. **The layering is not a new idea here.** `mfe-identity-tenant` already separates domain, application, infrastructure and presentation. The migration formalises and enforces a pattern the team has already reached for, rather than imposing an unfamiliar one.
2. **The cross-cutting code is the real work.** Auth (guards, interceptors, token refresh, tenancy) and tracing are shell-level concerns with no equivalent in this repo yet. They are tracked as porting items in [[pages/migration/migration-status]], and auth specifically is mocked for now per [[pages/decisions/0002-mock-first-auth-and-data]].
3. **Nineteen remotes will not map to nineteen modules.** Several are plausibly one bounded context - the finance group (finance, accounting, treasury, tax) is the obvious candidate. Module granularity is decided per migration, against the "is this a bounded context" test in [[pages/conventions/modular-architecture]], not by copying the project list.

## Related

- Target architecture: [[pages/decisions/0001-modular-monolith-architecture]]
- Module map and status: [[pages/migration/migration-status]]
- Mock-first phase: [[pages/decisions/0002-mock-first-auth-and-data]]
- Deployment replacement: [[pages/conventions/deployment]]
- Tracing evolution path: [[pages/conventions/correlation-id]]

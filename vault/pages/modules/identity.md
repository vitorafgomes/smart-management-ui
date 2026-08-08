---
title: "Identity module"
version: "1.0"
date: 2026-08-08
changes: "Initial page: Phase 2 port of mfe-identity-tenant, mock data"
page_type: service
status: active
description: "The bounded context that manages users, roles and the permission catalogue for a tenant, running entirely on in-memory mock adapters."
source:
  - chat
  - "legacy: projects/mfe-identity-tenant"
reliability: high
updated: 2026-08-08
---

# Identity module

> Manages **users, roles and the permission catalogue** for a tenant. Ported from the legacy `mfe-identity-tenant` micro-frontend in Phase 2 ([[pages/roadmap/migration-plan]]); the first module to inhabit [[pages/conventions/modular-architecture]].

Lives at `src/app/modules/identity/`. Every port is mocked ([[pages/decisions/0002-mock-first-auth-and-data]]) - no HTTP call leaves this module.

## Responsibility

**Owns:** the user directory, the role catalogue and the permission catalogue, plus the assignments between them (a user's roles, a role's permission codes).

**Does not own:**

- **Authentication and the session.** The shell owns those. `shared-kernel/auth/` holds the mock `AuthStateService`, `authGuard` and `publicGuard`, and `shell/pages/login/` is the login screen. The legacy module carried its own `presentation/auth/` screens (login, register, forgot password, two-factor, lock screen) and a `keycloak-auth-api.service.ts`; **none of it was ported**, because the shell already covered that surface in Phase 1. Duplicating it would have given the app two login screens.
- **Tenant records, subscriptions, branding, company profiles, tenant settings, audit logs and groups.** The legacy module declared entities and repositories for all of these, but shipped **no screen** for any of them - see "What was deliberately left behind".
- **The landing page.** Legacy `presentation/landing/` is marketing, not back-office. Retired.

## Public contract

`index.ts` exports exactly one symbol:

- **`identityRoutes: Routes`** - the lazy route table, with the port-to-adapter bindings attached as route providers.

Nothing else is public. The facades, the entities, the ports and the components are all internal; the shell has no reason to name any of them, and [[pages/invariants/module-boundaries]] means it cannot.

Mounted by the shell at `src/app/app.routes.ts` under the authenticated `MainLayout`:

```ts
{ path: 'identity', loadChildren: () => import('@modules/identity').then((m) => m.identityRoutes) }
```

Reached from the sidenav via the three entries in `src/app/shell/menu-data.ts`, which replaced the Phase 1 disabled placeholder.

### Screens

| Route | Screen |
|---|---|
| `/identity/users` | User listing: search, paging, delete confirmation |
| `/identity/users/new`, `/identity/users/:id` | User form, including the role picker |
| `/identity/roles` | Role listing |
| `/identity/roles/new`, `/identity/roles/:id` | Role form, including the permission picker grouped by module |
| `/identity/permissions` | Permission catalogue: search plus a module filter |
| `/identity/permissions/new`, `/identity/permissions/:id` | Permission form |

`/identity` redirects to `/identity/users`.

## Ports and their mock adapters

Three ports, declared in `domain/` as plain interfaces, implemented in `infrastructure/`, bound in `index.ts`. Ports are **promise-based, not `Observable`-based** - `domain/` may not import RxJS ([[pages/invariants/domain-layer-purity]]), and a single-value request is what a promise is for. This is the one shape change the legacy ports could not survive.

| Port | `domain/` | Mock adapter | Real adapter |
|---|---|---|---|
| `UserRepository` | `domain/user-repository.ts` | `infrastructure/in-memory-user-repository.ts` | not started |
| `RoleRepository` | `domain/role-repository.ts` | `infrastructure/in-memory-role-repository.ts` | not started |
| `PermissionRepository` | `domain/permission-repository.ts` | `infrastructure/in-memory-permission-repository.ts` | not started |

**The DI tokens live in `application/identity-ports.ts`, not beside the interfaces.** An `InjectionToken` is an Angular value and `domain/` imports no framework, so the contract and the handle DI resolves it by had to be separated. See the note in [[pages/conventions/modular-architecture]].

Going live is three `useClass` lines in `index.ts`. `domain/`, `application/` and `ui/` never name an adapter, which is the property ADR 0002 exists to prove.

### The mock seams

`infrastructure/identity-mock-config.ts` is the mock-only control surface, read from `localStorage` so both a spec and a Playwright test can set it before the app boots:

- **`identity-mock-latency`** - milliseconds every mock call takes. Defaults to **150 ms**, deliberately: a mock that returns instantly hides missing loading states, which is the failure mode ADR 0002 warns about. Specs set `0`.
- **`identity-mock-failure`** - comma-separated port names (`users`, `roles`, `permissions`) that reject with an `IdentityError`. **This is the only way to reach an error state while every port is a mock**, and it is what makes root Rule G verifiable rather than merely asserted in review.

Seed data is in `infrastructure/identity-seed.ts`: 14 users, 5 roles, 15 permissions. Fourteen users is more than one page, so paging is exercised by opening the screen rather than only in a spec. State lives for the injector's lifetime, which is the route - leaving the module and returning restores the seed, because persistence is the backend's job.

## Domain rules

Real logic, tested without a test bed:

- `domain/user.ts` - `fullName`, `matchesUser` (the search predicate: username, email or full name), `isUserNameTaken` (case-insensitive, excluding the record being edited).
- `domain/role.ts` - `canDeleteRole` (**the default role cannot be deleted**, since new users fall back to it), `applyDefaultRole` (**exactly one role is the default**; promoting one demotes the incumbent), `matchesRole`.
- `domain/permission.ts` - `PERMISSION_CODE_PATTERN` and `isValidPermissionCode` (screaming snake case, e.g. `USER_READ`), `PERMISSION_MODULES` (the module list the legacy form hardcoded in a component), `isPermissionModule`.
- `domain/paged-result.ts` - `pageOf`, which slices a filtered collection. A page past the end returns **no entries rather than clamping**: silently moving the user to another page hides a paging bug.
- `domain/identity-error.ts` - `IdentityError` with a `kind` of `not-found | conflict | validation | unavailable`, and `toUserMessage`, the single place a caught `unknown` becomes something renderable.

The typed error is a deliberate departure from the legacy screens, which each dug through `err?.error?.detail ?? err?.message ?? '...'` at the call site.

## Facades

`application/` holds three facades - `UsersFacade`, `RolesFacade`, `PermissionsFacade` - provided at the module's layout route so their state dies with the module. Each follows [[pages/conventions/signals-state]]: private writable signals, public `asReadonly()`/`computed()`, and loading, error, empty and data as four distinguishable states.

They **replace** the legacy `application/use-cases/`, which was one injectable class per verb (`CreateUserUseCase`, `GetUserUseCase`, …) wrapping a single repository call and holding no state - state lived in the components. This was the expected rework; see [[pages/roadmap/migration-plan]] Phase 2.

## Invariants

- [[pages/invariants/module-boundaries]] - the shell imports `@modules/identity` and gets `identityRoutes`, nothing else.
- [[pages/invariants/layer-dependencies-one-way]] - `ui` never names an adapter; the port-to-adapter binding sits in `index.ts`, the module's composition root.
- [[pages/invariants/domain-layer-purity]] - this is why the ports are promise-based and why the DI tokens sit in `application/`.
- [[pages/invariants/state-is-signals-first]] - no `BehaviorSubject`; RxJS appears once, for debounced search input, bridged with `takeUntilDestroyed()`.
- [[pages/invariants/every-http-request-carries-correlation-id]] - **vacuously satisfied**: the module issues no HTTP.

## Testing footprint

- **Domain:** `domain/*.spec.ts` - plain function specs, no test bed.
- **Application:** `application/*-facade.spec.ts` - the loading-to-data and loading-to-error transitions for all three facades, mocking the **port**, never a transport.
- **Infrastructure:** `infrastructure/in-memory-user-repository.spec.ts` - paging, search, the username conflict, not-found, and the failure seam.
- **UI:** `ui/users-page/users-page.spec.ts` - rows render, the error state renders with a retry, empty is distinct from failed, and delete asks before it calls the port.
- **E2E:** `e2e/identity.spec.ts` - menu navigation, the seeded listing, create and edit end to end, the duplicate-username rejection, and the forced-failure error state on two screens.

## Known gaps and deferred work

- **No adapter speaks HTTP.** Tracked per port in [[pages/migration/migration-status]].
- **The user-roles and role-permissions association panels are folded into the forms.** Legacy had expandable inline panels issuing their own HTTP calls (`user-roles-panel.ts` bypassed its repository and injected `HttpClient` directly). Since `User.roleIds` and `Role.permissionCodes` already carry the associations, the pickers live on the forms and no fourth port was created. If the real API models assignments as their own resource, this becomes a port.
- **`resync`** on the legacy user repository (`POST /users/:id/resync`, an identity-provider sync) has no meaning without a provider and was not ported.
- **Multi-tenancy is cosmetic.** Every seeded record carries `tenantId: 'smart-management'` and nothing filters on it, because mock auth has no tenant claim.

### What was deliberately left behind

The legacy module declared entities *and* repositories for `Tenant`, `Subscription`, `TenantSettings`, `Branding`, `CompanyProfile`, `AuditLog` and `Group` - roughly two thirds of its `domain/` - but its admin routes only ever mounted **users, roles and permissions**. Porting the rest would have created dead domain code with no screen and no consumer, against root Rule C. The legacy definitions remain readable at `projects/mfe-identity-tenant/src/app/domain/` when a screen for them is actually wanted; that is a scope decision for a later wave, not a gap in this port.

## Related

- Phase plan and exit criteria: [[pages/roadmap/migration-plan]]
- Module map and per-port status: [[pages/migration/migration-status]]
- Structure this module instantiates: [[pages/conventions/modular-architecture]]
- Facade shape: [[pages/conventions/signals-state]]
- Why every adapter is a mock: [[pages/decisions/0002-mock-first-auth-and-data]]
- Spec expectations: [[pages/conventions/testing]]

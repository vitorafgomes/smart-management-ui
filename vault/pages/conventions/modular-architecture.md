---
title: "Modular architecture convention"
version: "1.1"
date: 2026-08-07
changes: "Added extractability rationale for the boundary rules"
page_type: convention
status: active
description: "Folder layout, layer dependency rules, import examples, and the checklist for adding a bounded-context module."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Modular architecture convention

The mechanical companion to [[pages/decisions/0001-modular-monolith-architecture]]. That page says *why*; this one says *where files go and what may import what*.

**Status: target, not current state.** The repository holds the plain Angular 22 scaffold; `src/app/modules/` does not exist yet. Follow this page when writing the first module - which will be a port from the legacy micro-frontend app, see [[pages/migration/migration-status]].

> **The rules here exist to keep modules extractable.** We consolidated nineteen micro-frontends into one app, and a module may need to be split back out one day. A module that only talks to the rest of the app through its `index.ts` can be lifted out by moving a folder; one that others reach into cannot. When a boundary rule feels like ceremony, the question to ask is not "is this import tidy" but "would this import still be here when someone tries to extract this module".

## Folder tree

```
src/app/
  shell/
    app.routes.ts              top-level routes, lazy-loads each module
    layout/                    application chrome: shell, nav, header
    app.config.ts              bootstrap providers
  shared-kernel/
    http/
      correlation.interceptor.ts
    errors/
      global-error-handler.ts
    ui/                        primitives used by 2+ modules
    types/
  modules/
    administration/
      domain/
        user.ts                models and value objects, pure TS
        user-repository.ts     PORT: the interface, not the implementation
      application/
        user-facade.ts         signals state + use-case methods
      infrastructure/
        http-user-repository.ts  implements the domain port
      ui/
        user-list/
          user-list.ts
          user-list.html
          user-list.scss
        administration.routes.ts
      index.ts                 the ONLY public API
```

One bounded context per folder under `modules/`. Not one per screen: `administration` is a context, `user-list` is a screen inside it.

## Layer dependency table

| Layer | May import | May never import |
|---|---|---|
| `ui` | own `application`, own `domain`, `shared-kernel`, other modules via `index.ts` | own `infrastructure`, any other module's internals |
| `application` | own `domain`, `shared-kernel` | own `ui`, `infrastructure` implementations (it depends on the port, receives the adapter via DI) |
| `infrastructure` | own `domain`, `shared-kernel`, Angular HTTP | own `ui`, own `application` |
| `domain` | nothing | everything: Angular, RxJS, `HttpClient`, other layers, other modules |
| `shared-kernel` | Angular, RxJS | anything under `modules/` |
| `shell` | every module's `index.ts`, `shared-kernel` | any module's internals |

The two rules behind the table: dependencies run **ui to application to domain**, and `infrastructure` **implements** what `domain` declares. See [[pages/invariants/layer-dependencies-one-way]] and [[pages/invariants/domain-layer-purity]].

### How the inversion works in practice

`domain/user-repository.ts` declares the interface. `infrastructure/http-user-repository.ts` implements it. `application/user-facade.ts` injects the interface through an `InjectionToken`, and the module's route providers bind token to implementation. The facade never names the HTTP class, which is what makes it testable against a fake - see [[pages/conventions/testing]].

## Imports: right and wrong

**Right - cross-module through the public API:**

```ts
import { UserSummary, provideAdministration } from '@modules/administration';
```

**Wrong - reaching into another module's internals:**

```ts
import { UserFacade } from '@modules/administration/application/user-facade';
import { UserFacade } from '../../administration/application/user-facade';
```

Both wrong forms bypass the boundary. The first looks legitimate because it uses the alias; it is not. The second also violates root Rule F on deep relative paths.

**Right - inside a module, relative paths between layers:**

```ts
// modules/administration/application/user-facade.ts
import { USER_REPOSITORY } from '../domain/user-repository';
```

**Right - anyone may use the shared kernel:**

```ts
import { CorrelationInterceptor } from '@shared-kernel/http/correlation.interceptor';
```

## tsconfig paths

`@modules/*` must map **only to each module's `index.ts`**, so a deep path fails to resolve at compile time rather than being caught later in review:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@modules/administration": ["src/app/modules/administration/index.ts"],
      "@shared-kernel/*": ["src/app/shared-kernel/*"]
    }
  }
}
```

Note the shape: one explicit entry per module, not a wildcard `"@modules/*": ["src/app/modules/*"]`. A wildcard would happily resolve `@modules/administration/application/user-facade` and hand the boundary back to code review. Adding a module means adding a line here.

## Checklist: adding a new module

1. **Confirm it is a bounded context**, not a screen. If it shares its core nouns with an existing module, it belongs inside that module.
2. Create `src/app/modules/<context>/` with `domain/`, `application/`, `infrastructure/`, `ui/`.
3. Write `domain/` first: models and the port interfaces. Pure TypeScript, no framework imports.
4. Write `application/` facades against the ports, state as signals per [[pages/conventions/signals-state]].
5. Write `infrastructure/` adapters implementing the ports. Typed responses; failures handled at this boundary per root Rule G. No hand-added correlation headers - the interceptor owns those, see [[pages/conventions/correlation-id]].
6. Write `ui/` as standalone `OnPush` components plus the module's lazy route table, following [[pages/conventions/angular-best-practices]].
7. Write `index.ts` exporting **only** what the outside genuinely needs: public types, the route provider, the DI providers. If a symbol is exported "just in case", delete it.
8. Add the module's `paths` entry in `tsconfig.json` (exact path to `index.ts`).
9. Lazy-load it from `shell/app.routes.ts`.
10. Register the module's element types in the eslint boundaries config once that config exists.
11. Specs per [[pages/conventions/testing]]: domain functions, facade state transitions, component behaviour with logic.

## Enforcement (planned)

- **`eslint-plugin-boundaries`** with one element type per layer and an explicit allow-list, making the dependency table above executable. Lands with the first implementation PR.
- **tsconfig `paths`** shaped as above, so deep cross-module imports fail to compile.
- **`smart-reviewer`** for what lint cannot judge: whether a new folder is really a bounded context, and whether `index.ts` is exporting more than it should.

## Related

- Decision and rationale: [[pages/decisions/0001-modular-monolith-architecture]]
- Boundary invariant: [[pages/invariants/module-boundaries]]
- Layer invariants: [[pages/invariants/layer-dependencies-one-way]], [[pages/invariants/domain-layer-purity]]
- Angular idioms inside `ui/`: [[pages/conventions/angular-best-practices]]

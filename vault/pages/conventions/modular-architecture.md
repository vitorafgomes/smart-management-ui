---
title: "Modular architecture convention"
version: "1.3"
date: 2026-08-08
changes: "Phase 2 retro: ports are promise-based, InjectionToken lives in application/, route table splits between ui/*.routes.ts and index.ts"
page_type: convention
status: active
description: "Folder layout, layer dependency rules, import examples, and the checklist for adding a bounded-context module."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Modular architecture convention

The mechanical companion to [[pages/decisions/0001-modular-monolith-architecture]]. That page says *why*; this one says *where files go and what may import what*.

**Status: enforced, but not yet inhabited.** `src/app/modules/` does not exist yet - the repository is still the plain Angular 22 scaffold. What *does* exist since Phase 0 is the tooling that enforces this page: the lint rules and the `tsconfig` mapping are already configured and were proven to reject deliberate violations, so the first module is governed from its first commit. Follow this page when writing it - it will be a port from the legacy micro-frontend app, see [[pages/migration/migration-status]].

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

Three things about that arrangement that are easy to get wrong:

- **Ports are promise-based.** `domain/` imports no RxJS - a single-value request is exactly what a `Promise` is for, and an `Observable`-typed port cannot compile in this layer at all. If a port method needs to return a stream, it does not belong in `domain/`.
- **The `InjectionToken` lives in `application/`, not `domain/`.** It is an Angular value, so it cannot sit beside the interface it resolves without pulling Angular into `domain/`. The interface in `domain/` is the contract; the token in `application/` is only the DI handle for that contract - see `modules/identity/application/identity-ports.ts` for the shape.
- **The route table splits in two.** `ui/<context>.routes.ts` holds the screen routes and the facade providers. The port-to-adapter bindings live in `index.ts`, which wraps those routes in a parent route carrying the adapter providers - `ui` may not name an adapter, and the lint config enforces that directly.

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

`@modules/*` must map **only to each module's `index.ts`**, so a deep path fails to resolve at compile time rather than being caught later in review. The live shape (`tsconfig.json:16-19`):

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["./src/app/modules/*/index.ts"],
      "@shared-kernel/*": ["./src/app/shared-kernel/*"]
    }
  }
}
```

The wildcard sits **before** `/index.ts`, and that placement is the whole point. `"@modules/*": ["src/app/modules/*"]` would happily resolve `@modules/administration/application/user-facade` and hand the boundary back to code review; this form resolves that same import to `src/app/modules/administration/application/user-facade/index.ts`, which does not exist, so it fails to compile. It buys the same guarantee as one explicit entry per module without a line of maintenance per module.

Compile failure is not the only guard, because a `tsconfig` that fails to resolve produces a confusing error rather than an instructive one. `eslint.config.js:163-174` rejects the same import with a message naming the rule.

## Checklist: adding a new module

1. **Confirm it is a bounded context**, not a screen. If it shares its core nouns with an existing module, it belongs inside that module.
2. Create `src/app/modules/<context>/` with `domain/`, `application/`, `infrastructure/`, `ui/`.
3. Write `domain/` first: models and the port interfaces. Pure TypeScript, no framework imports.
4. Write `application/` facades against the ports, state as signals per [[pages/conventions/signals-state]].
5. Write `infrastructure/` adapters implementing the ports. Typed responses; failures handled at this boundary per root Rule G. No hand-added correlation headers - the interceptor owns those, see [[pages/conventions/correlation-id]].
6. Write `ui/` as standalone `OnPush` components plus `ui/<context>.routes.ts` holding the screen routes and the facade providers, following [[pages/conventions/angular-best-practices]].
7. Write `index.ts` exporting **only** what the outside genuinely needs: public types, and the route provider - which wraps `ui/<context>.routes.ts` in a parent route carrying the port-to-adapter DI bindings. If a symbol is exported "just in case", delete it.
8. Nothing to add in `tsconfig.json` - the `@modules/*` mapping already covers a new folder.
9. Lazy-load it from `shell/app.routes.ts`.
10. Nothing to add in `eslint.config.js` either - the element patterns are `modules/*/<layer>`, so a new module is governed as soon as its folders exist. Both of these were per-module chores in earlier drafts of this page; Phase 0 removed them deliberately, because a boundary that needs registering is a boundary somebody eventually forgets to register.
11. Specs per [[pages/conventions/testing]]: domain functions, facade state transitions, component behaviour with logic.

## Enforcement

Live since Phase 0 (2026-08-08):

- **`eslint-plugin-boundaries`** with one element type per layer (`eslint.config.js:15-31`) and an explicit allow-list per type (`eslint.config.js:40-118`), making the dependency table above executable. `default: 'disallow'` means an unlisted combination is rejected, not permitted.
- **A regex ban on deep alias imports** (`eslint.config.js:163-174`), because an unresolvable alias looks like an external package to the boundaries graph and would otherwise pass.
- **tsconfig `paths`** shaped as above, so deep cross-module imports also fail to compile.
- **`smart-reviewer`** for what lint cannot judge: whether a new folder is really a bounded context, and whether `index.ts` is exporting more than it should.

`npm run lint` is a mandatory gate and runs on every PR (`.github/workflows/ci.yml:22-23`).

## Related

- Decision and rationale: [[pages/decisions/0001-modular-monolith-architecture]]
- Boundary invariant: [[pages/invariants/module-boundaries]]
- Layer invariants: [[pages/invariants/layer-dependencies-one-way]], [[pages/invariants/domain-layer-purity]]
- Angular idioms inside `ui/`: [[pages/conventions/angular-best-practices]]

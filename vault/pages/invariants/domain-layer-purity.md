---
title: "The domain layer imports no framework"
version: "1.1"
date: 2026-08-08
changes: "Enforcement is live: real enforced_by and verified_by references from Phase 0"
page_type: invariant
status: active
description: "Files under modules/<context>/domain/ import no Angular, no RxJS and no HTTP."
source:
  - chat
reliability: high
updated: 2026-08-08
enforced_by:
  - "eslint.config.js:196-217 - `no-restricted-imports` scoped to `src/app/modules/*/domain/**/*.ts`"
  - "eslint.config.js:203 - the banned groups: `@angular/*`, `@angular/*/**`, `rxjs`, `rxjs/*`"
  - "eslint.config.js:53-56 - domain may import only its own module's domain, not even the shared kernel"
verified_by:
  - ".github/workflows/ci.yml:22-23 - `npm run lint` blocks every PR"
  - "Phase 0 negative proof: a scratch `module-a/domain` file importing `@angular/core` and `rxjs` produced two `@typescript-eslint/no-restricted-imports` errors"
---

# The domain layer imports no framework

> No file under `src/app/modules/<context>/domain/` may import from `@angular/*`, `rxjs`, or any HTTP client. Domain code is plain TypeScript.

**Enforced since Phase 0.** No `domain/` folder exists yet, so the rule holds vacuously - but the lint rule is scoped by path and activates the moment the first one appears, proven against a deliberate violation. Accepted as part of [[pages/decisions/0001-modular-monolith-architecture]].

## Why this is load-bearing

The domain layer is where a bounded context's rules live, and it is the only layer that has a chance of outliving the framework around it. Purity is what buys three things:

**Tests with no test bed.** A pure function is tested by calling it. No `TestBed.configureTestingModule`, no fixtures, no `detectChanges`, no async plumbing. This is the difference between exhaustively testing a pricing rule and testing the two cases somebody had patience for.

**Rules that stay findable.** Once `domain/` may import `HttpClient`, the natural next step is a domain object that fetches, and the rule and the transport are now in one file. The next reader looking for the rule finds a service. Purity keeps the answer to "what are the rules of this context" to a folder listing.

**A real Angular upgrade path.** Angular's idioms have turned over repeatedly - decorators to signals, NgModules to standalone, zones to zoneless. Each turn rewrote a lot of application code. Code that imports nothing from Angular is untouched by all of it.

`domain/` also declares the **ports** - the interfaces saying what the context needs from outside. A port is a plain interface. The moment it mentions `Observable<T>`, the domain has taken a dependency on a transport library and the inversion has collapsed.

## Scope

- **Applies to:** every file under `modules/<context>/domain/` - models, value objects, rule functions, port interfaces, domain errors.
- **Does not cover:** `application/`, which is Angular-injectable and uses signals by design; `infrastructure/`, whose job is HTTP; `shared-kernel/`, which is framework code.
- **Permitted imports in `domain/`:** other files in the same `domain/` folder, and TypeScript standard-library types. Nothing else. A tiny dependency-free utility library is a judgement call - default to no.

## What violating it looks like

```ts
// WRONG - domain/user-repository.ts
import { Observable } from 'rxjs';
export interface UserRepository {
  list(): Observable<User[]>;      // the port now names a transport library
}

// WRONG - domain/user.ts
import { Injectable } from '@angular/core';
@Injectable()                       // a model is not a service
export class User { }

// WRONG - domain/user-rules.ts
import { HttpClient } from '@angular/common/http';   // a rule that fetches
```

```ts
// RIGHT - domain/user-repository.ts
export interface UserRepository {
  list(): Promise<readonly UserSummary[]>;
}

// RIGHT - domain/user-rules.ts
export function canDeactivate(user: UserSummary): boolean {
  return user.status === 'active' && !user.isLastAdministrator;
}
```

Promises rather than Observables at the port is the deliberate choice: `Promise` is a language primitive, `Observable` is a library type. `infrastructure/` still uses RxJS internally with `HttpClient` and converts at its own edge, where converting is that layer's job.

Two symptoms that the invariant has already been breached in spirit even if the import list still looks clean:

- A domain test that needs `TestBed`. If it does, something in the graph is injectable.
- An `InjectionToken` defined in `domain/`. The token is Angular; it belongs in `application/` or `shared-kernel/`, pointing at the domain interface.

## Enforcement

Two rules, because they cover different halves of the problem:

- **`eslint-plugin-boundaries`** declares `domain` as an element type whose allowed-target list is `domain` itself and nothing else (`eslint.config.js:53-56`) - not even `shared-kernel`, since the shared kernel is framework code and allowing it would let Angular in through the back door. That covers imports from *inside* the app.
- **`no-restricted-imports`** scoped by path to `src/app/modules/*/domain/**/*.ts` (`eslint.config.js:196-217`) bans `@angular/*` and `rxjs` (`eslint.config.js:203`). This one is load-bearing rather than belt-and-braces: `eslint-plugin-boundaries` treats every npm package as external and allows it unconditionally, so **the boundaries graph alone does not stop `import { Injectable } from '@angular/core'` in a domain file.** The Phase 0 negative proof found this - an earlier config expressed the ban as a boundaries `disallow` policy and it silently never fired.
- **Domain specs run without `TestBed`.** A domain spec that needs one is the smell that catches what lint misses.
- **`smart-reviewer`** for the judgement call of whether logic that landed in a facade actually belongs in `domain/`.

The lint gate blocks every PR (`.github/workflows/ci.yml:22-23`).

**Not covered by lint:** an `InjectionToken` declared in `domain/` (it imports `@angular/core`, so it is caught) versus a domain file importing some other framework-ish package that is not Angular or RxJS (it is not). The ban is a named list, not a general purity check.

## Change protocol

If domain code appears to need a framework import, the framework concern belongs in another layer - almost always `application/` or `infrastructure/`. Move it there. If that is genuinely impossible, draft a superseding ADR before writing the import; do not add it and document it afterwards.

## Related

- Decision: [[pages/decisions/0001-modular-monolith-architecture]]
- Layer layout: [[pages/conventions/modular-architecture]]
- Direction of dependencies: [[pages/invariants/layer-dependencies-one-way]]
- Testing without a test bed: [[pages/conventions/testing]]

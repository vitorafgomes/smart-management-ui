---
title: "Layer dependencies point one way"
version: "1.0"
date: 2026-08-07
changes: "Initial invariant for one way layer dependencies"
page_type: invariant
status: active
description: "Inside a module dependencies run ui to application to domain, and infrastructure implements domain ports."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Layer dependencies point one way

> Inside a module, dependencies run **ui to application to domain** and never backwards. `infrastructure` depends on `domain` by implementing its ports, and nothing depends on `infrastructure` except the DI binding that provides it.

**Not enforced yet.** Accepted as part of [[pages/decisions/0001-modular-monolith-architecture]]; takes effect with the first module.

## The shape

```
  ui  ───────►  application  ───────►  domain
                                         ▲
                                         │ implements
                                  infrastructure
```

`domain` is the centre and depends on nothing. `infrastructure` points **inward** at the ports `domain` declares. `application` depends on the port interface, and receives the concrete adapter through DI - it never imports the class.

## Why this is load-bearing

**It is what makes the test strategy possible.** Because `application` depends on an interface rather than an HTTP class, a facade spec provides a fake in one line. The moment a facade imports `HttpUserRepository` directly, that spec has to stub `HttpClient`, and it starts failing when a URL changes - a test coupled to a transport the facade should not know about. See [[pages/conventions/testing]].

**It keeps transport changes local.** Endpoint moves, response shape changes, REST becomes something else: all of it lives in `infrastructure/` as long as the port holds. When `application` knows the transport, that change becomes a change to the state layer too.

**It stops the cycle that makes a module unreadable.** A backwards edge - a facade importing a component, a service importing the component that displays it - creates a graph with no entry point. Nothing can be understood or tested in isolation, and the module stops being extractable.

The backwards edge is also the one that arrives innocently. Nobody sets out to make `application` depend on `ui`; somebody needs a type that happens to be declared in a component file, imports it, and the cycle exists.

## Scope

- **Applies to:** every import between layers inside one `modules/<context>/`.
- **Does not cover:** imports crossing module boundaries, governed by [[pages/invariants/module-boundaries]]. `shared-kernel/` is outside the layer graph and may be imported by any layer except `domain/`.

## What violating it looks like

```ts
// WRONG - application importing ui
// application/user-facade.ts
import { UserListColumn } from '../ui/user-list/user-list';   // backwards edge

// WRONG - application importing a concrete adapter
// application/user-facade.ts
import { HttpUserRepository } from '../infrastructure/http-user-repository';
private readonly repository = inject(HttpUserRepository);      // now untestable without HTTP

// WRONG - ui reaching past application to the transport
// ui/user-list/user-list.ts
import { HttpUserRepository } from '../../infrastructure/http-user-repository';

// WRONG - infrastructure importing application
// infrastructure/http-user-repository.ts
import { UserFacade } from '../application/user-facade';       // adapter driving state
```

```ts
// RIGHT - application depends on the port, DI supplies the adapter
// domain/user-repository.ts
export interface UserRepository { list(): Promise<readonly UserSummary[]>; }
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');

// application/user-facade.ts
private readonly repository = inject(USER_REPOSITORY);

// index.ts or the module's route providers - the ONE place both sides are named
providers: [{ provide: USER_REPOSITORY, useClass: HttpUserRepository }]
```

The last block is the point of the whole arrangement: exactly one file names both the interface and the implementation, and it is a composition file, not a logic file.

The first violation - a shared type declared in a component file - is fixed by moving the type to `domain/`, where it probably belonged. The fourth, an adapter calling a facade, is usually a sign that an operation is being orchestrated in the wrong layer: orchestration is what `application/` is for.

## Enforcement (planned)

- **`eslint-plugin-boundaries`** with `ui`, `application`, `infrastructure` and `domain` as element types and an explicit allow-list per type, mirroring the table in [[pages/conventions/modular-architecture]]. Every edge above is a lint failure.
- **`import/no-cycle`** as a backstop for cycles that individual edge rules miss.
- **Facade specs that provide a fake port.** A spec that cannot construct its facade without HTTP has found a violation the lint config may not yet cover.
- **`smart-reviewer`** for the judgement calls: whether logic sitting in a facade belongs in `domain/`, and whether a new port is a port or a leaked transport detail.

Lands with the first implementation PR.

## Change protocol

A change that seems to need a backwards edge is usually a misplaced concern. Move the shared type down into `domain/`, or move the orchestration up into `application/`. If neither works, draft a superseding ADR before writing the import.

## Related

- Decision: [[pages/decisions/0001-modular-monolith-architecture]]
- Dependency table and examples: [[pages/conventions/modular-architecture]]
- Domain constraints: [[pages/invariants/domain-layer-purity]]
- Facade shape: [[pages/conventions/signals-state]]

---
title: "A module is imported only through its public API"
version: "1.1"
date: 2026-08-07
changes: "Tied the boundary rule to future module extraction"
page_type: invariant
status: active
description: "Cross module imports resolve to the module index.ts and never to a file inside another module."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# A module is imported only through its public API

> No file may import from inside another module. Every cross-module import resolves to that module's `index.ts`, via its `@modules/<context>` alias.

**Not enforced yet.** `src/app/modules/` does not exist; this invariant is accepted as part of [[pages/decisions/0001-modular-monolith-architecture]] and takes effect with the first module.

## Why this is load-bearing

The public API is the only thing that makes a module a module. Without it, "bounded context" is a folder name and nothing else.

Concretely, `index.ts` is what lets a module's internals change without a survey of the whole app. Rename a facade, split a service, swap a repository - if it never appeared in `index.ts`, no other module can have been depending on it, and the change is local by construction. The moment one deep import exists, that guarantee is gone for good: every later refactor has to ask "who else reached in here", and the answer requires grep rather than a file read.

**It is also what keeps a module extractable.** This app consolidated nineteen micro-frontends into one deployable, and a module may need to be split back out later - into an MFE or its own app. A module reached only through its public API can be lifted out by moving a folder and re-pointing imports; one that others reach into has to be excavated first. Coupling beyond the public API therefore does not just look untidy, it forecloses that option - see [[pages/decisions/0001-modular-monolith-architecture]].

It also degrades quietly. Deep imports do not break anything on the day they are written. They break the *third* refactor, months later, by which point the pattern is established and reverting it is a large mechanical change nobody schedules.

## Scope

- **Applies to:** every import crossing a `src/app/modules/<context>/` boundary, in any direction, including `shell/` importing a module.
- **Does not cover:** imports *within* one module - those are governed by [[pages/invariants/layer-dependencies-one-way]]. Also does not cover `shared-kernel/`, which every module may import from freely by design.

## What violating it looks like

```ts
// WRONG - alias, but reaching past the public API
import { UserFacade } from '@modules/administration/application/user-facade';

// WRONG - relative path into a sibling module
import { UserFacade } from '../../administration/application/user-facade';

// WRONG - a barrel that re-exports internals is the same violation with extra steps
export * from './application/user-facade';   // inside index.ts, exporting an internal
```

```ts
// RIGHT
import { UserSummary, provideAdministration } from '@modules/administration';
```

The third case is the one that slips through review. An `index.ts` that re-exports everything under the module is not a public API; it is a deep import with a shorter path. Export what the outside genuinely needs and nothing else.

The usual pressure that produces a violation: a screen in module B needs a value module A already computed. The wrong fix is to import A's facade. The right fixes are to expose the value through A's `index.ts`, to move the shared concept into `shared-kernel/`, or to compose the two in `shell/`. If the two modules truly need to react to each other's events, that is the deferred event bus in ADR 0001 - and the signal that it is time to write that ADR.

## Enforcement (planned)

- **`eslint-plugin-boundaries`.** Each module is a declared element type; the `no-private` and element-type rules reject any import that resolves to a path inside another module rather than to its entry point. This is the Angular equivalent of the NetArchTest suite in the reference solution.
- **tsconfig `paths`.** `@modules/<context>` maps explicitly to that module's `index.ts`, with **no wildcard entry**, so a deep alias path does not resolve at all. Shape shown in [[pages/conventions/modular-architecture]].
- **`smart-reviewer`.** Judges what tooling cannot: whether `index.ts` is exporting more than it should, and whether a new cross-module dependency should exist at all.
- **`smart-pipeline` capability check.** Any change adding a cross-module import routes to this page first.

All three land with the first implementation PR. Until then, the boundary rests on review and on root `CLAUDE.md` Rule H.

## Change protocol

If a change genuinely needs to violate this:

1. It almost certainly does not - widen the public API instead, or move the shared concept to `shared-kernel/`.
2. If it really does, draft a superseding ADR explaining why the boundary is wrong, not why this one case is special.
3. Update this page: `status: deprecated`, set `superseded_by:`.

An exception granted once becomes the precedent every later module copies.

## Related

- Decision: [[pages/decisions/0001-modular-monolith-architecture]]
- Mechanics and examples: [[pages/conventions/modular-architecture]]
- Sibling invariants: [[pages/invariants/layer-dependencies-one-way]], [[pages/invariants/domain-layer-purity]]

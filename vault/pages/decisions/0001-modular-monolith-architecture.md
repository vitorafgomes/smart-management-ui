---
title: "ADR 0001 - Modular monolith architecture for the Angular app"
version: "1.1"
date: 2026-08-07
changes: "Added migration context, extractability driver and deployment"
page_type: adr
status: accepted
description: "Adopt a modular monolith, translated from kgrzybek/modular-monolith-with-ddd, as the target architecture for smart-management-ui."
supersedes: ""
superseded_by: ""
source:
  - chat
reliability: high
updated: 2026-08-07
---

# ADR 0001 - Modular monolith architecture for the Angular app

> `smart-management-ui` is built as a modular monolith: one deployable Angular application composed of independent bounded-context modules, each with its own domain, application, infrastructure and ui layers, each exposing a single public API.

**Nothing described here is implemented yet.** The repository currently holds the plain Angular 22 scaffold. This page records the **accepted target**; the folder structure, the tooling that enforces it, and the tests that verify it all land with the first implementation PR.

## Status

- [x] Accepted
- [ ] Deprecated

Accepted 2026-08-07.

## Context

The app is the back-office frontend for the Smart Management ecosystem. It will grow feature by feature over a long period, and the failure mode we want to avoid is the one every mid-size Angular app hits: a `shared/` folder that becomes a dumping ground, feature folders that reach into each other's internals, and business rules smeared across components until no rule has a single home.

**This is not a greenfield app.** It is the migration target for the production SmartAdmin UI, an Angular 21 workspace running nineteen micro-frontends plus a shell on `@angular-architects/native-federation` - surveyed in [[pages/migration/legacy-source-overview]], with the module map in [[pages/migration/migration-status]]. So this decision carries a second half: **migrating away from the native-federation micro-frontend architecture.** What were separately built and separately deployed remotes become bounded-context modules inside one application.

The trade-off, briefly. Federation buys independent deployability, and this product was not using it: the remotes ship together, and the cost of the option was being paid continuously. That cost is concrete - a `strictVersion` singleton sharing block negotiating Angular and RxJS across twenty projects at runtime, DI that is only shared by careful configuration, an nginx gateway to front the remotes, Helm values split three ways, and a CI pipeline sized to match. Consolidating removes all of it: one dependency graph with no version skew to negotiate, one DI tree, one build, one deploy. What we give up is network-level isolation between modules - a remote physically cannot reach into another remote's internals, whereas in one app nothing stops an import. That guarantee is replaced by lint (`eslint-plugin-boundaries`), which is weaker in principle and, in practice, catches the same violations at a fraction of the operational cost.

### Modules must remain extractable

A primary driver, and the reason the boundary rules are strict rather than stylistic.

We are consolidating now, but the split may need to be reversed - a module extracted back into a micro-frontend, or into its own application, if a team, a release cadence, or a scaling need eventually demands it. The discipline in this ADR is what keeps that option open and cheap: a module that talks to the rest of the app **only through its public API** (and, later, events) can be lifted out largely by moving a folder and re-pointing its imports. A module that other code reaches into cannot - extracting it means first finding and unpicking every hidden dependency, which is the work that turns a two-day extraction into a quarter.

The consequence to internalise: **coupling beyond the public API is not a style problem, it forecloses the future split.** That is the standard to apply when a boundary rule feels inconvenient - the question is not "is this import tidy" but "would this import still be there when someone tries to lift this module out". Deep imports are the failure that is invisible today and expensive exactly once, at the moment you need the option you thought you had kept.

This is also why the deferred event bus below matters: events are the other extraction-safe channel. Direct calls between modules survive extraction badly; published events survive it well.

The backend side of this ecosystem is .NET, and the reference the team already agreed on is Kamil Grzybek's [modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd). That sample solves exactly this problem: bounded-context modules inside one deployable, strict layering inside each module, a single public entry point per module, and automated architecture tests (NetArchTest) that fail the build when a boundary is crossed.

Translating that shape to Angular is not a mechanical port. Angular has no assembly boundary, no `internal` keyword, and nothing stopping a component from importing a file eight directories away. The constraints that C# gets from the compiler have to come from tooling instead. What carries over cleanly is the *thinking*: contexts, layers, one-way dependencies, a public API per module.

Two constraints shape the translation:

- The app is **standalone-only** (no NgModules) on Angular 22, so "module" here means a **folder with a public API**, not an `@NgModule`.
- There is **no ESLint installed yet**. Enforcement therefore cannot be assumed; it must be scheduled explicitly.

## Decision

Adopt the modular monolith as the target architecture, structured as follows.

### Top-level layout

```
src/app/
  shell/            composition root: bootstrap wiring, app routes, layout chrome
  shared-kernel/    cross-cutting code every module may depend on
  modules/
    <context>/      one bounded context, e.g. administration
      domain/         pure TypeScript: models, value objects, domain rules, ports
      application/    signals facades: use cases, orchestration, state
      infrastructure/ HTTP repositories implementing the domain ports
      ui/             standalone OnPush components, lazy routes
      index.ts        the module's ONLY public API
```

### What each part is for

- **`shell/`** is the composition root. It owns bootstrap providers, the top-level route table that lazy-loads each module, and the application chrome (layout, navigation). It is the only place allowed to know that all modules exist.
- **`shared-kernel/`** holds genuinely cross-cutting code: the HTTP interceptor described in [[pages/conventions/correlation-id]], the global error handler, shared UI primitives, and types more than one context needs. It depends on no module. It is not a `utils` bin: per root Rule C, code earns its way in after a second consumer appears, not before.
- **`modules/<context>/domain/`** is pure TypeScript. No Angular, no RxJS, no `HttpClient` (see [[pages/invariants/domain-layer-purity]]). It also declares the **ports** - the interfaces describing what the context needs from the outside world, e.g. a repository interface.
- **`modules/<context>/application/`** holds the facades: injectable services that own state as signals and expose use-case methods. Shape defined in [[pages/conventions/signals-state]].
- **`modules/<context>/infrastructure/`** implements the domain ports against real transports, primarily typed HTTP repositories. The dependency direction is inverted here: infrastructure depends on domain, never the reverse.
- **`modules/<context>/ui/`** holds standalone `OnPush` components and the module's lazy route table. Components read signals from a facade and call its methods; they never own shared state and never inject `HttpClient`.
- **`index.ts`** is the module's public API and the only file another module may import from.

### Layer dependency rules

| Layer | May depend on | May never depend on |
|---|---|---|
| `ui` | `application`, `domain`, `shared-kernel` | `infrastructure`, another module's internals |
| `application` | `domain`, `shared-kernel` | `ui`, `infrastructure` implementations |
| `infrastructure` | `domain`, `shared-kernel` | `ui`, `application` |
| `domain` | nothing | everything (Angular, RxJS, HTTP included) |
| `shared-kernel` | nothing in `modules/` | any module |
| `shell` | every module's **public API** | any module's internals |

Two directions, stated plainly: dependencies flow **ui to application to domain**, and **infrastructure points at domain** by implementing its ports. Both are captured in [[pages/invariants/layer-dependencies-one-way]].

### Cross-module rule

A module imports another module **only through its public API** - `@modules/administration`, never `@modules/administration/application/user-facade`. That is [[pages/invariants/module-boundaries]], and the mechanical detail (tsconfig path mapping, right and wrong examples) lives in [[pages/conventions/modular-architecture]].

### Enforcement approach

`angular-eslint` plus `eslint-plugin-boundaries` is the Angular equivalent of the reference solution's NetArchTest suite: element types are declared per folder, allowed edges are declared once, and any import crossing an undeclared edge fails lint. The rules above are written to be expressible as boundaries config - that is deliberate, not incidental.

### Deliberately deferred

**A cross-module event bus is not being built now.** The reference solution uses in-process integration events between modules; we will need something equivalent eventually. But per root Rule C, an abstraction with one consumer is a liability, and today there are zero modules. The bus gets designed when a **second** module genuinely needs to react to something that happened in the first, and the design will be recorded as its own ADR. Until then, cross-module needs go through the shell.

## Consequences

- **Better:** each context has one home for its rules; the domain layer is testable with plain functions and no Angular test bed; changing a transport touches `infrastructure/` only; lazy loading follows the module boundary for free; a new teammate can find things by name rather than by grep.
- **Worse:** more folders and more indirection than a flat feature layout, which feels like overhead on the first module and pays off around the third; a port-and-adapter pair for a single HTTP call looks like ceremony until the second consumer arrives; the discipline is only as strong as the tooling, and until eslint boundaries is configured it rests on review.
- **Neutral but noteworthy:** "module" never means `@NgModule` in this repo. The app is standalone-only, and the two senses of the word will collide in conversation, so say "bounded-context module" when the ambiguity matters.
- **Neutral but noteworthy:** the deferred event bus is a known, dated gap rather than an oversight. If a workaround for it starts spreading before the ADR exists, that is the signal to write the ADR.
- **Deployment:** the app becomes a **single static-asset deploy** - Cloudflare Workers static assets driven by `wrangler.jsonc`, per [[pages/conventions/deployment]]. This is part of the monolith simplification, not a separate decision: one application producing one bundle needs none of the machinery nineteen independently deployed remotes needed. The legacy `Dockerfile`, `docker-compose.yml`, `docker/` (including the nginx gateway), `helm/` values and the container CI workflows are **retired for the UI**, not pending migration. Reintroducing server-side execution would need its own ADR.
- **Extraction stays possible but is not free.** Lifting a module back out later still means giving it its own build, its own deploy, and a real integration channel in place of in-process calls. The boundary discipline keeps that a bounded piece of work rather than an archaeology exercise; it does not make it a no-op.

## Alternatives considered

- **Flat feature folders (`src/app/features/<feature>/`).** The Angular default and cheapest to start. Rejected because it has no answer to "where does a business rule live" and no boundary to enforce - by the fifth feature the shared folder is the architecture.
- **Nx monorepo with one library per module.** Would give genuinely compiler-enforced boundaries and a mature tag-based lint rule set. Rejected as disproportionate: it is a build-system migration for a single deployable app, and `eslint-plugin-boundaries` buys most of the enforcement at a fraction of the cost. Revisit if this app is ever federated or split.
- **Full DDD tactical patterns (aggregates, repositories, domain events) mirrored one-to-one from the .NET sample.** Rejected because a frontend does not own the write model. The browser holds a projection of server state; aggregates and invariant enforcement belong on the server. We take the structural ideas - contexts, layers, ports, public APIs - and leave the tactical patterns that presuppose ownership of persistence.
- **Status quo (keep the scaffold, decide later).** Rejected: the first module written without a rule becomes the precedent every later module copies. The cheapest moment to set the shape is before any of it exists, which is exactly now.

## Enforcement (planned)

None of this is enforced today. The mechanisms below land **with the first implementation PR**, not after it.

- **Lint - structural.** `angular-eslint` and `eslint-plugin-boundaries`, configured so each folder role (`domain`, `application`, `infrastructure`, `ui`, `shared-kernel`, `shell`) is a declared element type with an explicit allow-list of targets. Deep imports into another module and any backwards layer edge fail lint.
- **tsconfig paths.** `@modules/*` maps to each module's `index.ts` only, so a deep path does not resolve. Detailed in [[pages/conventions/modular-architecture]].
- **Interceptor.** The correlation-id contract in [[pages/conventions/correlation-id]] is enforced by a single `HttpInterceptorFn` in `shared-kernel`, with a pinning test.
- **Review.** The `smart-reviewer` gate in the `smart-pipeline` skill covers what lint cannot express: whether a facade is really a facade, whether an error state is really reachable, whether a new file landed in the right layer.
- **Root rules.** Rule H in the repository `CLAUDE.md` restates the boundary rule so it is loaded into every session.

## Related

- Structure and mechanics: [[pages/conventions/modular-architecture]]
- Angular idioms this assumes: [[pages/conventions/angular-best-practices]]
- State shape inside `application/`: [[pages/conventions/signals-state]]
- Cross-cutting HTTP identity: [[pages/conventions/correlation-id]]
- Test expectations per layer: [[pages/conventions/testing]]
- Invariants this ADR creates: [[pages/invariants/module-boundaries]], [[pages/invariants/domain-layer-purity]], [[pages/invariants/layer-dependencies-one-way]], [[pages/invariants/state-is-signals-first]], [[pages/invariants/every-http-request-carries-correlation-id]]
- Migration source and module map: [[pages/migration/legacy-source-overview]], [[pages/migration/migration-status]]
- Deployment: [[pages/conventions/deployment]]
- Mock-first phase: [[pages/decisions/0002-mock-first-auth-and-data]]

## Notes

Reference: [kgrzybek/modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd). Read it for the *reasoning* about module boundaries and integration, not as a file-by-file template - the tactical persistence patterns do not transfer to a browser client.

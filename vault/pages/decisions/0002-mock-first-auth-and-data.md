---
title: "ADR 0002 - Mock first auth and data"
version: "1.0"
date: 2026-08-07
changes: "Initial ADR accepting mocked auth and data for this phase"
page_type: adr
status: accepted
description: "In this phase every domain port has an in-memory mock implementation and authentication is mocked; no real backend integration."
supersedes: ""
superseded_by: ""
source:
  - chat
reliability: high
updated: 2026-08-07
---

# ADR 0002 - Mock first auth and data

> In this phase, **all data and all authentication are mocked**. Every domain port gets an in-memory implementation bound via DI, and auth is a mock service plus a mock guard. No real backend, no identity provider.

## Status

- [x] Accepted
- [ ] Deprecated

Accepted 2026-08-07.

## Context

This repo is the migration target for a production app with nineteen micro-frontends ([[pages/migration/legacy-source-overview]]). The migration is UI-first and module-by-module, and the modules will land over an extended period.

If each module's migration had to wait on a settled backend contract, the migration would be gated on something outside the frontend team's control, module by module, nineteen times. The UI work and the contract work would serialise for no structural reason - the screens are known, the domain is known, and what is genuinely unsettled is the API surface.

The architecture in [[pages/decisions/0001-modular-monolith-architecture]] already has the seam for this. `application/` depends on a port declared in `domain/`; `infrastructure/` provides an adapter; one composition file binds the two. Nothing in that arrangement says the adapter has to speak HTTP.

## Decision

**Every domain port gets an in-memory mock implementation in the module's `infrastructure/` layer, bound through DI.** Authentication is a mock auth service and a mock guard - no identity provider, no tokens, no refresh.

Concretely:

- A port is declared in `domain/` exactly as it would be for a real backend. It is not shaped around being mocked.
- `infrastructure/` holds a mock adapter implementing it, returning in-memory fixtures with realistic shapes and realistic latency where that matters to the UI.
- The module's providers bind port to mock, in the same one place a real adapter would be bound.
- **Mock data lives in `infrastructure/`. Never in `domain/`, never in `ui/`.** A component with a hardcoded array in it is not mocked data, it is a component that will have to be rewritten.
- Failure paths are mockable and get mocked. A mock that can only succeed makes the error states in root Rule G untestable and unbuilt, which is exactly the shortcut that produces a UI with no error handling.

The mock adapter is a real implementation of a real interface, not a placeholder. It is the thing that lets the UI be built, reviewed and tested end to end before an API exists.

## Consequences

- **Better: swapping mock for real is a binding change, with zero module surgery.** One provider line moves from the mock class to the HTTP class. `domain/`, `application/` and `ui/` are untouched, because none of them ever named the adapter. This is precisely what the ports in ADR 0001 exist for, and this phase is the first thing that proves they work - if swapping an adapter turns out to require touching a facade, the layering was wrong and we find out cheaply.
- **Better:** migration proceeds module by module without backend coordination; the UI can be demoed and reviewed against realistic data from day one; every facade spec already mocks the port ([[pages/conventions/testing]]), so tests and runtime now use the same seam.
- **Worse: mocks lie, and they lie flatteringly.** Real APIs are slow, paginated, inconsistent, and fail. A mock that returns instantly and perfectly will hide missing loading states, absent pagination and unhandled errors until integration. Mitigate deliberately: realistic latency, realistic volumes, and error cases that are actually exercised.
- **Worse:** two implementations per port to keep in step. When a real adapter lands, the mock either follows the same contract or gets deleted - a mock left drifting is worse than no mock.
- **Worse:** mock auth means every auth-dependent behaviour (roles, permissions, tenancy, expiry) is a fiction until real auth arrives. Do not build fine-grained authorisation UI against a mock and assume it will hold.
- **Neutral but noteworthy: the correlation-id convention stays in force as the contract.** Mock adapters issue no HTTP, so [[pages/invariants/every-http-request-carries-correlation-id]] is **vacuously satisfied** during this phase - there are no requests to carry headers. The interceptor and its pinning test are still written as specified in [[pages/conventions/correlation-id]], so that the first real HTTP call is covered on the day it appears rather than being retrofitted. An invariant that holds vacuously is still the invariant.
- **Neutral but noteworthy:** backend integration is tracked **per port** in [[pages/migration/migration-status]], not as a single cutover. Ports go real independently, and a module can be half-real.

## Alternatives considered

- **Wait for real APIs before building each module.** Serialises frontend work behind backend contracts nineteen times, for no structural reason. Rejected.
- **Call a real backend with a fake/stub server (MSW, Prism, a mock API server).** Genuinely closer to production, and worth revisiting later - it would exercise the HTTP layer and the correlation headers for real. Rejected for now as more moving parts than the phase needs: it adds a service to run, a contract to maintain, and CI wiring, to test an `infrastructure/` layer that is currently one line of binding. The port seam gives most of the benefit at none of the cost.
- **Hardcode data in components and clean it up later.** Rejected outright. It puts the data where the architecture forbids it, and "later" means rewriting every component instead of rebinding one provider. This is the alternative this ADR exists to rule out.
- **Skip auth entirely until it is real.** Rejected: routes would be built with no guard, and adding guards afterwards means revisiting every route. A mock guard keeps the shape right from the start.

## Enforcement (planned)

- **Mock adapters live in `infrastructure/`**, enforced by the same `eslint-plugin-boundaries` config as real adapters - `domain/` and `ui/` cannot import them.
- **`smart-reviewer`** flags fixture data appearing in `domain/` or `ui/`, and mocks that cannot produce a failure.
- **Facade specs** already exercise both the success and failure transitions ([[pages/conventions/testing]]), which keeps the error paths real even while the data is not.
- **The correlation interceptor and its pinning test are written now**, not deferred to the first real call.
- **Per-port tracking** in [[pages/migration/migration-status]] records which ports are still mocked.

## Related

- Architecture and the ports this relies on: [[pages/decisions/0001-modular-monolith-architecture]]
- Where mocks live: [[pages/conventions/modular-architecture]]
- Vacuously satisfied for now: [[pages/invariants/every-http-request-carries-correlation-id]]
- HTTP contract for when real calls land: [[pages/conventions/correlation-id]]
- Per-port integration tracking: [[pages/migration/migration-status]]
- Legacy auth stack to port from: [[pages/migration/legacy-source-overview]]

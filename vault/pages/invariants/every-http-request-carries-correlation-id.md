---
title: "Every HTTP request carries both correlation headers"
version: "1.1"
date: 2026-08-07
changes: "Noted vacuous satisfaction during the mock first phase"
page_type: invariant
status: active
description: "Every outgoing request carries X-Session-Id and X-Correlation-Id, attached only by the shared-kernel interceptor."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Every HTTP request carries both correlation headers

> Every outgoing HTTP request carries `X-Session-Id` and a fresh `X-Correlation-Id`. Both are attached by the single `HttpInterceptorFn` in `shared-kernel/http/` - **no other code sets either header**.

**Not enforced yet.** Accepted as part of [[pages/decisions/0001-modular-monolith-architecture]]; the interceptor lands with the first implementation PR. Design detail in [[pages/conventions/correlation-id]].

> **Vacuously satisfied during the mock-first phase.** Per [[pages/decisions/0002-mock-first-auth-and-data]], all data and auth are currently mocked, and mock adapters issue no HTTP - so there are no requests to carry headers and the invariant holds trivially. It is written now, and the interceptor and its pinning test are built now, so that the **first real HTTP call is covered on the day it appears** rather than being retrofitted afterwards. A rule that holds vacuously is still the rule; the trap would be treating "no HTTP yet" as "no need for this yet".

## Why this is load-bearing

**"Every" is the whole feature.** A correlation id present on most requests is worth close to nothing operationally. The debugging session that needs it is exactly the one investigating an unusual path, and the unusual path is the one somebody forgot to instrument. A guarantee with holes does not fail loudly - it fails on the day it is needed, and only then does anyone discover the gap.

**One enforcement point is what makes "every" true.** If services attach the headers themselves, correctness depends on every author of every future repository remembering, which is a rule that decays with each new hire and each rushed fix. One interceptor makes it true by construction: a new repository written by someone who has never heard of this page still gets it right. It also collapses verification to a single test.

**It is the only bridge between a user report and a server log.** Without it, "the page broke this afternoon" is a search through unrelated traffic. With it, it is a lookup. That value only exists if the coverage is total.

**It keeps modules ignorant of observability.** No module knows the headers exist, so the evolution path in [[pages/conventions/correlation-id]] - adding W3C `traceparent`, later adopting OpenTelemetry - is a change to one file. If modules had hand-added headers, each of those steps would be an app-wide migration.

## Scope

- **Applies to:** every request issued through Angular's `HttpClient` from this application.
- **Does not cover:** requests made with bare `fetch` or `XMLHttpRequest`, which bypass the interceptor entirely. Those are a violation of root Rule A on their own - HTTP goes through a typed service using `HttpClient`. If a third-party SDK issues its own requests, that is a documented exception, not a silent one.
- **Does not cover** asset requests made by the browser (images, fonts, chunks). These are not application API calls.

## What violating it looks like

```ts
// WRONG - a service hand-adding the headers
return this.http.get<UserDto[]>('/api/users', {
  headers: { 'X-Correlation-Id': crypto.randomUUID() },
});
```

That one is the most damaging, and it looks conscientious. It duplicates the id-generation rule in a second place, so the two can drift; it makes the pinning test insufficient, because the interceptor could be unregistered and this call would still pass; and it establishes a pattern the next repository copies, which is how the single enforcement point disappears one file at a time.

```ts
// WRONG - bypassing HttpClient entirely, so the interceptor never runs
const response = await fetch('/api/users');

// WRONG - a second HttpClient configured without the interceptor
providers: [provideHttpClient()]    // in a module, shadowing the shell's configuration

// WRONG - clearing headers downstream
return next(req.clone({ setHeaders: {} }));    // another interceptor stripping the pair
```

The second and third are the failure modes a code reader will not notice. A module providing its own `provideHttpClient()` looks like ordinary DI and silently produces a client with no interceptors at all. `provideHttpClient` belongs in the shell's bootstrap providers and nowhere else.

```ts
// RIGHT - the repository knows nothing about correlation
return firstValueFrom(this.http.get<UserDto[]>('/api/users'));
```

A repository that mentions correlation at all has already gone wrong.

## Enforcement (planned)

- **One interceptor**, registered once via `provideHttpClient(withInterceptors([correlationInterceptor]))` in the shell's bootstrap providers.
- **A pinning test** with `HttpTestingController`: both headers present on a request through the configured client; `X-Correlation-Id` differs between two requests; `X-Session-Id` is identical across them. This is the test that fails if the interceptor is dropped from the provider list.
- **An E2E smoke assertion** (Playwright, per [[pages/conventions/testing]]) that every `/api/*` request observed during the smoke run carries both headers. The unit test proves the interceptor works; this proves it is actually installed in the running app - a distinction that matters, since a mis-registered provider passes the first and fails the second.
- **A lint or review check** that `setHeaders` in `infrastructure/` never names either header, and that `provideHttpClient` appears exactly once in the codebase.
- **`smart-pipeline` capability check.** Any change adding an HTTP call routes to [[pages/conventions/correlation-id]] first, where the "never hand-add" rule is stated.

All of it lands with the first implementation PR that makes an HTTP call.

## Change protocol

If a request genuinely must not carry these headers - a call to a third-party origin, say - the exemption is expressed **inside the interceptor**, as an explicit condition with a comment stating why. It is never expressed by bypassing the interceptor, because a bypass is invisible to the test that guards the rule.

## Related

- Design, backend contract and evolution path: [[pages/conventions/correlation-id]]
- Decision: [[pages/decisions/0001-modular-monolith-architecture]]
- Where the interceptor lives: [[pages/conventions/modular-architecture]]
- Tests: [[pages/conventions/testing]]

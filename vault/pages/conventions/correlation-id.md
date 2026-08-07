---
title: "Correlation id convention"
version: "1.1"
date: 2026-08-08
changes: "Built in Phase 0: real file paths, service instead of InjectionToken"
page_type: convention
status: active
description: "Two level request identity: X-Session-Id per app boot and X-Correlation-Id per request, attached by one shared-kernel interceptor."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Correlation id convention

Every outgoing HTTP request carries two identifiers so that a user saying "it broke around 3pm" becomes a searchable query on the backend.

**Status: built** (Phase 0, 2026-08-08). Lives in `src/app/shared-kernel/correlation/`.

## The two levels

| Header | Lifetime | Generated | Answers |
|---|---|---|---|
| `X-Session-Id` | Once per application boot | `crypto.randomUUID()` at bootstrap, held for the lifetime of the tab | "Show me everything this user did in this sitting." |
| `X-Correlation-Id` | Fresh per request | `crypto.randomUUID()` in the interceptor, per outgoing call | "Show me this exact failing call end to end." |

One value alone is not enough. A per-request id pinpoints the failure but cannot reconstruct what led to it; a per-session id gives the narrative but cannot isolate the call. Together they let a support conversation start from a timestamp and end at a stack trace.

The session id is deliberately **not** the auth session or the user id. It is an opaque diagnostic value that exists before login and survives a token refresh, and it must carry no personal data.

## One enforcement point

Both headers are attached by a **single functional `HttpInterceptorFn`** living in `shared-kernel/correlation/`, registered once with `provideHttpClient(withInterceptors([...]))` in the bootstrap providers (`src/app/app.config.ts:13`).

```ts
// src/app/shared-kernel/correlation/correlation.interceptor.ts
export const SESSION_ID_HEADER = 'X-Session-Id';
export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  const correlation = inject(CorrelationService);

  return next(
    request.clone({
      setHeaders: {
        [SESSION_ID_HEADER]: correlation.sessionId,
        [CORRELATION_ID_HEADER]: correlation.newCorrelationId(),
      },
    }),
  );
};
```

The header names are **exported constants**, not string literals repeated in the spec. A pinning test that hard-codes `'X-Session-Id'` while the interceptor writes something else passes for the wrong reason; sharing the constant makes that failure impossible.

**Services never hand-add these headers.** Not "as well as", not "just for this one call". The moment a repository sets `X-Correlation-Id` itself, the guarantee stops being a guarantee and becomes a convention that holds in the places somebody remembered. One interceptor means the rule is true by construction, and the pinning test only has to check one thing. This is [[pages/invariants/every-http-request-carries-correlation-id]].

The session id comes from an injectable `CorrelationService` (`providedIn: 'root'`) rather than a module-level constant, so a test can override the provider and assert on a fixed value. An earlier draft of this page specified an `InjectionToken`; the service was chosen instead because it gives the two operations - a stable `sessionId` and a `newCorrelationId()` factory - one owner, where a token would have needed two.

## The same id reaches the logs

A correlation id that only exists in a request header is half a feature. The same value must be reachable when something goes wrong on the client:

- **On failure**, the correlation id of the failing request is attached to whatever the error path records, so a console entry or a report can be matched to the backend trace.
- **The global `ErrorHandler`** in `shared-kernel/errors/` logs it alongside the error.
- **User-visible surfaces may show it** on a fatal error screen, as a short reference the user can read out. It stays a diagnostic string; it is never presented as something meaningful.

What this must not become: an id attached to a request, discarded, and then unrecoverable when the user reports the failure ten minutes later.

## Backend contract

The frontend guarantees the headers are present. The backend side of the contract:

- Read `X-Correlation-Id` and `X-Session-Id` at the entry point and push both into the logging scope for the whole request, so every log line inside carries them without being passed around by hand.
- In .NET, that means putting them on the ambient `Activity` (as tags or baggage) or into a logging scope, so `ILogger` output and any downstream call inherit them.
- If `X-Correlation-Id` is absent - a call from something other than this app - generate one server-side rather than logging without.
- Echo the correlation id back on the response so a client-side failure after the fact can still be tied to the server trace.

This part is a contract with the API team, not something this repo can enforce. It is recorded here so the frontend side is not built against an assumption nobody agreed to.

## Evolution path

The header pair is a deliberate first step, not the end state. The path to distributed tracing runs through the same single interceptor:

1. **Today (target):** two custom headers, one interceptor.
2. **Next:** add the W3C Trace Context `traceparent` header alongside them. It is the standard format (`version-traceid-spanid-flags`) and is what OpenTelemetry backends correlate on natively. The custom headers stay during the transition so nothing breaks.
3. **Then:** adopt an OpenTelemetry browser SDK, which generates `traceparent` and can carry the session id as baggage. At that point the custom `X-Correlation-Id` can be retired if the backend no longer needs it.

The reason this is cheap is the single enforcement point. Every step above is a change to one file in `shared-kernel/` - **no module is touched**, because no module ever knew about the headers in the first place. That property is the actual value of the rule, more than the specific header names.

## Enforcement

Built and running in CI:

- **One interceptor** in `shared-kernel/correlation/`, registered once in `provideHttpClient(withInterceptors([...]))`.
- **A pinning test** using `HttpTestingController` (`correlation.interceptor.spec.ts`): both headers present, `X-Correlation-Id` differing between two requests while `X-Session-Id` matches, and the same on a POST. This is the test that fails if somebody unregisters the interceptor.
- **`smart-pipeline` capability check:** any change adding an HTTP call routes here first.

Still to build, when there is a real HTTP call to observe:

- **E2E smoke assertion** per [[pages/conventions/testing]]: every `/api/*` request during the smoke run carries both headers. This is what proves the interceptor is *registered*, which the unit test cannot.
- **A lint or review check** that `setHeaders` in `infrastructure/` never names either header - a hand-added header is the failure mode this convention exists to prevent, and it is currently caught by review only.

## Related

- Architecture and where `shared-kernel` sits: [[pages/decisions/0001-modular-monolith-architecture]]
- Invariant: [[pages/invariants/every-http-request-carries-correlation-id]]
- Error surfacing this pairs with: [[pages/conventions/signals-state]] and root Rule G
- Tests: [[pages/conventions/testing]]

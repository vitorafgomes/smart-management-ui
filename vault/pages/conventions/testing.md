---
title: "Testing convention"
version: "1.2"
date: 2026-08-08
changes: "Phase 1: boot and deep-link smoke specs built against the real shell"
page_type: convention
status: active
description: "What must have a Vitest spec, how specs are written per layer, and the planned Playwright smoke suite."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Testing convention

Two levels: Vitest unit specs gating **every edit**, and a Playwright smoke suite gating **every PR**.

**Status:** both levels run today. Vitest through the `@angular/build:unit-test` builder (`ng test --no-watch`); Playwright installed in Phase 0 (`npm run e2e`), with the boot smoke test only - the other three smoke specs below need routes and API calls that do not exist yet.

## Unit tests (Vitest + jsdom)

### What must have a spec

| Subject | Spec required | What it asserts |
|---|---|---|
| `domain/` functions and rules | Always | Input to output, including the boundaries and the invalid cases. No test bed - these are plain functions. |
| `application/` facades | Always | The state transitions: loading to data, and loading to error. |
| Interceptors | Always | Headers and behaviour, via `HttpTestingController`. |
| Guards and resolvers | Always | Both outcomes: allow and the redirect. |
| Pipes and pure helpers | Always | Transform behaviour, including edge inputs. |
| `infrastructure/` repositories | Always | Request shape, response mapping, and the failure path. |
| Components with logic | Yes | The behaviour, not the markup. |
| Pure presentational components | No | If it only renders its inputs, a spec asserts the template back to itself. |
| Wiring with nothing to assert | No, but say so | Root Rule B: state explicitly that there is nothing meaningful to assert. Never skip silently. |

The two rows people get wrong: a facade needs the **error** transition tested, not just the happy path, and route configuration, guards, forms, HTTP services and state services are **never trivial** even when the diff is two lines - `smart-pipeline` treats them as full-lane work.

### How specs are written

**Beside the file, `*.spec.ts`.** `user-facade.ts` and `user-facade.spec.ts` in the same folder. No parallel `test/` tree - a spec that is hard to find is a spec that stops being updated.

**AAA, with visible seams.** Arrange, Act, Assert, in that order, blank-line separated. One behaviour per `it`. The `it` name states the behaviour and its condition ("sets error and clears users when the repository rejects"), not the method name.

**Mock the port, never `HttpClient`, in facade tests.** This is the rule the architecture exists to make possible. A facade depends on the domain port, so its spec supplies a fake:

```ts
const repository: UserRepository = {
  list: vi.fn().mockResolvedValue([aUser()]),
};

TestBed.configureTestingModule({
  providers: [UserFacade, { provide: USER_REPOSITORY, useValue: repository }],
});
```

Reaching past that to stub `HttpClient` or wire `HttpTestingController` inside a facade spec couples the test to a transport the facade is not supposed to know about. It makes the spec fail when a URL changes, which is precisely the coupling the port removed.

`HttpTestingController` belongs in **`infrastructure/` specs and interceptor specs** - the layers whose actual job is HTTP.

**Test behaviour, not implementation.** Assert on what a facade exposes and what a component renders, not on which private method ran.

### Failure paths are not optional

Per root Rule G and the `production-readiness-checks` skill: every boundary gets at least one spec where the call **fails**. For the frontend that means a rejected repository call, a 500, and a network error - and the assertion is that the facade lands in a real error state with data cleared, not that it merely does not throw.

### The gate

**Per edit, not per PR** (root Rule B):

```
ng test --no-watch        fully green, no filtering
npx prettier --check <touched files>
ng build                  zero errors AND zero warnings
npm run lint              clean
```

No `.only`, no filtered runs to make a gate pass. Bundle-budget warnings count as failures. Gate runs dispatch to `smart-mechanic`.

## E2E tests (Playwright)

Installed in Phase 0. **Two of the four specs below exist**; the other two need HTTP calls, which the mock-first phase does not make ([[pages/decisions/0002-mock-first-auth-and-data]]).

### Setup

`playwright.config.ts` uses `webServer` to start `ng serve` on port 4200 and wait for it, so a run needs no manual server. `reuseExistingServer` is on locally and off in CI. Specs live in `e2e/`. Chromium is enough for the gate; more browsers are a nightly concern, not a per-PR one.

### The smoke suite

Deliberately small - four assertions that catch the failures unit tests structurally cannot:

1. **The app boots and redirects.** Load `/`, land on the real default route with rendered content. Catches broken bootstrap, provider errors and route misconfiguration. **Built** (`e2e/smoke.spec.ts`): an anonymous visit to `/` lands on `/auth/login`, mock login lands in the main layout with header and sidenav rendered, and logout returns to login.
2. **SPA deep-link works.** Load a nested route directly, as a bookmark or refresh would. This is the classic production-only failure: fine when navigated to in-app, 404 when the server is asked for the path. Only a real server catches it. **Built** in Phase 1: `/dashboard` is loaded directly with a seeded mock session and asserted to render inside the layout.
3. **Every `/api/*` request carries both correlation headers.** Intercept network traffic during a normal flow and assert `X-Session-Id` and `X-Correlation-Id` on every API call, with the correlation id differing per request. This is the end-to-end proof for [[pages/invariants/every-http-request-carries-correlation-id]] - the unit test proves the interceptor works, this proves it is actually installed in the running app.
4. **An API 500 produces a user-visible error state.** Route-intercept an endpoint to return 500 and assert the user sees an error - not a blank panel, not a spinner forever. Root Rule G, verified rather than asserted in review.

The suite stays this size on purpose. A smoke suite that grows into a regression suite becomes slow, then flaky, then ignored.

### The gates, side by side

| Level | When | Command | Blocks |
|---|---|---|---|
| Unit | Every edit | `ng test --no-watch` | The next edit |
| Build | Every edit | `ng build` (zero warnings) | The next edit |
| Format | Every edit | `npx prettier --check` | The next edit |
| Lint | Every edit | `npm run lint` | The next edit |
| E2E smoke | Every PR | `npm run e2e` | The merge |

E2E is per-PR rather than per-edit because it needs a built and served app; running it on every keystroke-level change would make the inner loop unusable, and the unit gate already covers what changes at that granularity.

## Enforcement

- **Per-edit gate** as above, dispatched to `smart-mechanic` by the `smart-pipeline` skill. In force for unit, build, format and lint.
- **Playwright `webServer`** config plus the boot, auth and deep-link smoke specs. The remaining two land with the first real HTTP call.
- **CI** (`.github/workflows/ci.yml`) runs lint, build, unit and E2E on every pull request and on push to `main`. None of them is skippable.
- **`smart-reviewer`** checks that new boundaries actually have a failure-path spec and that facade specs mock the port rather than the transport.

## Related

- Layers being tested: [[pages/decisions/0001-modular-monolith-architecture]], [[pages/conventions/modular-architecture]]
- Facade state transitions: [[pages/conventions/signals-state]]
- Header assertions: [[pages/conventions/correlation-id]]
- Component idioms: [[pages/conventions/angular-best-practices]]

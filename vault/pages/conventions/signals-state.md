---
title: "Signals state convention"
version: "1.1"
date: 2026-08-07
changes: "Added signals RxJS interop decision table"
page_type: convention
status: active
description: "The facade pattern for state: private writable signals, public readonly and computed, loading and error as real states."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Signals state convention

How state is held in `modules/<context>/application/`. This is the expansion of root Rule A for the modular architecture in [[pages/decisions/0001-modular-monolith-architecture]].

**Status: target.** No facade exists in the repo yet.

## The facade pattern

An `application/` facade is an injectable service that owns the state of a use case and exposes it read-only.

```ts
@Injectable()
export class UserFacade {
  private readonly repository = inject(USER_REPOSITORY);

  private readonly _users = signal<readonly UserSummary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal('');

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly visibleUsers = computed(() => {
    const term = this._filter().toLowerCase();
    return term ? this._users().filter((u) => u.name.toLowerCase().includes(term)) : this._users();
  });
  readonly isEmpty = computed(() => !this.loading() && !this.error() && this.visibleUsers().length === 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._users.set(await this.repository.list());
    } catch (cause) {
      this._error.set(toUserMessage(cause));
      this._users.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  setFilter(value: string): void {
    this._filter.set(value);
  }
}
```

The shape, stated as rules:

1. **Writable signals are private**, conventionally underscore-prefixed.
2. **Everything public is `asReadonly()` or `computed()`.** A component can never reach in and `set()`.
3. **Derived values are `computed()`, never a second writable signal kept in sync.** If two signals can disagree, one of them should have been a `computed()`.
4. **State mutation happens only inside facade methods.** Those methods are the use cases and they are what specs exercise.

## Loading, error and data are all real states

This is root Rule G expressed in signals. Every asynchronous surface carries all three, and every one of them is renderable.

- `loading` flips true before the call and false in `finally`, so a thrown error cannot strand a spinner.
- `error` is cleared at the start of each attempt - a stale error next to fresh data is worse than no error.
- On failure, data is reset rather than left showing the previous result underneath an error banner.
- The **empty** case is distinct from the error case. `isEmpty` above is a `computed()` precisely so the template can tell "no results" from "the request failed".

A facade that has a `data` signal and no `error` signal is not finished.

## Choosing between signals, resource, and RxJS

The decision table. Read it before reaching for an idiom out of habit.

| The thing you have | Use | Notes |
|---|---|---|
| Synchronous state | `signal()`, derived with `computed()` | The default. No new `BehaviorSubject`. |
| Async data fetched into state | `resource()` / `httpResource()` | **Check maturity first** - see below. |
| A genuine event stream | RxJS | Websockets, SSE, debounced input, anything needing `switchMap` / `retry` / `debounceTime`. |
| A stream you need as state | `toSignal()` | The only sanctioned direction into the signal graph. |
| A signal something reactive must observe | `toObservable()` | The only sanctioned direction out. |
| A subscription that genuinely must exist | `takeUntilDestroyed()` | Never a bare `subscribe()` with manual teardown. |
| A side effect outside the signal graph | `effect()`, sparingly | Never for state propagation - that is `computed()`. |

**On `resource()` and `httpResource()`:** these are Angular's signal-native async primitives and are the intended future shape for fetching into signal state. They were introduced as experimental / developer-preview APIs, and their stability status has moved between releases. **Verify the status in the docs for the Angular version actually installed here (22.1.1) before depending on either in code that has to be stable** - an experimental API can change shape in a minor release. I have not verified their current stability tags in this repo's `node_modules`, so treat this row as "the right direction, confirm before committing to it", not as a green light.

Rules that follow from the table:

- **Bridging happens only via `toSignal()` / `toObservable()`** from `@angular/core/rxjs-interop`. No hand-rolled bridging.
- **Manual `subscribe()` in a component is forbidden.** It is a leak waiting to happen and it puts state outside the signal graph. Where a subscription is genuinely necessary, `takeUntilDestroyed()` ties it to the injection context.
- **Templates read signals directly.** No `async` pipe in new code - if a template needs an `async` pipe, an observable got further than it should have.
- **`effect()` is for side effects only**, never for propagating state.

### Right and wrong

```ts
// WRONG - subject state, async pipe, manual derivation
export class UserFacade {
  private readonly users$ = new BehaviorSubject<UserSummary[]>([]);
  readonly users$$ = this.users$.asObservable();
  readonly count$ = this.users$.pipe(map((u) => u.length));
}
```
```html
<p>{{ count$ | async }}</p>
@for (user of users$$ | async; track user.id) { ... }
```

```ts
// RIGHT - signal state, computed derivation
export class UserFacade {
  private readonly _users = signal<readonly UserSummary[]>([]);
  readonly users = this._users.asReadonly();
  readonly count = computed(() => this._users().length);
}
```
```html
<p>{{ count() }}</p>
@for (user of users(); track user.id) { ... }
```

Same behaviour, and the second version has no subscription, no teardown, no `async` pipe evaluating twice, and a derived value that cannot go stale.

## No BehaviorSubject for new state

`BehaviorSubject` is not how new state is written here. It is a signal with worse ergonomics: manual `async` pipes or subscriptions, manual teardown, and no participation in `computed()`.

**RxJS is still the right tool for genuine event streams** - things that are sequences over time rather than a current value:

- `HttpClient` responses at the `infrastructure/` boundary
- debounced input, `fromEvent`, WebSocket or SSE messages
- anything needing real operators: `switchMap` for cancellation, `retry`, `debounceTime`

Convert at the edge. A stream enters the facade, gets consumed, and lands in a signal; it does not become the facade's public API. `toSignal()` and `toObservable()` from `@angular/core/rxjs-interop` are the sanctioned bridges.

Root Rule A also forbids introducing a **second** async idiom alongside an established one on the same surface. Pick the one already in use there.

## Components never own shared state

A component may hold state that is genuinely its own and dies with it - whether a local dropdown is open, a transient hover target. Anything else lives in the facade.

Specifically, a component must not:

- fetch server data itself, or inject `HttpClient` (root Rule A)
- keep its own copy of data another component also shows - two components showing the same data read the same facade
- hold state that must survive its own destruction

Components read signals from the facade and call its methods. That is the whole interaction.

```ts
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  protected readonly facade = inject(UserFacade);
}
```

## Effects

`effect()` is for synchronising with something outside the signal graph: writing to `localStorage`, calling a charting library, logging. It is **not** for deriving state. An `effect()` whose body sets another signal is nearly always a `computed()` that was written the long way, and it introduces an ordering problem that `computed()` does not have.

## Facade lifetime

Provide a facade at the route that owns it, not in `root`, unless the state genuinely outlives every route that uses it. Route-scoped state is destroyed with the route, which is what stops a stale list from flashing when the user comes back.

## Enforcement (planned)

- **Pattern specs.** Every facade has a spec covering the loading-to-data and loading-to-error transitions, per [[pages/conventions/testing]]. A facade with no error-path spec does not pass the test gate.
- **`smart-reviewer`.** Public writable signals, `effect()` used for derivation, components fetching their own data, and new `BehaviorSubject` state are review findings - none of them is expressible as a lint rule.
- **Lint.** `eslint-plugin-boundaries` keeps `application/` from importing `ui/` or concrete `infrastructure/` classes, which is what keeps the facade injectable against a fake in tests.
- Invariant page: [[pages/invariants/state-is-signals-first]].

## Related

- Architecture: [[pages/decisions/0001-modular-monolith-architecture]]
- Where facades live: [[pages/conventions/modular-architecture]]
- Rendering these states: [[pages/conventions/angular-best-practices]]
- Testing facades: [[pages/conventions/testing]]

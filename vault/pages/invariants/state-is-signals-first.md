---
title: "Shared state is held in signals"
version: "1.0"
date: 2026-08-07
changes: "Initial invariant for signals first state"
page_type: invariant
status: active
description: "Component and shared state is held in signals; no new BehaviorSubject backed state is introduced."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Shared state is held in signals

> All component and shared state is held in signals. No new `BehaviorSubject`-backed state is introduced. RxJS is used for genuine event streams, converted to a signal at the boundary.

**Not enforced yet.** Accepted as part of [[pages/decisions/0001-modular-monolith-architecture]]; takes effect with the first module. Root Rule A already states the signals-first position.

## Why this is load-bearing

**A single state idiom, or the app has two.** This is the failure mode the invariant exists for, and it does not announce itself. One surface uses signals, a later one uses a `BehaviorSubject` because that is what its author knew, and now every reader has to learn both, every derived value is written twice - `computed()` here, `combineLatest` there - and bridging code accumulates between them. The cost is not in either idiom; it is in there being two. Root Rule A forbids introducing a parallel async idiom alongside an established one, and this invariant fixes which one is established.

**Signals compose without subscriptions.** A `computed()` is glitch-free, has no teardown, cannot leak, and is read the same way in a class and in a template. A `BehaviorSubject` needs an `async` pipe or a manual subscribe-and-unsubscribe, and every one of those is a chance to leak.

**It is what OnPush and zoneless assume.** Signal reads register with the template automatically, so a signal change marks exactly the components that read it. That is the mechanism [[pages/conventions/angular-best-practices]] relies on. State held outside the signal graph needs something else to trigger rendering, which reintroduces the change-detection guesswork the architecture is trying to remove.

## Scope

- **Applies to:** state in `application/` facades and any state a component holds.
- **Does not cover:** genuine event streams - `HttpClient` responses, `fromEvent`, debounced input, WebSocket or SSE messages. Those are sequences over time, RxJS is right for them, and the operators (`switchMap` for cancellation, `retry`, `debounceTime`) have no signal equivalent.
- **Does not cover** existing `BehaviorSubject` code in third-party libraries. The rule is about state written here.

The distinction in one line: **a signal answers "what is the value now"; an observable answers "what happened over time".** Pick by that question, not by habit.

## What violating it looks like

```ts
// WRONG - new state as a subject
private readonly users$ = new BehaviorSubject<UserSummary[]>([]);
readonly users = this.users$.asObservable();

// WRONG - public writable signal; anyone can set it from anywhere
readonly users = signal<UserSummary[]>([]);

// WRONG - derived value as a second writable signal
readonly users = signal<UserSummary[]>([]);
readonly userCount = signal(0);          // can now disagree with users()
// ...somewhere: this.userCount.set(list.length);

// WRONG - effect used to derive
effect(() => this._visible.set(this._users().filter(u => u.active)));

// WRONG - component fetching and holding its own copy of shared data
export class UserList {
  private readonly http = inject(HttpClient);
  readonly users = signal<UserSummary[]>([]);
}
```

```ts
// RIGHT
private readonly _users = signal<readonly UserSummary[]>([]);
readonly users = this._users.asReadonly();
readonly userCount = computed(() => this._users().length);

// RIGHT - a stream converted at the boundary
readonly results = toSignal(
  toObservable(this.query).pipe(debounceTime(300), switchMap((q) => this.repository.search(q))),
  { initialValue: [] },
);
```

Two of those deserve calling out because they are not obviously wrong at a glance:

- **The public writable signal** technically holds state in a signal and still breaks the design. State is only owned if only the owner can write it - see [[pages/conventions/signals-state]].
- **The `effect()` that derives** works, until ordering matters. `computed()` is pull-based and cannot be stale; an effect writing a signal can be, and it makes the dependency invisible to anyone reading the declaration.

The last example - a component with its own `HttpClient` and its own copy of shared data - also violates root Rule A directly, and is how two screens end up showing different values for the same record.

## Enforcement (planned)

- **`smart-reviewer`.** The primary mechanism. Public writable signals, derivation via `effect()`, new `BehaviorSubject` state, and components holding shared state are review findings; none is expressible as a lint rule, because each depends on what the state *means*.
- **A `no-restricted-imports` or custom lint rule** flagging `new BehaviorSubject` outside `infrastructure/`, as a blunt tripwire that forces the justification into the PR conversation.
- **`eslint-plugin-boundaries`** keeps `ui/` from importing `infrastructure/`, which structurally prevents the component-fetches-its-own-data version.
- **Facade specs** asserting state transitions through the public surface, per [[pages/conventions/testing]] - a facade whose public API is writable is awkward to spec, which surfaces the problem early.

Lands with the first implementation PR.

## Change protocol

If a surface seems to need `BehaviorSubject`-backed state, it is usually an event stream in disguise - model it as a stream and convert with `toSignal()` at the boundary. If it genuinely is state and signals genuinely cannot express it, draft a superseding ADR rather than introducing a second idiom quietly.

## Related

- Decision: [[pages/decisions/0001-modular-monolith-architecture]]
- Facade pattern in full: [[pages/conventions/signals-state]]
- Angular idioms: [[pages/conventions/angular-best-practices]]
- Where facades live: [[pages/conventions/modular-architecture]]

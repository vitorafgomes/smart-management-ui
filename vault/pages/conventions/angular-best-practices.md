---
title: "Angular best practices"
version: "1.0"
date: 2026-08-07
changes: "Initial house rules based on official Angular guidance"
page_type: convention
status: active
description: "Official angular.dev guidance adopted as house rules for smart-management-ui, with notes on what lint will enforce."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Angular best practices

The current Angular guidance from angular.dev, adopted as house rules. This is the checklist referenced from root `CLAUDE.md` Rule B step 3.

The repo is Angular 22, standalone, zoneless-friendly, no SSR. Everything below is the **target**; the codebase is still the scaffold, and no ESLint is installed yet.

## Components

**Standalone only.** No `NgModule` anywhere. Angular's own guidance treats standalone as the default; `standalone: true` is implicit and does not need to be written.

**`ChangeDetectionStrategy.OnPush` on every component.** Not "where it matters" - everywhere. OnPush is what makes signal-driven rendering predictable and keeps the app zoneless-compatible. A component without it is a bug waiting for a scaling problem.

```ts
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList { }
```

**One thing per file.** One component, one directive, one service per file. A "barrel of small components" file is not a shortcut, it is a merge conflict.

**Keep components thin.** A component renders state and forwards intent. Business logic belongs in `domain/`, orchestration in the `application/` facade - see [[pages/conventions/modular-architecture]].

## Inputs, outputs, and DI

**Signal-based `input()`, `output()`, `model()`** - never the `@Input()` / `@Output()` decorators.

```ts
readonly userId = input.required<string>();
readonly pageSize = input(20);
readonly selected = output<UserSummary>();
readonly query = model('');
```

`input()` gives a readable signal that participates in `computed()` directly, which is the whole point. Use `model()` only for genuine two-way binding, not as a way to let a parent mutate a child's internals.

**`inject()` over constructor injection.** Field initialisers with `inject()` read better, work in functions (guards, interceptors, resolvers), and compose with inheritance without constructor plumbing.

```ts
private readonly facade = inject(UserFacade);
```

## Templates

**Native control flow only: `@if`, `@for`, `@switch`.** Never `*ngIf`, `*ngFor`, `*ngSwitch`, and never import `CommonModule` to get them. `@for` requires `track` - use a stable identity, not `$index`, unless the list genuinely has no identity.

```html
@if (facade.loading()) {
  <app-spinner />
} @else if (facade.error(); as error) {
  <app-error-panel [message]="error" (retry)="facade.reload()" />
} @else {
  @for (user of facade.users(); track user.id) {
    <app-user-row [user]="user" />
  } @empty {
    <p>No users match this filter.</p>
  }
}
```

That example is also the shape root Rule G asks for: loading, error and empty are all rendered states, not afterthoughts. See [[pages/conventions/signals-state]].

**`@defer` for below-the-fold and heavy content.** Charts, rarely-opened panels, and anything expensive that is not needed for first paint. Always give a `@placeholder`, and prefer a trigger tied to reality (`on viewport`, `on interaction`) over `on idle`.

**Keep logic out of templates.** No function calls in bindings that do real work, no complex expressions. Derived values are `computed()` in the class.

**`NgOptimizedImage` for every static image.** It handles sizing, lazy loading, priority hints and srcset. Mark the LCP image `priority`. It does not apply to inline base64 sources.

**Accessibility is part of the markup, not a later pass.** Semantic elements before ARIA; every interactive control reachable and operable by keyboard; labels tied to inputs; visible focus; images with meaningful `alt` (or empty `alt` when decorative); state changes announced rather than only shown. The `accessibility-tester` agent runs on new user-facing surfaces per `AGENTS.md`.

## Host bindings

Use the `host` object in the decorator metadata. Do not use `@HostBinding` / `@HostListener`.

```ts
@Component({
  // ...
  host: {
    '[class.is-loading]': 'loading()',
    '(keydown.escape)': 'close()',
  },
})
```

One place to read all host behaviour beats decorators scattered through the class.

## State

Signals for state, `computed()` for derivation, `effect()` sparingly and never as a way to write state that a `computed()` could derive. Full rules in [[pages/conventions/signals-state]]; the short version is that `computed()` is the default and an `effect()` that assigns to a signal is usually a design smell.

## Forms

**Typed reactive forms.** No `FormGroup<any>`, no untyped `FormBuilder` usage. Prefer `NonNullableFormBuilder` so `reset()` returns to a real value rather than `null`.

Validation lives in validators, not in the submit handler. A disabled submit button is a UX affordance, not a guard - the submit path validates for real and surfaces failures per root Rule G.

## Naming and files

Angular's current style guide: file names in kebab-case, named for what the file contains, without redundant type suffixes.

- `user-list.ts`, `user-list.html`, `user-list.scss`
- `user-facade.ts`, `http-user-repository.ts`
- Classes in PascalCase, matching the file: `UserList` in `user-list.ts`
- Component selectors prefixed `app-`

## TypeScript

`strict` stays on. No `any` without a written justification (root Rule B). Prefer `unknown` plus narrowing at boundaries. Type HTTP responses explicitly in `infrastructure/`; never let an untyped response leak into `application/`.

## Enforcement (planned)

| Rule | Enforced by |
|---|---|
| No `NgModule`, no `*ngIf` / `*ngFor`, decorator `@Input` / `@Output`, `@HostBinding` / `@HostListener` | `angular-eslint` once configured - it ships rules for each of these |
| OnPush everywhere, component selector prefix, file naming | `angular-eslint` (selector and naming rules) plus review |
| `inject()` over constructor, thin components, `computed()` over `effect()` | `smart-reviewer` - not expressible as a lint rule |
| Template accessibility | `angular-eslint` a11y rules cover the mechanical subset; `accessibility-tester` covers the rest |
| Typed forms, no untyped HTTP responses | `tsc --strict` plus `smart-reviewer` |

**ESLint is not installed in this repo yet.** Until it is, every row above rests on review. Configuring `angular-eslint` lands with the first implementation PR alongside the boundaries plugin described in [[pages/conventions/modular-architecture]].

## Related

- Architecture this sits inside: [[pages/decisions/0001-modular-monolith-architecture]]
- Where components live: [[pages/conventions/modular-architecture]]
- State rules: [[pages/conventions/signals-state]]
- Specs for components with logic: [[pages/conventions/testing]]

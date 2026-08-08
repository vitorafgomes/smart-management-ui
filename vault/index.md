---
title: "Smart Management UI Vault Index"
version: "1.3"
date: 2026-08-08
changes: "Phase 2: identity module page listed"
page_type: index
status: active
description: "Content catalogue for the smart-management-ui LLM wiki."
updated: 2026-08-08
---

# Smart Management UI Vault Index

The content catalogue for this vault. Start here, follow wikilinks. If the vault can't answer, grep source, then `/wiki-crystallize` the findings back.

- Operation contract: [[CLAUDE]] (how Claude operates on this vault)
- Page schema: [[wiki-schema]] | Config: [[wiki-config]]
- Templates: `templates/`

> **Coverage note (2026-08-08):** the target architecture ([[pages/decisions/0001-modular-monolith-architecture]]) is now **implemented and enforced**, not just documented. Phase 0 landed the eslint boundary rules, the `tsconfig` mapping, the correlation interceptor and CI; Phase 1 landed the shell and theming; Phase 2 landed the first module, [[pages/modules/identity]], which is where to look for a worked example of the conventions rather than reading them cold. Data and auth are still mocked ([[pages/decisions/0002-mock-first-auth-and-data]]). Anything not yet covered here: work from the root `CLAUDE.md` Rules A–H plus the source, and crystallize what you learn back.

## Migration

**`smart-management-ui` (this repo) is a migration target extracted from the production SmartAdmin UI** — an Angular 21 workspace of nineteen `native-federation` micro-frontends plus a shell, at `/home/vitorafgomes/WorkSpace/Dev/Smart.Management/smart-management-ui` (**read-only**). The remaining work is tracked here.

- [[pages/migration/legacy-source-overview]] — what the legacy app is: workspace layout, the shell's auth and tracing stacks, the stack (bun, ng-bootstrap, FullCalendar, ApexCharts, OpenTelemetry, SmartAdmin), builds and deployment surface.
- [[pages/migration/migration-status]] — the module map (every row **not started**), cross-cutting concerns to port, and what is explicitly **not** migrating (Docker, Helm, the nginx gateway, native federation itself).

## Overview

Pages arrive as the project grows.

## Architecture

Pages arrive as the project grows. The architectural shape itself is recorded as an ADR — see Decisions below.

## Conventions

- [[pages/conventions/modular-architecture]] — folder tree, layer dependency table, import examples, checklist for adding a module.
- [[pages/conventions/angular-best-practices]] — official angular.dev guidance as house rules: standalone, signals, native control flow, OnPush, `inject()`, typed forms.
- [[pages/conventions/signals-state]] — the facade pattern: private writable signals, public computed and readonly, loading/error/data as real states.
- [[pages/conventions/correlation-id]] — `X-Session-Id` and `X-Correlation-Id`, attached by one shared-kernel interceptor.
- [[pages/conventions/testing]] — what must have a Vitest spec, how specs are written per layer, and the planned Playwright smoke suite.
- [[pages/conventions/deployment]] — Cloudflare Workers static assets only: push to `main` triggers Workers Builds, `wrangler.jsonc` is the single source of deploy config. No Docker, no Helm.
- [[pages/conventions/dependency-security]] — supply-chain gate: what it takes for a package to enter the project; CI blocks high/critical runtime advisories.

## Invariants

- [[pages/invariants/module-boundaries]] — a module is imported only through its public API.
- [[pages/invariants/domain-layer-purity]] — `domain/` imports no Angular, RxJS or HTTP.
- [[pages/invariants/layer-dependencies-one-way]] — ui to application to domain; infrastructure implements domain ports.
- [[pages/invariants/state-is-signals-first]] — shared state is held in signals; no new `BehaviorSubject` state.
- [[pages/invariants/every-http-request-carries-correlation-id]] — both headers on every request, via the interceptor only.

## Modules

One page per bounded-context module under `src/app/modules/`. The structure every module follows is [[pages/conventions/modular-architecture]]; the map of what is still to come is [[pages/migration/migration-status]].

- [[pages/modules/identity]] — users, roles and the permission catalogue, ported from `mfe-identity-tenant` in Phase 2. Runs entirely on in-memory mock adapters and is the first module to inhabit the architecture; authentication stays shell-owned.

## Incidents

Pages arrive as the project grows.

## Runbooks

Pages arrive as the project grows.

## Roadmap

- [[pages/roadmap/migration-plan|Migration plan]] - the phased sequence (foundation, shell, identity first, module waves) with per-phase exit criteria and user decision checkpoints.

## Decisions (ADRs)

- [[pages/decisions/0001-modular-monolith-architecture]] — **accepted** 2026-08-07. Adopt a modular monolith translated from `kgrzybek/modular-monolith-with-ddd`: shell, shared-kernel, and bounded-context modules layered domain / application / infrastructure / ui, each with a single public API. Includes migrating off native-federation micro-frontends, and keeping every module **extractable** so the split can be reversed later. Cross-module event bus deliberately deferred.
- [[pages/decisions/0002-mock-first-auth-and-data]] — **accepted** 2026-08-07. All data and all auth are mocked this phase: every domain port gets an in-memory implementation bound via DI, so migration proceeds UI-first without waiting on backend contracts. Swapping mock for real is a provider change per port.

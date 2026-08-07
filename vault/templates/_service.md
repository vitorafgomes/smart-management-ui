---
title: "<Service name>"
version: "1.0"
date: YYYY-MM-DD
changes: "Initial service page"
page_type: service
status: stub
description: "<One-sentence responsibility>"
source:
  - <source paths that contributed>
reliability: high
---

# <Service name>

> One-sentence responsibility. If you can't compress it to one sentence, the service is doing too much.

## Responsibility

What this service owns. What it explicitly does NOT own (link the service that does).

## Public contract

- **HTTP routes** — top-level route prefix, or "internal only"
- **Events published** — Service Bus topics/subscriptions this service writes to
- **Events consumed** — inbound events this service subscribes to
- **Direct callers** — other services that call this one via HTTP

## Invariants

Link every [[pages/invariants/*]] this service must preserve. If an invariant doesn't have a page yet, create one (copy `templates/_invariant.md`).

- [[pages/invariants/<name>]] — *one-line summary*
- [[pages/invariants/<name>]] — *one-line summary*

## Hot spots

Code paths that are high-churn, high-complexity, or known-fragile. Cite `file:line`.

- `src/<path>.cs:LINE` — *what's hot about it*
- `src/<path>.cs:LINE` — *what's hot about it*

## Cache footprint

If the service uses tier-2 cache, list the keys:

- `<service>:<entity>(id)` — read by [[pages/...]], invalidated by [[pages/...]]

If none: "None. Not applicable for [reason]."

## Cross-service dependencies

- **Reads from:** [[pages/services/X]] via HTTP; [[pages/services/Y]] via event
- **Written to by:** [[pages/services/Z]]

## Testing footprint

- **Unit tests:** `tests/<service>.Tests/...`
- **Integration tests:** `tests/<service>.Tests/Integration/...` (TestContainers-backed)
- **Invariants verified by tests:** list the invariant pages that have `verified_by:` entries pointing into this service

## Recent activity

Link the [[pages/history/*]] notes that touched this service. Keep the last 5; archive older.

- YYYY-MM — [[pages/history/<slug>]]

## Known violations / P1 debt

If the service has tracked structural debt (violations of conventions, pending refactors), list and link:

- *Description* — tracked in [[pages/roadmap/<initiative>]]

## Ownership

- **Primary:** <person / team>
- **Escalation:** see [[pages/overview/stakeholders]]

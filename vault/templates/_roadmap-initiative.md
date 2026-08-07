---
title: "<Initiative name>"
version: "1.0"
date: YYYY-MM-DD
changes: "Initial initiative page"
page_type: roadmap
status: active            # active | stub | archived when completed or cancelled
description: "<One-sentence goal>"
source:
  - <source paths>
reliability: medium        # roadmap is forward-looking; rarely high reliability
---

# <Initiative name>

> One-sentence goal. What changes in the world when this is done.

## Why now

The forcing function. Why this initiative is being worked on this quarter / this year rather than later.

## Scope

- **In scope:** <bullets>
- **Out of scope:** <bullets — anything that naturally seems adjacent but isn't included>

## Target outcome

Observable, dated. "By <YYYY-MM-DD>, <measurable>."

## Status

*Update this section regularly. Keep it brief.*

- **As of YYYY-MM-DD:** <current state — one paragraph>
- **Next milestone:** <description, target date>
- **Blocker (if any):** <description, owner to unblock>

## Workstreams / phases

Numbered, each with owner and target date.

### Phase 1 — <name>
- **Owner:** <person>
- **Target:** YYYY-MM-DD
- **Status:** not started | in progress | done
- **Scope:** <what's in this phase>
- **Success criteria:** <observable>

### Phase 2 — <name>
...

## Decisions pending

ADRs that need to be made to unblock this work. Link the ADR page (even if only in `proposed` state).

- [[pages/decisions/NNNN-slug]] — *status: proposed*

## Services affected

Link each service this initiative touches:

- [[pages/services/...]]

## Risks

- **Risk:** <description> — **mitigation:** <plan>
- **Risk:** <description> — **mitigation:** <plan>

## History

Link [[pages/history/*]] retrospectives once phases complete.

- YYYY-MM — [[pages/history/<slug>]]

## Related

- ADRs: [[pages/decisions/...]]
- Parent / child initiatives: [[pages/roadmap/...]]

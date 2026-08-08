---
title: "Dependency security"
version: "1.0"
date: 2026-08-08
changes: "Initial supply-chain policy: gate before adding, audit in CI"
page_type: convention
status: active
description: "Supply-chain rules: what it takes for a package to enter the project, and how the dependency tree stays audited."
source:
  - chat
reliability: high
updated: 2026-08-08
---

# Dependency security

Every package is executable third-party code shipped to users or run on developer machines. The user's standing directive: **100% security focus on anything added to the project.** This page is the gate.

## Before adding ANY package

All of these, in order — and the answers go in the PR description of the change that adds the package:

1. **Necessity (Rule C first).** Can ~30 lines of our own code do it? Then no package. The toast system, the pager and the collapse/dropdown behaviors were all written in-repo for exactly this reason.
2. **Provenance.** Official org or known maintainer? Exact npm name verified (typosquatting check — `@angular/…` vs `angular-…`)? Repository link on npm points at the real repo?
3. **Health.** Maintained (commits/releases within the last year), meaningful adoption, no unresolved security issues in its tracker.
4. **Surface.** What does it pull transitively? `npm view <pkg> dependencies` before install; a small helper with 40 transitive deps is not small.
5. **Install scripts.** Does it run `postinstall`/`preinstall`? A package that executes code at install time needs a stronger justification and a read of that script.
6. **Audit after install.** `npm audit` must not report new high/critical findings introduced by the addition.

Runtime dependencies face the full gate. Dev/tooling dependencies face the same gate minus bundle concerns — they run on developer machines and in CI, which is where supply-chain attacks live.

## Standing rules

- **Lockfile is law.** `package-lock.json` is committed, CI installs with `npm ci`, and the lockfile never gets hand-edited.
- **CI audit gate.** `npm audit --omit=dev --audit-level=high` runs in CI and blocks the PR — runtime dependencies with high/critical advisories do not merge. The full audit (dev included) is reviewed when dependabot raises it, not silently.
- **Dependabot PRs are never merged blind.** They only touch `package.json` (no lockfile), so they are consolidated into a branch with a regenerated lockfile and the full gate run — see the Phase 2-era precedent in the repo history. Major bumps wait for their coordinated upgrade.
- **Pinned versions move deliberately.** Upgrades are their own PRs with the gates run, never a side effect of another change.
- **No new package to toggle a class.** The SmartAdmin behaviors are reimplemented with signals precisely to keep `@ng-bootstrap`/`ngx-toastr`-class dependencies out.

## Current runtime surface (2026-08-08)

`@angular/*` (framework), `bootstrap` (sass source for the SmartAdmin theme), `rxjs`, `tslib`, `three` + `vanta` (landing hero animation, lazy-loaded). Known accepted finding: 3 moderate advisories inside `@angular/cli`'s own dependency chain (`@hono/node-server` via `@modelcontextprotocol/sdk`) — dev-only, not shipped, resolved by CLI updates.

## Related

- [[pages/conventions/modular-architecture]] — Rule C, the first gate
- [[pages/conventions/deployment]] — what actually ships
- Root `CLAUDE.md` Rule I — the short form of this page

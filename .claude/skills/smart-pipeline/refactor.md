# Refactor lane

1. **ADR check** - `vault/pages/decisions/*` that established the current shape (Phase 2; until then use root `CLAUDE.md` Rules + code). A refactor contradicting an accepted ADR needs a superseding ADR FIRST, not code.
2. **Capability check** - run the table in SKILL.md gate 1 before the first edit. A refactor that lifts component state into a shared service, moves a call behind a typed HTTP service, converts a route to lazy-loading, or moves validation into a form is **adding a capability** to that surface, and the feature page carries no rules for a capability it did not have.
3. **Behavior lock** - confirm existing specs pin the behavior being restructured; add pinning specs for uncovered branches BEFORE moving code. Exit: a green baseline you can diff against. A refactor with no behavior lock is a rewrite with extra steps.
4. **Restructure** - Rule B per edit; no behavior change. Respect the established layering and folder shape; no new generic abstractions (Rule C) - a base class or shared helper introduced during a refactor still needs more than one real consumer.
5. **Audits (diff-gated)** - template or interaction changes on a user-facing surface -> `accessibility-tester`; bundle size, change-detection or rendering cost -> `performance-engineer`; moved or rewritten specs -> `qa-expert`.
6. **Gates 4-8** from SKILL.md. The full unfiltered `ng test --no-watch` surface green is what proves behavior was preserved; `ng build` with zero warnings catches the dead imports and budget drift a move leaves behind.
7. **Crystallize** - update any vault `file:line` references the refactor moved (grep the vault for the old paths). A capability the surface did not have before is a new entry on its feature page, not just a code change.

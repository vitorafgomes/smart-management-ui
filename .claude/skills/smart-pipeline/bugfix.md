# Bug-fix lane

1. **Vault route** - `vault/pages/features/<feature>.md` -> invariants touching the bug surface -> `vault/pages/incidents/*` for similar past issues (Phase 2; until then use root `CLAUDE.md` Rules + code). If the bug violates a documented invariant, that invariant is the fix target.
2. **Reproduce first** - write the **failing Vitest spec BEFORE the fix**. Exit: a red spec that demonstrates the bug and that fails for the stated reason, not incidentally. Pick the level that actually pins it: pure function or service method for logic; a component spec driving the real template for rendering, binding and event bugs; a spec exercising the route guard or interceptor for navigation and auth bugs. Use `superpowers:systematic-debugging` when the cause is not yet understood - do not guess a fix and confirm it afterwards.
3. **Root cause, then smallest fix** - no surrounding cleanup (Rule C). A bug in a state or HTTP service is validated against the real consumer, not only in isolation: confirm the component that reads it actually recovers.
4. **Audits (diff-gated)** - only if the fix touched an external boundary (`production-readiness-checks`) or a user-facing surface (`accessibility-tester`). A typical small fix runs zero audits.
5. **Gates 4-8** from SKILL.md. The **full** `ng test --no-watch` surface, unfiltered - a bug fix that breaks a sibling spec is not done. Build/test/format runs dispatch to `smart-mechanic`; audits to a sonnet subagent.
6. **Crystallize** - recurring or production bugs get an incident page; a new rule discovered becomes an invariant page.

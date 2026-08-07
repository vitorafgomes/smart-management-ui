# Diagnose / investigate lane

**No edits in this lane.** The deliverable is a cited answer; a fix is a separate task through the bug-fix lane.

1. **Vault first** - `vault/index.md` -> targeted pages up to 2 wikilink hops (Phase 2; until populated the vault is empty - go to source sooner). If the vault answers, stop there.
2. **Source second** - surveys needing >3 queries go to one Explore subagent pinned `model: haiku` (SKILL.md §Token rules - model routing); known-file lookups stay inline.
3. **Method** - use `superpowers:systematic-debugging` for anything with a reproducible wrong behavior: form the hypothesis, find the evidence that would falsify it, then conclude. Do not name a cause you have not seen in the code.
4. **Runtime questions** - when the question is about live behavior rather than code shape, say so explicitly and state what would have to be observed to answer it (a failing spec, a network trace, a console error). Do not start the dev server to find out; that is the human's call.
5. **Answer with citations** - `[[pages/...]]` per claim where a vault page exists, else `file:line`. Distinguish verified facts from hypotheses, and label each. Per Rule D, verify anything you recommend actually exists in the current code before naming it.
6. **Crystallize** - valuable synthesis -> `/wiki-crystallize` (new page or update) + a `log.md` query line.

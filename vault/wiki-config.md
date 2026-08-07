---
blacklist:
  - src/
  - node_modules/
  - .git/
  - bin/
  - obj/
  - dist/
  - build/

index_excludes:
  - raw/
  - archive/
  - ingested/

ingested_folder: ingested

ingested_subdirs:
  - commits
  - prs
  - designs
  - incidents
  - meetings
  - references
  - notes

templates_folder: templates/

log_format: "## [YYYY-MM-DD] {type} | {subject}"
---

## Configuration Guide — Engineering Variant

This is the **project-based** variant of `wiki-config.md`, tuned for software projects rather than personal knowledge. Adjust as needed. Interactive management via `/wiki-config`.

**Path style.** Linux forward slash (`/`). On Windows swap to `\`.

**Wiki root.** The directory containing this file. When this template is instantiated as `project/vault/`, `project/vault/` is the wiki root. Skills derive the root from this file's location — don't add a `wiki_root` field.

**blacklist.** Folders where the wiki must NEVER write. The defaults (`src/`, `node_modules/`, build artifact folders) protect source code and dependencies. Extend with any project-specific no-go zones: secrets folders, legacy code, generated directories.

**index_excludes.** Paths excluded from `index.md`. `raw/` and `ingested/` are source material, not wiki content. `archive/` keeps superseded pages out of the live catalog.

**ingested_folder.** Where `/wiki-ingest` moves processed sources. Must appear in `index_excludes`. Must NOT appear in `blacklist`.

**ingested_subdirs.** Source-type taxonomy. The engineering variant defaults to:

- `commits` — curated commit diffs worth filing (not every commit).
- `prs` — PR descriptions for nontrivial changes.
- `designs` — design docs / RFCs / technical proposals.
- `incidents` — postmortems and incident reports.
- `meetings` — meeting notes worth preserving.
- `references` — external docs (framework specs, vendor docs, third-party API behavior).
- `notes` — freeform captures that don't fit elsewhere.

`ingested/assets/` is always created automatically; it holds unreadable or unextractable files (binary PDFs, images without OCR, etc.).

Adapt `ingested_subdirs` to your workflow. If you want separate buckets for "code-reviews" vs "prs" or "vendor-specs" vs "framework-docs", add them. Keep the list small — classification is cheaper with fewer bins.

**templates_folder.** Holds page templates (`_service.md`, `_adr.md`, etc.). Currently used by humans + Claude when writing pages manually; the vanillaflava skills reserve this folder for a future page-template system. Safe to leave as-is.

**log_format.** Format string for `log.md` entries. Do not change without updating all wiki skills.

**Property type conflict warning.** Some note-taking apps infer a type for each frontmatter property. If a property name conflicts with something elsewhere in your vault or plugin, rename here and inform Claude.

**For interactive setup, validation, and reconfiguration:** run `/wiki-config`. Direct edits to this file are equally valid.

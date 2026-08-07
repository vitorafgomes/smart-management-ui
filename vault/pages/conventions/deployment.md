---
title: "Deployment convention"
version: "1.0"
date: 2026-08-07
changes: "Initial Cloudflare Workers static asset deployment convention"
page_type: convention
status: active
description: "Deployment is exclusively Cloudflare Workers static assets via Workers Builds on push to main, configured by wrangler.jsonc."
source:
  - chat
reliability: high
updated: 2026-08-07
---

# Deployment convention

**Deployment is exclusively Cloudflare Workers static assets.** No Docker, no Kubernetes, no nginx gateway, no container registry.

`wrangler.jsonc` exists in the repo root today; the build and deploy pipeline described below is the target.

## The pipeline

```
push / merge to main
  -> Workers Builds picks up the commit (Cloudflare git integration)
  -> install dependencies + build          (npm run build -> ng build)
  -> npx wrangler deploy                   (uploads ./dist/smart-management-ui/browser)
  -> verify the live site
```

Four properties worth stating explicitly:

- **The trigger is a push to `main`.** There is no manual deploy step and no separate release job. Merging is deploying, which means `main` must always be releasable.
- **Workers Builds runs it, not GitHub Actions.** This repo has no `.github/workflows/`, and that is deliberate - the build lives in Cloudflare's git integration. Do not add a deploy workflow alongside it; two systems deploying the same app is how they diverge.
- **`NODE_VERSION=24.19.0`** is set in the Workers Builds environment, matching the local nvm version the root `CLAUDE.md` pins. A build that passes locally on a different Node than the one CI uses is a trap worth not setting.
- **Verify the live site after a deploy.** A green build means the assets uploaded, not that the app boots. The Playwright smoke suite in [[pages/conventions/testing]] is the automated form of this; until it exists, load the site.

## wrangler.jsonc is the single source of deploy config

The repo root holds `wrangler.jsonc`:

- `name` - the Worker name
- `compatibility_date` - pinned; bump deliberately, never incidentally
- `observability.enabled` - Workers observability on
- `assets.directory` - `./dist/smart-management-ui/browser`, the Angular application builder's output
- `assets.not_found_handling` - `single-page-application`, so a deep link like `/administration/users` serves `index.html` instead of 404ing

That last setting is what makes client-side routing work on a real server, and it is the reason the deep-link assertion is in the E2E smoke suite: it is a deploy-config property that no unit test can observe.

**Never let wrangler auto-generate or rewrite this file.** Commands that offer to scaffold or "fix" config will happily replace a reviewed file with defaults - which loses the SPA fallback and points `assets.directory` somewhere plausible and wrong. The file is reviewed, committed, and edited by hand.

If `assets.directory` and the Angular `outputPath` ever disagree, the deploy uploads nothing useful and still reports success. Changing one means changing the other in the same commit.

## What is deliberately absent

Retired with the micro-frontend architecture, not missing. Detail in [[pages/migration/migration-status]]:

- Docker - the legacy root `Dockerfile`, `docker-compose.yml` and the `docker/` directory (including the nginx gateway config)
- Helm and Kubernetes - the legacy `helm/` values and `deploy.sh`
- Container CI - the legacy `docker-build-local.yml` and the container stages of its `ci.yml`
- The standalone `cloudflare-worker/` project - assets are served directly from this repo's `wrangler.jsonc`

The legacy app needed all of it because nineteen independently deployed remotes need somewhere to be deployed to and something to front them. One application built to one static-asset bundle needs a `wrangler.jsonc`. That simplification is part of the decision in [[pages/decisions/0001-modular-monolith-architecture]], not an unrelated tooling preference.

If a requirement appears that genuinely needs server-side execution, that is an ADR, not a quiet reintroduction of a container.

## Before merging to main

Because merging deploys, the per-edit gates in [[pages/conventions/testing]] are the release gate:

1. `ng build` - zero errors **and** zero warnings, including bundle budgets
2. `ng test --no-watch` - fully green, no filtering
3. `npx prettier --check` - clean on every touched file
4. E2E smoke, once Playwright lands

## Enforcement (planned)

- **`wrangler.jsonc` is committed and reviewed**; changes to `assets.directory`, `not_found_handling` or `compatibility_date` are called out in the PR description rather than slipping through as config noise.
- **A CI check that `assets.directory` matches the Angular `outputPath`**, so the two cannot drift silently.
- **The Playwright smoke suite** runs against the built app, covering boot, deep-link and error-state behaviour before merge.
- **No `.github/workflows/` deploy job** - if one appears, that is the drift to catch in review.

## Related

- Architecture this simplification follows from: [[pages/decisions/0001-modular-monolith-architecture]]
- What is not being ported: [[pages/migration/migration-status]]
- Legacy deployment surface: [[pages/migration/legacy-source-overview]]
- Gates: [[pages/conventions/testing]]

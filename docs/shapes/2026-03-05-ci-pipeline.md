# Shape: CI Pipeline

**Status**: idea
**Date**: 2026-03-05
**Appetite**: small (1 session)

## Problem

There is no automated CI. Nothing runs lint or build on pull requests — broken code can be merged undetected. The `npm run test` script exists (format + lint + dual build) but only runs manually.

## Solution sketch

- Add `.github/workflows/ci.yml` that runs on every PR targeting `main`.
- Steps: checkout → install → `npm run lint` → `SERVER=static npm run build`.
- Optionally: add `npm run docs:inventory` to catch stale `list-*` files.
- Mark as required check in GitHub branch protection.

## Rabbit holes

- The dual build (`SERVER=static` + `SERVER=preview`) requires CDA tokens — use Vercel preview tokens as GitHub secrets or skip the `preview` build in CI and only validate `static`.
- `npm run prebuild` (esbuild bundles) must run before `astro build` — already wired in `package.json` but verify the CI order.

## No-gos

- No E2E tests in CI for now — just lint + build.
- No deployment from CI — Vercel handles that.

## Slices

- [ ] TC1: Add `.github/workflows/ci.yml` with lint + static build
- [ ] Add `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` as GitHub Actions secret
- [ ] Optionally add `docs:inventory` step
- [ ] Update `docs/guidelines/testing.md`

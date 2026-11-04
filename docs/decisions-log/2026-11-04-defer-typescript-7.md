---
kind: deferral
status: open
resolved_by: null
work: upgrade-2026-11
area: dependencies
touches: [package.json, tsconfig.json]
description: "Upgrade to TypeScript 6.0.3 and defer TypeScript 7 (native compiler) until @astrojs/check supports it; astro check is part of the gate."
---

# Upgrade to TypeScript 6.0.3 and defer TypeScript 7

**Date**: 2026-11-04

## The decision

Upgrade TypeScript to 6.0.3 (latest 6.x) and defer TypeScript 7 (native compiler, 7.0.2 latest on 2026-11-04).

## Context

The 2026-11 dependency upgrade wanted every library on its latest stable. The build runs `astro check && astro build`; @astrojs/check (latest) declares peer `typescript ^5.0.0 || ^6.0.0`, so TypeScript 7 is outside its supported range.

## Why deferred

astro check is part of the gate; with TS 7 it is unsupported, so the type-check speed TS 7 brings would be lost exactly where the project uses it. TS 6 keeps the gate supported.

## Consequences

The project stays one TypeScript major behind. TS 6 deprecations must be cleared now so the later step to 7 is small.

## Reopen when

@astrojs/check (or @astrojs/language-server) declares support for typescript ^7.

## References

- docs/work/2026-11-04-upgrade-2026-11/slices.md (Out of scope, V3)

## Status log

- 2026-11-04 — recorded

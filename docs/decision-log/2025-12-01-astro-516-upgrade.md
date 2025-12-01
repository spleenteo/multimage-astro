---
agent_edit: true
---

# Upgrade to Astro 5.16.3

**Raised the framework to Astro 5.16.3 to adopt 5.16 features and ship the patched SSR path decoding fix.** citeturn0search0turn1search1

- Date: 2025-12-01
- Alternatives Considered:
  - Stay on Astro 5.15 until CI work finishes (would miss the security patch and opt-in SVG optimizations).
  - Jump directly to nightly builds (higher breakage risk for editors before holidays).

## Decision

- Use Astro 5.16.3 (latest patch) across static and preview builds so both runtimes include the double-encoded path guard. citeturn1search1
- Keep the new `experimental.svgo` flag disabled until SVG/icon regressions are ruled out; track validation in docs/TODO.md. citeturn0search0
- Record test status in `docs/testing.md` and dependency inventory in `docs/dependencies.md`.

## Consequences

- Editors and visitors benefit from the upstream security fix without waiting for the next sprint.
- We need a short follow-up test pass that exercises SSR path handling and, separately, an evaluation of the opt-in SVG optimizer before enabling it in `astro.config.mjs`.
- Future upgrades can build on the 5.16 baselines; any regressions should be logged against this decision.

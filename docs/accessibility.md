---
agent_edit: true
scope: Living record of Multimage accessibility coverage and gaps
---

# Accessibility — Current State (2025-11-16)

- Pages use semantic landmarks through `BaseLayout.astro`, but there is still no skip link or outlined landmark focus state (tracked in docs/TODO.md task **A11Y2**).
- Component catalogue relies heavily on Structured Text rendered via `@datocms/astro/StructuredText`; interactive blocks (search form, BookCarouselSection, staff tables) expose ARIA labels but have not been validated with screen readers yet (see **A11Y1**).
- Focus management for modal-like experiences (none today) is not implemented; editors rely on page-level reloads triggered by DraftModeQueryListener.
- Color contrast follows the Tailwind theme defined in `tailwind.config.mjs`, which reuses Multimage’s palette; no automated contrast audit has been run since 2025-11-01.
- Keyboard testing to date has been ad-hoc via local dev builds; there is no Playwright/Cypress suite to prevent regressions.

Refer to `/docs/guidelines/accessibility.md` for non-negotiable policies and testing procedures. Update this file whenever new audits finish or regressions are discovered.

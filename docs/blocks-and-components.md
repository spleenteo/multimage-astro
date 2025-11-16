---
agent_edit: true
scope: Inventory status for CMS blocks and UI components
---

# Blocks & Components — Current State (2025-11-16)

- CMS-driven blocks map to files under `src/components/blocks/**` (e.g., `BannerSection`, `PillsBlock`, `CtaButtonWithImageBlock`). Each block pairs with a `_graphql.ts` fragment collocated with its consumer page.
- Structured Text renders through `src/components/datocms/structuredText/*`; `LinkToRecord.astro` still needs a `/magazine/${slug}` fix (docs/TODO.md **PS2**).
- UI primitives such as `Button`, `Card`, `SectionIntro`, and `BookCarouselSection` live under `src/components/ui` and expect Tailwind utility classes—no component library dependency is present.
- Draft-mode specific UI (`DraftModeQueryListener`) sits under `src/components` and is conditionally rendered based on the cookie helper in `~/lib/draftPreview`.
- Component props are generally typed via adjacent `_graphql.ts` helpers; no Storybook or visual docs exist yet.

For naming conventions and authoring rules, consult `/docs/guidelines/blocks-and-components.md`.

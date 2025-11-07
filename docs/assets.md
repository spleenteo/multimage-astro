---
agent_edit: true
scope: How Fastro uses Icons, Fonts and digital assets in general
---

# Assets

## Fonts

Fastro uses free Google font as base. Family fonts are defined within Tailwind config

## Icons

Use the Ico wrapper component from ~/components/Ico whenever you render an icon.
It automatically prefixes bare names with the default Iconify set (iconoir),
applies the shared sizing classes, and sets sensible a11y attributes—so
<Ico name="nav-arrow-right" /> outputs the iconoir:nav-arrow-right glyph,
while <Ico name="mdi:github" label="GitHub" /> renders an explicit icon with
an accessible label.

## Images from DatoCMS

Use the ResponsiveImage component from ~/components/ResponsiveImage to render
media coming from DatoCMS. Include the shared ResponsiveImageFragment in your
GraphQL query, pass the returned responsiveImage field straight to
<ResponsiveImage data={record.asset.responsiveImage} />, and the component
will hydrate the DatoCMS <Image /> helper with the correct Imgix parameters, alt
text, and responsive sizes out of the box.

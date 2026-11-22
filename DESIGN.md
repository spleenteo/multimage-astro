---
name: Multimage
description: La casa editrice dei diritti umani. Books on nonviolence and human rights, shown the way a bookshop window shows them.
colors:
  brand-navy: "#004881"
  brand-navy-light: "#005192"
  brand-navy-lighter: "#f3f4f6"
  brand-orange-deep: "#b84f00"
  brand-crimson: "#ae0e0e"
  brand-orange: "#fa7810"
  brand-sky: "#088af2"
  brand-charcoal: "#343434"
  brand-slate: "#6c757d"
  brand-mist: "#f2f4f6"
  brand-sand: "#f4f4f4"
  page-white: "#ffffff"
  hairline: "#e5e7eb"
  cover-field-fallback: "#e8eef5"
  social-instagram: "#c13584"
  social-facebook: "#4267b2"
  social-newsletter: "#2e7d32"
typography:
  display:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
  headline:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
  title:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-large:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: "1.75rem"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "0em"
  caption:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  gutter: "24px"
  lg: "32px"
  section: "48px"
  section-wide: "64px"
  tap-target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange-deep}"
    textColor: "{colors.page-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 20px"
    height: "{spacing.tap-target}"
  button-primary-hover:
    backgroundColor: "{colors.brand-crimson}"
    textColor: "{colors.page-white}"
  button-secondary:
    backgroundColor: "{colors.brand-mist}"
    textColor: "{colors.brand-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 20px"
    height: "{spacing.tap-target}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.brand-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 20px"
    height: "{spacing.tap-target}"
  home-door:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-charcoal}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "32px 32px"
  home-door-hover:
    backgroundColor: "{colors.brand-mist}"
    textColor: "{colors.brand-charcoal}"
  header-nav-tab:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.page-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  footer:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.brand-mist}"
    typography: "{typography.caption}"
  newsletter-cta:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
---

# Design System: Multimage

## Overview

**Creative North Star: "The Bookshop Window"**

Multimage shows real books at the size a shop window gives them. The cover is the colour source: each featured book sits on a full-width field tinted from its own cover, tilted a few degrees, throwing a shadow in a darker shade of the same hue. Everything around it stays quiet and institutional: a navy frame (header, footer, newsletter band), white reading surfaces, Playfair Display titles in navy, Inter for everything a reader acts on.

The system is flat and square. Every corner resolves to 0px at the token level, depth comes from tone (navy frame, white page, mist hover, cover-tinted fields) and from the one soft navy shadow, never from stacked cards. One action colour, a deep burnt orange, carries the primary step on any surface; links and secondary steps stay navy.

The voice is a volunteer publisher's, not a store's: proof is the book itself (cover, title, author, price, ways to get it), not badges or invented numbers.

**Key Characteristics:**
- Cover-tinted fields derived from each image's own DatoCMS colours.
- Square corners everywhere (0px radius, enforced in the theme).
- Navy frame, white page, deep orange for the one primary action.
- Playfair Display headings in navy over Inter text in charcoal.
- 44px minimum tap targets on every interactive element.

## Colors

A restrained navy-and-white publisher's palette with one burnt-orange action colour, plus a per-book colour borrowed from each cover.

### Primary
- **Publisher Navy** (brand-navy): the identity colour. Header top bar, main navigation band, footer, newsletter band, every heading, author and in-text links on the reference surfaces, the default focus outline. 9.36:1 on white.
- **Deep Window Navy** (brand-navy-light): the logo and search band of the header; the hover fill of header dropdown items.

### Secondary
- **Burnt Action Orange** (brand-orange-deep): the fill of the one primary action per block ("Scopri il libro") and of "Diventa socio". White text on it is 5.05:1.
- **Pressed Crimson** (brand-crimson): hover state of the orange action only. Not a decorative or error colour in the current build.

### Tertiary
- **Cover Tint** (derived, no fixed value): computed per image by `pickBaseColor` (first of the image's top three DatoCMS colours, fallback cover-field-fallback) then `lightenColor` / `darkenColor`. Cover field = base lightened 16%; the hero's text half = base lightened 88%; the cover's drop shadow = base darkened 45% at 45% alpha; a banner's own button = base darkened 30%. Used by HomeHero, FeaturedBookHighlight, BookCard and BannerSection.
- **Sky** (brand-sky): decorative only: carousel active bullet, arrow-button hover fill, blockquote rule and tints (`/10`–`/30`), `mark` and selection backgrounds. Never text and never a fill behind text (3.54:1 on white). Decided 2026-11-22: links are navy (see Navy Links).
- **Navy Links:** a bare `<a>` is `brand-navy`. Links inside running text (`p`, `blockquote`, `dd`, `td`, `figcaption`) are also underlined, because navy sits only 1.6:1 from charcoal body text (WCAG 1.4.1); component links keep their own styling. Hover feedback is an underline, not a colour shift.
- **Signal Orange** (brand-orange): decoration only, never under text (white on it is 2.7:1).

### Neutral
- **Charcoal Ink** (brand-charcoal): body text, subtitles, door descriptions. 12.45:1 on white.
- **Quiet Slate** (brand-slate): placeholders and secondary meta. 4.69:1 on white, the lightest grey allowed for text.
- **Page White** (page-white): the `<main>` reading surface and the doors strip.
- **Mist** (brand-mist): hover fill of doors, secondary button fill, hairline dividers between home sections.
- **Shelf Grey** (brand-navy-lighter): the full-width band behind book carousels.
- **Sand** (brand-sand): the `<body>` colour, visible only outside `<main>`.
- **Hairline** (hairline): the default border colour.
- **Social colours** (social-instagram, social-facebook, social-newsletter): only on the header's top-bar links to those channels, each with white text (all above 5:1).

### Named Rules
**The Cover Is the Colour Rule.** A book's surface takes its colour from its own cover through `src/lib/colors.ts`; never pick a decorative hue for a book block by hand.

**The One Orange Rule.** Burnt Action Orange marks the single primary action of a block. Secondary actions are mist with navy text; further ways are navy underlined links.

**The White-on-Orange-Deep Rule.** White text sits on brand-orange-deep, never on brand-orange.

## Typography

**Display Font:** Playfair Display (with Times New Roman, serif)
**Body Font:** Inter (with system-ui, -apple-system, Segoe UI, sans-serif)

**Character:** A literary serif for what is published (titles, prices, section names) against a plain sans for what the reader does. All h1-h6 are Playfair semibold navy by default, line-height 1.25.

### Hierarchy
- **Display** (600, 2.25rem mobile / 3rem from 768px, line-height 1 at 3rem): the hero book title. `text-balance`.
- **Headline** (600, 1.875rem, 2.25rem): default h2 and section titles (carousel title goes to 2.25rem from 768px). The page h1 in the home's slim intro row is 1.25rem mobile / 1.875rem desktop, deliberately quieter than the book title.
- **Title** (600, 1.5rem, 2rem): door titles, book card titles, the closing about heading, and the price shown as a serif figure.
- **Body** (400, 1rem / 1.625 mobile; 1.125rem / 1.75rem from 768px): every `<p>`. Summaries cap at 60ch and clamp to two lines in the hero.
- **Label** (600, 0.875rem, uppercase, tracking 0): buttons and the "Sfoglia il catalogo" link. The theme sets `tracking-wide` / `tracking-wider` to 0em, so labels are not letter-spaced.
- **Caption** (400, 0.875rem, 1.25rem): door descriptions, secondary links, footer links (footer legal line at 0.75rem).

### Named Rules
**The Title Is the Heading Rule.** Nothing sits stacked above a heading: no kicker, eyebrow or tag line. Context goes below the title (subtitle, author) or into a caption ("Il libro del momento" is a figcaption under the cover).

**The Serif Is for Published Things Rule.** Playfair carries titles and prices; actions, meta and navigation stay in Inter.

## Layout

A single 1200px container (gutter 24px each side, full width below 640px) inside a white `<main>` padded 48px top and bottom (64px from 768px). Home sections stack with a 48px rhythm; CMS blocks below the fixed top stack at 40px.

Signature surfaces break the container full-bleed (negative margins to the viewport edge) and cancel the main's top padding so they sit flush under the header. The hero is a two-column grid from 768px (text left, cover field right, cover field min-height 34rem); on mobile the cover comes first and the text follows. The text column's left edge aligns with the container's left edge on wide screens.

Wayfinding strips are equal columns divided by mist hairlines (three doors at 768px+, stacked with horizontal dividers on mobile). Breakpoint used by the reference surface: 768px; header switches to the mobile menu below it. Every interactive element reaches 44px in height on mobile; inline secondary links may drop to text height from 768px.

## Elevation & Depth

Mostly flat, with tonal layering doing the work: navy frame, white page, mist hover, grey shelf band, cover-tinted fields. Two shadows exist and both are soft.

### Shadow Vocabulary
- **Soft navy lift** (`box-shadow: 0 18px 45px rgba(0, 72, 129, 0.08)`): header, filled buttons, book cards at rest. Ambient, never structural.
- **Cover drop shadow** (`filter: drop-shadow(24px 36px 48px <cover base darkened 45% at 45% alpha>)`): only on a book cover sitting on its tinted field. It follows the cover's silhouette and hue.

### Named Rules
**The Only the Book Floats Rule.** The cover is the one object allowed to cast a strong, coloured shadow and to tilt (4deg hero, 5deg featured block). Containers stay flat.

## Shapes

Square. The theme resets every Tailwind radius step, `--radius-full` included, to 0px, so any `rounded-*` utility renders a square corner; the header tabs, carousel arrows and bullets that still carry `rounded-full` in markup render square. Forms are rectangles: buttons, doors, fields, bands. The only non-rectangular silhouette is a tilted book cover. Borders are 1px hairlines in mist or translucent white on navy, used as dividers rather than as card outlines.

## Components

### Buttons
Plain, upright and loud only once per block.
- **Shape:** square corners (0px), minimum height 44px.
- **Primary:** burnt action orange fill, white uppercase label, 8px 20px padding, soft navy lift.
- **Hover / Focus:** primary turns crimson. Focus uses the global 3px outline offset 2px (navy on light surfaces, white inside header and footer).
- **Secondary:** mist fill, navy label, same shape; hover lightens the mist. Optional 16px Iconoir icon after the label.
- **Ghost:** no fill, navy label, mist on hover.

### Book Cover Field (signature)
The hero and featured-book blocks: a full-width field in the cover's own tint (lightened 16%), the cover tilted and casting its coloured drop shadow; in the hero the text half carries a much paler tint (lightened 88%) of the same hue so the band reads as one field. Text on the pale half is navy title, charcoal body, serif price, then actions.

### Doors (wayfinding strip)
Three equal white cells under the hero, separated by mist hairlines. Each: Playfair navy title over a short charcoal description, a navy Iconoir arrow on the right that nudges 4px on hover; the cell fills mist and the title underlines on hover. Focus outline is drawn 4px inside the cell.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** white, or the cover tint on the cover panel.
- **Shadow Strategy:** soft navy lift at rest (see Elevation).
- **Border:** none; a 1px navy-at-5% ring on book cards.

### Navigation
- **Header:** three navy bands: a top bar of channel links (social colours, white text, uppercase 0.75rem), the logo and search band in deep window navy, the main tabs on navy (uppercase Inter semibold, 1px translucent white border, square). Dropdowns are navy panels with divided rows. Focus ring is white throughout. Below 768px a full-screen navy menu replaces the tabs.
- **Footer:** navy, mist text, white on hover and focus, white focus ring, mist-at-10% squares behind social icons (44px).

### Inline links on the reference surface
Navy, underlined with 2px offset, semibold where they name a person. On light and tinted surfaces they set hover and focus to navy explicitly; on dark or coloured surfaces they must set `hover:text-white` and `focus:text-white`, because a compatibility rule turns any hovered or focused link navy.

## Do's and Don'ts

### Do:
- **Do** derive a book block's colours from its cover through `pickBaseColor`, `lightenColor` and `darkenColor` in `src/lib/colors.ts`.
- **Do** keep corners square; rely on the theme's 0px radius rather than adding literal radii.
- **Do** use brand-orange-deep for the one primary action and navy underlined links for further ways.
- **Do** give every interactive element at least 44px of height on touch screens.
- **Do** set `[--focus-ring:var(--color-white)]` on dark surfaces and `hover:text-white focus:text-white` on links inside them.
- **Do** put context under a title (subtitle, author, caption), never above it.

### Don't:
- **Don't** put white text on brand-orange (#fa7810); it is 2.7:1.
- **Don't** use brand-sky for text or behind white text; it is decorative only.
- **Don't** stack a kicker, eyebrow or tag label above a heading.
- **Don't** add literal border radii (`rounded-[2rem]`, `border-radius: 9999px`); they bypass the square theme.
- **Don't** add `focus:outline-hidden` with a private ring; the global `:focus-visible` outline is the one indicator.
- **Don't** tilt or shadow anything but a book cover.

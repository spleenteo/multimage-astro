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
  button-secondary-outline:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "{spacing.tap-target}"
  button-secondary-outline-hover:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.page-white}"
  button-navy:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.page-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.tap-target}"
  button-navy-hover:
    backgroundColor: "{colors.brand-navy-light}"
    textColor: "{colors.page-white}"
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
  section-tab:
    backgroundColor: "{colors.brand-mist}"
    textColor: "{colors.brand-charcoal}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "{spacing.tap-target}"
  section-tab-active:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.page-white}"
  filter-chip:
    backgroundColor: "{colors.brand-mist}"
    textColor: "{colors.brand-navy}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "0 12px"
  filter-chip-hover:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.page-white}"
  text-field:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-charcoal}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "{spacing.tap-target}"
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
- **Cover Tint** (derived, no fixed value): computed per image by `pickBaseColor` (first of the image's top three DatoCMS colours, fallback cover-field-fallback) then `lightenColor` / `darkenColor`. Cover field = base lightened 16%; the hero's text half = base lightened 88%; the cover's drop shadow = base darkened 45% at 45% alpha; a banner's own button = base darkened 30%. Used by HomeHero, FeaturedBookHighlight, BookCard and BannerSection. BookCard has its own steps: field = base lightened 18% (default) or 55% (`catalogue` variant, so a grid of dozens keeps the hue without turning into wallpaper); cover shadow = base darkened 55% at 42% alpha (32% in the catalogue).
- **Sky** (brand-sky): decorative only: carousel active bullet, arrow-button hover fill, blockquote rule and tints (`/10`–`/30`), `mark` and selection backgrounds. Never text and never a fill behind text (3.54:1 on white). Decided 2026-11-22: links are navy (see Navy Links).
- **Navy Links:** a bare `<a>` is `brand-navy`. Links inside running text (`p`, `blockquote`, `dd`, `td`, `figcaption`) are also underlined, because navy sits only 1.6:1 from charcoal body text (WCAG 1.4.1); component links keep their own styling. Hover feedback is an underline, not a colour shift.
- **Signal Orange** (brand-orange): decoration only, never under text (white on it is 2.7:1).

### Neutral
- **Charcoal Ink** (brand-charcoal): body text, subtitles, door descriptions. 12.45:1 on white.
- **Quiet Slate** (brand-slate): placeholders and secondary meta: the book card's meta line, facet counts, the catalogue's size line, notes under a link, and facet options with no matching books. 4.69:1 on white, the lightest grey allowed for text.
- **Page White** (page-white): the `<main>` reading surface and the doors strip.
- **Mist** (brand-mist): hover fill of doors, secondary button fill, hairline dividers between home sections, filter chips and the catalogue's empty-state panel.
- **Shelf Grey** (brand-navy-lighter): the full-width band behind book carousels.
- **Sand** (brand-sand): the `<body>` colour, visible only outside `<main>`.
- **Hairline** (hairline): the default border colour. Dividers inside white reading surfaces (facet groups, the catalogue toolbar, the not-found list) are navy at 10%; field borders are navy at 25%.
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
- **Headline** (600, 1.875rem, 2.25rem): default h2 and section titles (carousel title goes to 2.25rem from 768px). The page h1 in the home's slim intro row is 1.25rem mobile / 1.875rem desktop, deliberately quieter than the book title. The catalogue's title row h1 is 1.875rem / 2.25rem from 768px; the not-found h1 is 2.25rem / 3rem.
- **Title** (600, 1.5rem, 2rem): door titles, book card titles (1.25rem in the catalogue card, 1rem on phones), the closing about heading, the catalogue's result count and empty-state title (h2/h3, 1.5rem), and the price shown as a serif figure (1.25rem on cards). Figures in Playfair use lining numerals (`lining-nums`); counts that update also use tabular figures.
- **Body** (400, 1rem / 1.625 mobile; 1.125rem / 1.75rem from 768px): every `<p>`. Summaries cap at 60ch and clamp to two lines in the hero.
- **Label** (600, 0.875rem, uppercase, tracking 0): buttons and the "Sfoglia il catalogo" link. The theme sets `tracking-wide` / `tracking-wider` to 0em, so labels are not letter-spaced. Facet legends and text-link actions ("Azzera", "Tutte le collane (n)") are sentence case, semibold, not uppercase.
- **Caption** (400, 0.875rem, 1.25rem): door descriptions, secondary links, footer links (footer legal line at 0.75rem), the book card's meta line, facet option labels and field text. Facet counts are 0.75rem slate tabular figures.

### Named Rules
**The Title Is the Heading Rule.** Nothing sits stacked above a heading: no kicker, eyebrow or tag line. Context goes below the title (subtitle, author) or into a caption ("Il libro del momento" is a figcaption under the cover).

**The Serif Is for Published Things Rule.** Playfair carries titles, prices and the size of the catalogue (the slate size line under the h1, the result count); actions, meta and navigation stay in Inter.

## Layout

A single 1200px container (gutter 24px each side, full width below 640px) inside a white `<main>` padded 48px top and bottom (64px from 768px). Home sections stack with a 48px rhythm; CMS blocks below the fixed top stack at 40px.

Signature surfaces break the container full-bleed (negative margins to the viewport edge) and cancel the main's top padding so they sit flush under the header. The hero is a two-column grid from 768px (text left, cover field right, cover field min-height 34rem); on mobile the cover comes first and the text follows. The text column's left edge aligns with the container's left edge on wide screens.

Wayfinding strips are equal columns divided by mist hairlines (three doors at 768px+, stacked with horizontal dividers on mobile). Breakpoint used by the reference surface: 768px; header switches to the mobile menu below it. Every interactive element reaches 44px in height on mobile; inline secondary links may drop to text height from 768px.

The faceted catalogue (`/libri`) uses a third breakpoint, 64rem (1024px): from there a 15rem facet column sits beside the results with a 48px gap and flows with the page (no inner scroll); below it the column becomes a bottom sheet. The book grid is two columns on phones (12px column gap, 20px row gap), three from 768px, two beside the facet column at 1024px, three from 1280px (24px gaps from 640px). A surface's title row stays slim: h1, one serif size line, the CMS lede (hidden under 640px so the first covers reach the first viewport).

## Elevation & Depth

Mostly flat, with tonal layering doing the work: navy frame, white page, mist hover, grey shelf band, cover-tinted fields. Two shadows exist and both are soft.

### Shadow Vocabulary
- **Soft navy lift** (`box-shadow: 0 18px 45px rgba(0, 72, 129, 0.08)`): header, filled buttons, book cards at rest. Ambient, never structural.
- **Cover drop shadow** (`filter: drop-shadow(24px 36px 48px <cover base darkened 45% at 45% alpha>)`): only on a book cover sitting on its tinted field. It follows the cover's silhouette and hue. Book cards use a smaller one (`drop-shadow(18px 26px 32px ...)`, see Cover Tint).
- **Sheet lift** (`box-shadow: 0 -18px 45px rgba(0, 72, 129, 0.16)`): the soft navy lift turned upward, only on the catalogue's filter sheet when it rises over the page; the page behind it takes a navy backdrop (`rgba(0, 39, 70, 0.45)`).

### Named Rules
**The Only the Book Floats Rule.** The cover is the one object allowed to cast a strong, coloured shadow and to tilt (4deg hero, 5deg featured block). Containers stay flat. On a book card only the cover moves on hover (rises 6px, 300ms ease-out, motion-safe); the card itself does not lift.

## Shapes

Square. The theme resets every Tailwind radius step, `--radius-full` included, to 0px, so any `rounded-*` utility renders a square corner; the header tabs, carousel arrows and bullets that still carry `rounded-full` in markup render square. Forms are rectangles: buttons, doors, fields, bands. The only non-rectangular silhouette is a tilted book cover. Borders are 1px hairlines in mist, navy at 10%, or translucent white on navy, used as dividers rather than as card outlines; form fields are the one bordered rectangle (1px navy at 25%).

## Components

### Buttons
Plain, upright and loud only once per block.
- **Shape:** square corners (0px), minimum height 44px.
- **Primary:** burnt action orange fill, white uppercase label, 8px 20px padding, soft navy lift.
- **Hover / Focus:** primary turns crimson. Focus uses the global 3px outline offset 2px (navy on light surfaces, white inside header and footer).
- **Secondary:** mist fill, navy label, same shape; hover lightens the mist. Optional 16px Iconoir icon after the label.
- **Outlined secondary:** white fill, navy uppercase label, 1px navy-at-15% ring, soft navy lift; hover fills navy with white text. Used for "Mostra altri n" under the catalogue grid and, without the lift, on the mist empty-state panel.
- **Navy:** solid navy, white uppercase label, hover deep window navy. For utility controls that are not the surface's primary: the catalogue's mobile "Filtri" button (with active count) and the header's "Cerca" submit on the deep navy search band.
- **Ghost:** no fill, navy label, mist on hover.

### Chips
- **Style:** active filter chips on mist, navy text (0.875rem), square, label then a 14px stroked close mark; the whole chip removes its filter and is labelled "Togli il filtro ...".
- **State:** hover fills navy with white text. An "Azzera filtri" navy underlined text link follows the row.

### Inputs / Fields
- **Style:** white rectangle, 1px navy-at-25% border, charcoal text, slate placeholder, 44px high (40px from 1024px). Selects share it; "Ordina per" is a slate label beside the select.
- **Focus:** the global outline. When the input sits inside a composed field (the catalogue search with its leading icon), the outline is drawn on the wrapping label (`:has(:focus-visible)`), not on the bare input.
- **Notes:** status text under a field is slate 0.875rem with an inline navy underlined action.
- **Checkbox / radio rows:** native controls tinted navy (`accent-color`), 18px, in rows 44px high on touch and 32px from 1024px; the label underlines navy on hover and turns semibold navy when checked; the count sits right-aligned.

### Book Cover Field (signature)
The hero and featured-book blocks: a full-width field in the cover's own tint (lightened 16%), the cover tilted and casting its coloured drop shadow; in the hero the text half carries a much paler tint (lightened 88%) of the same hue so the band reads as one field. Text on the pale half is navy title, charcoal body, serif price, then actions. The palette comes from `coverFieldPalette` in `src/lib/colors.ts`.

### Book Page (`/libri/[slug]`)
The book's own page opens with the Book Cover Field, full-bleed and flush under the header: text half left (7fr), cover field right (5fr); on phones the cover comes first, capped at `min(15rem, 36svh)`, so title, price and the order reach the first screen. The text half carries, in order:
- the h1 title and subtitle;
- the byline ("di" / "a cura di", names as navy links);
- the meta line (Collana *link* · anno · formato · Fuori catalogo);
- the promo line in italic;
- the price as a Playfair figure;
- the actions.

There is no cart, so the primary action is "Ordina via email": a `mailto:` prefilled with the book (`buildOrderMailto`). The ebook is one white secondary button, "Ebook 2,99 € su Bookrepublic", with an external icon. Under the actions sits one charcoal line, "Spedizione gratuita con piego di libri · Soci: 30% di sconto", followed by two navy links, "Trovalo in libreria" and "Come funziona l'ordine". An out-of-catalogue edition says so in a sentence. When a newer print edition exists, the primary action becomes "Vai alla nuova edizione". Below the hero sits one flat reading column (max 4xl, prose at 68ch), with sections divided by hairlines and left-aligned serif h2s and no cards or shadows:
- description;
- Quarta di copertina;
- Autrice/Autore del libro;
- Dettagli, holding "Edizione" and "Grafica" in two-column lists;
- Recensioni (date · author, a linked title, an excerpt with URLs stripped).

### Doors (wayfinding strip)
Three equal white cells under the hero, separated by mist hairlines. Each: Playfair navy title over a short charcoal description, a navy Iconoir arrow on the right that nudges 4px on hover; the cell fills mist and the title underlines on hover. Focus outline is drawn 4px inside the cell.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** white, or the cover tint on the cover panel.
- **Shadow Strategy:** soft navy lift at rest (see Elevation).
- **Border:** none, no outline ring.

### Book Card
White card: the cover centred on a cover-tinted field, then Playfair navy title (underlines on hover), optional slate subtitle, author names in normal case (semibold charcoal), an optional charcoal summary, one slate meta line (collana · anno · Ebook · Fuori catalogo, only the parts that apply), and the price as a serif navy figure pinned to the bottom so prices align across a row. Status lives in the meta line, never in a ribbon or badge on the cover. The `catalogue` variant drops the summary, uses the lighter field, sizes covers by height (13rem, 10rem on phones) so mixed formats line up, and on phones shrinks to cover, title and author in a two-up grid.

### Authors Index (`/autori`)
- **Title row:** the slim title row ("232 autrici e autori · 363 libri in catalogo"), then the catalogue's text field for search (name, alias and legal name; accent-insensitive). The number of results is announced in a status line.
- **Letter index:** a flat strip between two hairlines, with Playfair letters in 44px cells (40px from 768px), sticky from 768px.
- **Groups:** each letter is a group with a Playfair h2, followed by a grid of flat AuthorCards: 2 columns on phones, 3 from 768px, 4 from 1280px. Each card opens with a hairline.
- **Who is listed:** authors with no books at all stay out.
- **Closing line:** "Vuoi pubblicare con Multimage?" with a navy link to `/info/chi-siamo`. There is no orange action on the page.

### Collections Shelf (`/collane`)
The catalogue as the editors think it.
- **Title row:** the catalogue's slim row: h1, the serif size line "18 collane · 363 libri in catalogo", and the CMS lede.
- **Shelves:** one per collection, largest first, "Fuori Collana" last, divided by navy-at-10% hairlines.
- **Each shelf:** text on the left (5fr) and a cover field on the right (7fr). On phones the field comes first.
  - Text: Playfair name (h2, a link), slate serif count, description clamped to 3 lines (2 on phones), "Ultima uscita: *titolo*, anno", and the navy link "Sfoglia nel catalogo" to `/libri?collana=<slug>`.
  - Field: tinted from the newest cover (`coverFieldPalette`), with the latest covers standing on its floor (`object-position: bottom`), each with a small coloured drop shadow (10px 16px 18px). They rise 6px together on hover.
- **Logos:** left out of the shelf, because they vary too much in shape. They appear only on the collection page, contained in a fixed box beside its title row.
- **Collection page:** h2 "I libri della collana", then the catalogue's grid of `catalogue` BookCards, newest print year first, with out-of-catalogue titles last.

### Faceted Catalogue (signature)
The `/libri` surface. Toolbar: the Playfair result count as h2 on the left; search field, "Ordina per" select and (below 1024px) the navy "Filtri" button on the right, over a navy-at-10% rule. Active filters appear as a chip row under it. Facets are fieldsets (Collana, Formato, Periodo, Altro) plus an author field with suggestions ("Autrice o autore"); legends are semibold navy 0.875rem, groups divided by navy-at-10% rules. Collections show the largest eight, then a "Tutte le collane (n)" text toggle. Options with no matching books turn slate but stay selectable.

Below 1024px the column is a bottom sheet (max 85dvh): it slides up over 320ms on an exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`, no transition under reduced motion), focus is contained inside it, and its foot holds an "Azzera" text link and the surface's one orange-deep action, "Mostra n libri". No results: a mist panel with a Playfair title, a short charcoal sentence, outlined secondary buttons ("Togli ...", "Azzera filtri") and a "Cerca nel sito" text link. Without JavaScript the facet column is not rendered and every in-catalogue card shows.

### Navigation
- **Header:** three navy bands: a top bar of channel links (social colours, white text, uppercase 0.75rem), the logo and search band in deep window navy, the main tabs on navy (uppercase Inter semibold, 1px translucent white border, square). Dropdowns are navy panels with divided rows. Focus ring is white throughout. Below 768px a full-screen navy menu replaces the tabs.
- **Header search:** on the deep window navy band, the "Cerca" submit is a solid navy block with a white uppercase label (hover navy at 80%).
- **Primary navigation (books):** "Catalogo" (`/libri`) and "Collane" are two first-level items of the header menu, with no dropdown and no sub-navigation band. Ebook and In evidenza are catalogue filters, not pages.
- **Footer:** navy, mist text, white on hover and focus, white focus ring, mist-at-10% squares behind social icons (44px).
- **Ways on (not-found page):** a list between navy-at-10% rules, each row a Playfair navy link (1.25rem, underlines on hover) over a slate note, at least 64px high.

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
- **Do** put a book's status (anno, Ebook, Fuori catalogo) in its slate meta line.
- **Do** keep a surface's orange-deep to its one primary action; utility toggles are navy, secondary steps white-outlined or mist.

### Don't:
- **Don't** put white text on brand-orange (#fa7810); it is 2.7:1.
- **Don't** use brand-sky for text or behind white text; it is decorative only.
- **Don't** stack a kicker, eyebrow or tag label above a heading.
- **Don't** add literal border radii (`rounded-[2rem]`, `border-radius: 9999px`); they bypass the square theme.
- **Don't** add `focus:outline-hidden` with a private ring; the global `:focus-visible` outline is the one indicator.
- **Don't** tilt or shadow anything but a book cover.
- **Don't** lift or outline a book card on hover; only its cover rises.
- **Don't** set a ribbon, badge or price chip on a book card.

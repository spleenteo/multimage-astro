---
name: Multimage
description: La casa editrice dei diritti umani. Books on nonviolence and human rights, shown the way a bookshop window shows them.
colors:
  brand-navy: '#004881'
  brand-navy-light: '#005192'
  brand-navy-lighter: '#f3f4f6'
  brand-orange-deep: '#b84f00'
  brand-crimson: '#ae0e0e'
  brand-orange: '#fa7810'
  brand-sky: '#088af2'
  brand-charcoal: '#343434'
  brand-slate: '#6c757d'
  brand-mist: '#f2f4f6'
  brand-sand: '#f4f4f4'
  page-white: '#ffffff'
  hairline: '#e5e7eb'
  cover-field-fallback: '#e8eef5'
  social-instagram: '#c13584'
  social-facebook: '#4267b2'
  social-newsletter: '#2e7d32'
typography:
  display:
    fontFamily: 'Playfair Display, Times New Roman, serif'
    fontSize: '3rem'
    fontWeight: 600
    lineHeight: 1
  headline:
    fontFamily: 'Playfair Display, Times New Roman, serif'
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: '2.25rem'
  title:
    fontFamily: 'Playfair Display, Times New Roman, serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: '2rem'
  body:
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.625
  body-large:
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: '1.75rem'
  label:
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: '1.25rem'
    letterSpacing: '0em'
  caption:
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.25rem'
rounded:
  none: '0px'
spacing:
  xs: '8px'
  sm: '12px'
  md: '20px'
  gutter: '24px'
  lg: '32px'
  section: '48px'
  section-wide: '64px'
  tap-target: '44px'
components:
  button-primary:
    backgroundColor: '{colors.brand-orange-deep}'
    textColor: '{colors.page-white}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '8px 20px'
    height: '{spacing.tap-target}'
  button-primary-hover:
    backgroundColor: '{colors.brand-crimson}'
    textColor: '{colors.page-white}'
  button-secondary:
    backgroundColor: '{colors.brand-mist}'
    textColor: '{colors.brand-navy}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '8px 20px'
    height: '{spacing.tap-target}'
  button-secondary-outline:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.brand-navy}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '0 20px'
    height: '{spacing.tap-target}'
  button-secondary-outline-hover:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.page-white}'
  button-navy:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.page-white}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '0 16px'
    height: '{spacing.tap-target}'
  button-navy-hover:
    backgroundColor: '{colors.brand-navy-light}'
    textColor: '{colors.page-white}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.brand-navy}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '8px 20px'
    height: '{spacing.tap-target}'
  home-door:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.brand-charcoal}'
    typography: '{typography.title}'
    rounded: '{rounded.none}'
    padding: '32px 32px'
  home-door-hover:
    backgroundColor: '{colors.brand-mist}'
    textColor: '{colors.brand-charcoal}'
  header-nav-tab:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.page-white}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '8px 16px'
  section-tab:
    backgroundColor: '{colors.brand-mist}'
    textColor: '{colors.brand-charcoal}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '0 24px'
    height: '{spacing.tap-target}'
  section-tab-active:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.page-white}'
  filter-chip:
    backgroundColor: '{colors.brand-mist}'
    textColor: '{colors.brand-navy}'
    typography: '{typography.caption}'
    rounded: '{rounded.none}'
    padding: '0 12px'
  filter-chip-hover:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.page-white}'
  text-field:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.brand-charcoal}'
    typography: '{typography.caption}'
    rounded: '{rounded.none}'
    padding: '0 12px'
    height: '{spacing.tap-target}'
  footer:
    backgroundColor: '{colors.brand-navy}'
    textColor: '{colors.brand-mist}'
    typography: '{typography.caption}'
  newsletter-cta:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.brand-navy}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
    padding: '12px 24px'
---

# Design System: Multimage

A live reference of this document, rendered with the site's components, is at `/designsystem` (public, noindex).

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

**The Only the Book Floats Rule.** The cover is the one object allowed to cast a strong, coloured shadow and to tilt (4deg hero, 5deg featured block). Containers stay flat. On hover the flat cover turns into a 3D book (`Book3D`, CSS only): spine with the title in Playfair, page edges, thickness from the page count. Each book has its own pose, derived from its slug (`bookPose`): turned right (spine shows) or left (page edges), 24 to 40deg, scaled 12 to 20%. On a book card it rises about 30px and steps out of its coloured field; in the book-page hero it drops instead, so it never slips under the menu. The card itself does not lift. With reduced motion the book stays flat.

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
- the meta line (Collana _link_ · anno · formato · Fuori catalogo);
- the promo line in italic;
- the price as a Playfair figure;
- the actions.

The primary action is "Metti in borsa" (`BagAdd`: shopping-bag icon on the one orange button), with a navy 0.875rem status line under it that confirms the add. Without JavaScript, or for a book the bag cannot take, it is "Ordina via email": a `mailto:` prefilled with the book (`buildOrderMailto`). The ebook is one white secondary button, "Ebook 2,99 € su Bookrepublic", with an external icon. Under the actions sits one charcoal line, "Spedizione gratuita con piego di libri · Soci: 30% di sconto", followed by two navy links, "Trovalo in libreria" and "Come funziona l'ordine". An out-of-catalogue edition says so in a sentence. When a newer print edition exists, the primary action becomes "Vai alla nuova edizione". Below the hero sits one flat reading column (max 4xl, prose at 68ch), with sections divided by hairlines and left-aligned serif h2s and no cards or shadows:

- description;
- Quarta di copertina;
- Autrice/Autore del libro;
- Dettagli, holding "Edizione" and "Grafica" in two-column lists;
- Recensioni (date · author, a linked title, an excerpt with URLs stripped).

### Bag drawer

The bag opens from the right as a native modal `<dialog>` mounted once in `BaseLayout`, opened by the header bag button, and by `BagAdd` on the book page and the home hero after an add.

- **Sheet:** white, `min(28rem, 100vw)` wide, full height, square. The sheet lift of the Elevation section turned sideways: `-18px 0 45px` navy at 16%. The backdrop is deep navy at 45%. It slides in over 320ms on the same exponential ease-out as the catalogue sheet; under reduced motion there is no transition. The page behind does not scroll while it is open. Under 36rem of height the whole panel scrolls so nothing is clipped.
- **Head:** a navy-at-15% rule below, 24px side padding. The serif h2 "La tua borsa" (1.5rem, navy) over a Playfair size line, copies first like the header badge ("3 copie di 2 libri", slate, 0.875rem), and a 44px square close button on the right (mist on hover).
- **Lines:** one row per book on a navy-at-15% hairline: a 48x72 cover on a mist tile, then the title as a serif navy link (underlines on hover), the authors in 0.875rem, and below them the stepper and the line amount. The stepper is two 44px square white buttons around a number, in one 1px navy-at-30% frame; the amount is a Playfair figure. "Togli dalla borsa" is a navy underlined text button, 44px high.
- **Foot:** on white under a hairline. Totals in a two-column list ("Copie", "Totale a prezzo di copertina" with the Playfair total at 1.5rem), one slate 0.875rem line on free shipping and no payment now, then the surface's one primary: a full-width orange "Completa l'ordine" leading to `/borsa`. On `/borsa` itself the drawer only edits the bag: the total reads "Libri a prezzo di copertina" and the primary is "Torna al modulo", which closes the drawer (focus returns to the recap's "Modifica" button). "Svuota la borsa" is a centred navy text button; it opens an inline confirm on a mist panel ("Togliere tutti i libri dalla borsa?", a secondary "Sì, svuota", a text button "No, tienili"), never a modal on a modal.
- **Empty:** the h3 "La borsa è vuota", one sentence and a secondary "Sfoglia il catalogo".
- **Announcements:** a persistent polite live region inside the dialog announces adds, removals and the count; focus lands on the h2 when the drawer opens and returns to the opener on close.

### Order page (`/borsa`)

A reading page, noindex, whose state lives in the browser: empty, filled, email box, success. The head is a serif navy h1 (3xl, 4xl from 768px) with a Playfair size line in slate ("4 copie di 3 libri · 40,00 €") and one charcoal lede. Running text wraps with `text-wrap: pretty`.

- **Empty:** no second heading: the h1, one charcoal line and a secondary "Guarda le novità" to `/libri`.

- **Grid:** one column on phones; from 768px a 7fr / 5fr grid with a 48px gap. The mist recap comes first in the DOM (so a screen reader hears the order before the form) and sits on the right; the recap is not sticky.
- **Recap:** a mist panel (20px padding, 24px from 768px) headed by a full-bleed navy band: the bag line icon, the white Playfair title "Nella borsa" and, at the right, a white-outlined uppercase "Modifica" button (44px, opens the drawer; accessible name "Modifica la borsa"). Then one row per book (title, Playfair amount) between hairlines, then the totals in one scheme used everywhere (recap, success, email, PDF): "Libri a prezzo di copertina", a "Sconto soci −30%" row only when the member box is ticked, "Spedizione", and the Playfair total at 1.5rem, "Totale da pagare". Then "Cosa succede dopo" as a white card with a 4px navy top rule: a semibold lead "Non paghi adesso. Succede così:", then three rows between navy-at-12% hairlines, each a 40px mist tile with a navy line icon (envelope, bank, receipt: SVG uploads on the `shop` singleton's Order Step blocks, which also hold the titles and sentences), an uppercase slate "Passo n di 3", a bold navy title ("Lo staff conferma", "Paghi", "Mandi la ricevuta") and the 0.875rem step sentence (the staff writes from ordini@ to confirm; you pay by transfer or PayPal after the confirmation, details at the end; you send the receipt), the same words as on the success screen and in the PDF (constants in `order.ts`), and a navy link "Come funzionano gli ordini" to `/info/ordinare`. No bank details before sending.
- **Form:** fieldsets in this order, "Chi ordina", then "A chi spediamo", then "Spedizione", with serif navy 1.5rem legends, in the field style of Inputs / Fields (44px, 40px from 1024px, textarea for notes). Email and phone sit two to a row from 640px; the optional phone carries a slate hint under the input ("Lo usa il corriere se ha problemi con la consegna: ti consigliamo di lasciarlo."), tied to it by `aria-describedby`; CAP (`postal-code`, numeric, five digits), Città (`address-level2`) and Provincia share one row from 640px (9rem / 1fr / 9rem), stacked on phones. The server joins CAP and city into the `city` column. "Chi ordina" is a segmented control with one cell per buyer kind from the CMS (two columns under 640px, a last odd cell spanning the row; one row from 640px), the 1px dividers drawn by the gaps on a navy-at-25% ground: navy-at-25% frame, white cells, the checked cell solid navy with a semibold white label, the focus ring drawn on the cell by `:has(:focus-visible)`. Payment choices are a hairline-divided list of radio rows (44px, price right-aligned in Playfair). Under the control a slate hint names the checked buyer's discount ("Sconto del 20% sul prezzo di copertina dei libri: lo staff verifica che ti spetti."), announced politely; a buyer without discount has no hint. The consent is a checkbox row whose slate 0.875rem hint sits inside the label, right under its text ("I tuoi dati restano allo staff solo per il tempo necessario alla spedizione." with the navy link to the privacy policy): the whole block is the hit area, the input is named by its text (`aria-labelledby`) and described by the hint.
- **Errors:** each field's message sits under it in crimson semibold 0.875rem, linked by `aria-describedby`, with `aria-invalid` turning the border crimson. A summary sits at the top of the form on any failed send: an alert band: a 1px crimson-at-35% frame on a pale crimson wash (`#fbeeee`), a crimson circled-exclamation icon beside the semibold crimson count (`role="alert"`), charcoal text. For invalid fields, from the browser check or the server, it reads "Controlla N campi:" with one navy semibold link per field (two columns from 640px, 44px on phones) that moves focus to it, and focus goes to the box; other failures show one sentence, with a navy link to the email way out where it helps.
- **Send:** the page's one primary, orange "Invia l'ordine", with a slate 0.875rem line beside it (stacked on phones). The Turnstile widget sits above it; without a site key the form is replaced by a mist box headed "Mandaci l'ordine via email", and when sending fails the error box offers "mandacelo via email".
- **Success:** a serif h1 ("Ordine inviato, grazie") that takes focus; a lede that opens with what happens next ("Lo staff ti scrive da ordini@multimage.org entro due giorni lavorativi per confermare l'ordine.") and gives the code (never split at its hyphens). A mist box: "Scarica il PDF della tua richiesta e conservalo: non ti mandiamo una copia via email.", the page's one primary "Scarica il PDF" (orange, lazy-loads the PDF) and a "Stampa questa pagina" text button, with a charcoal status line. Then the lines as a hairline list followed by the totals scheme ("Libri a prezzo di copertina", for a member "Socia/socio: sì" and "Sconto soci −30% · −…", "Spedizione, …") and "Totale da pagare"; then "Adesso", the same three steps as before sending: the pay step carries the causale with the code and a mist box led by the IBAN on a white slab (navy-at-15% frame, slate uppercase label, the number in navy semibold 1.125rem / 1.25rem from 768px, and a navy "Copia l'IBAN" button with a copy icon that reads "IBAN copiato" for 2.5s), then holder, bank, BIC and intermediary SWIFT (one label/value grid from 640px) and, under a hairline, "Oppure con PayPal a …" with, at its right, an outlined navy button in the copy button's shape ("Paga 35,00 € con PayPal", uppercase 0.75rem, an external-link icon, solid navy on hover; PayPal's `_xclick` URL prefilled with amount and causale, new tab; the PDF carries the same link as "Paga con PayPal"); then an outlined "Torna al catalogo". The bag is emptied. When the notice to the staff failed, the lede and step 1 ask the buyer to write to ordini@ with the code. A print sheet (`@media print`) shows only the success block: the PDF box, "Copia l'IBAN" and the action row are hidden.

### Membership page (`/diventa-socio`)

A reading page that reuses the Order page's form language (`src/styles/form.css`: fields, legends, error summary, bank box) with its own small stylesheet (`_socio.css`). Two states: the sign-up form, then the confirmation.

- **Head:** a serif navy h1 ("Diventa socia o socio"), the CMS subtitle as one charcoal lede line, then the CMS text. The meta description falls back to a sentence built from the fees when the subtitle is short.
- **Benefit band:** between two navy-at-10% hairlines, no cards, no fill: three items (two free books, 30% off every book, support a non-profit publisher) stacked on phones and divided by the same hairline, a row of three from 768px with a navy-at-10% divider. The fee amounts inside it are set in Playfair (the `.order-choice__fee` voice). No covers: no CMS selection exists.
- **Form:** fieldsets "I tuoi dati", "Indirizzo" and "Quota", serif navy 1.5rem legends, fields as in Inputs / Fields. Under the legends sit slate 0.875rem hints (why birth data is asked, "per spedirti i due libri in omaggio", and the optional CMS fee note, shown only when filled), tied to their group by `aria-describedby`. Address rows follow the Order page (CAP, Città, Provincia share one row from 640px, stacked on phones). The fee is a hairline-divided list of radio rows (44px) with the amount right-aligned in Playfair. The required consent row carries the membership wording and a slate hint. There is no payment and no collaboration fieldset: the form is short on purpose. Errors use the Order page's summary band, one column on phones. The one primary is the orange send button; without a Turnstile site key the form is replaced by a mist box with a mailto button.
- **Confirmation:** a serif h1 that takes focus and a lede in the "tu" register with the code (never split at its hyphens). "Cosa succede adesso" is three steps (pay, send the receipt, we write to you) in the Order page's step style. The payment box is a two-option toggle (bank transfer, PayPal) that puts the chosen method first; it is client-only and sends nothing. Each method shows an "Importo" row, a plain label/value row in the bank details grid like the causale (the IBAN slab and PayPal button are the Order page's). Then, under a hairline, the optional step "Vuoi anche darci una mano?": the area checkboxes in one column on phones, an "Altro" field, a secondary send button and a polite live status line (`role="status"`); after a successful send the form is replaced by a thank-you line. An action row under a hairline holds a "Stampa questa pagina" text button and a navy link to `/libri` ("Sfoglia il catalogo: da socia o socio hai il 30%").
- **Print:** `@media print` shows only the confirmation (code, steps, payment details); the toggle, the collaboration step, copy and print buttons are hidden.
- **Header:** the top bar's call to action reads "Diventa socia o socio" and carries `aria-current="page"` on this page.

### Doors (wayfinding strip)

Three equal white cells under the hero, separated by mist hairlines. Each: Playfair navy title over a short charcoal description, a navy Iconoir arrow on the right that nudges 4px on hover; the cell fills mist and the title underlines on hover. Focus outline is drawn 4px inside the cell.

### Cards / Containers

- **Corner Style:** square (0px).
- **Background:** white, or the cover tint on the cover panel.
- **Shadow Strategy:** soft navy lift at rest (see Elevation).
- **Border:** none, no outline ring.

### Book Card

White card: the cover centred on a cover-tinted field, then Playfair navy title (underlines on hover), optional slate subtitle, author names in normal case (semibold charcoal), an optional charcoal summary, one slate meta line (collana · anno · Ebook · Fuori catalogo, only the parts that apply), and the price as a serif navy figure pinned to the bottom so prices align across a row. Status lives in the meta line, never in a ribbon or badge on the cover. The `catalogue` variant drops the summary, uses the lighter field, sizes covers by height (13rem, 10rem on phones) so mixed formats line up, and on phones shrinks to cover, title and author in a two-up grid.

An orderable print book (in the catalogue, with a price) carries a bag control in the card's bottom right corner, centred on the price line (24px in, 20px in the catalogue; on phones, where the catalogue hides the price, 8px in and the text keeps clear of it), outside the card's link: a 44px white square with a navy-at-25% frame, the soft lift and the inline bag line icon in navy; solid navy with a white icon on hover and once the book is in the bag. A charcoal tooltip above it (white semibold 0.75rem, right-aligned) shows on hover and keyboard focus: "Metti in borsa", "Aggiunto alla borsa" for 1.8s after a click, then "Nella borsa · N copie". A click adds one copy without opening the drawer; the header count updates and a polite live region announces it. Hidden without JavaScript. It is the one control allowed on a card; it is not a badge.

### Where To Find Our Books (`/distributori`)

- **Title row:** the slim title row ("28 librerie e luoghi amici · 10 regioni"). The CMS subtitle only feeds the meta description.
- **Three ways:** three flat columns between hairlines (stacked on phones).
  - "In qualsiasi libreria": title or ISBN, plus the distributors.
  - "Nelle librerie e nei luoghi amici": jumps to the list.
  - "Ordinalo a noi": email order, free piego di libri, soci 30%. Its "Scegli il libro" (→ `/libri`) is the page's only orange-deep action.
- **Map:** a map of all places (`SuppliersMap`) opens the list.
  - A hairline frame and square corners; 22rem tall, 30rem from 768px.
  - Navy clusters and points (no orange: it stays for the page's single action).
  - A square popup with navy links. A caption credits OpenFreeMap and OpenStreetMap.
- **Region strip:** a flat strip like the /autori letters, sticky only from 768px.
- **List:** regions as Playfair h2s, with flat SupplierCards in two columns from 768px.
- **Closing:** "Sei una libreria?" closes the page, with the orders email.

### Author Profile (`/autori/[slug]`)

- **Purpose:** the person frames their books.
- **Title row:** a small square portrait (80px on phones, 144px from 768px), or the initial on mist, beside the h1.
  - Under an alias, the legal name.
  - A serif size line ("25 libri · 6 fuori catalogo").
  - "Firma anche come …" for other names; the CMS `pseudonyms` link runs both ways and never points to the profile itself.
- **Latest book:** a 7/5 band on a field from `coverFieldPalette`, showing the latest in-catalogue book.
  - A meta line ("Ultima uscita · 2025 · collana").
  - The title as h2.
  - The subtitle, co-authors and promo (4 lines).
  - A Playfair price and "Vai al libro e ordinalo" as a navy link. There is no orange: the order action lives on the book page.
- **Biography:** in a 68ch column. Past three paragraphs, the first two stay open and the rest sit behind "Continua a leggere la biografia". Blockquotes sit between hairlines.
- **Tutti i libri:**
  - A line on how to order (email · piego di libri · Soci 30% · Come funziona l'ordine).
  - The catalogue grid with only co-authors on cards ("con …").
  - A "Fuori catalogo" sub-group under a hairline.
  - Books signed under the person's other names are included.
- **Closing:** the closing line is the same as on the index.

### Authors Index (`/autori`)

- **Title row:** the slim title row ("232 autrici e autori · 363 libri in catalogo"), then the catalogue's text field for search (name, alias and legal name; accent-insensitive). The number of results is announced in a status line.
- **Letter index:** a flat strip between two hairlines, with Playfair letters in 44px cells (40px from 768px), sticky from 768px.
- **Groups:** each letter is a group with a Playfair h2, followed by a grid of AuthorCards: 1 column on phones, 2 from 640px, 3 from 1024px, with a 20px gutter. Each card is a mist sheet with 24px padding; under the pointer or with focus inside it turns white, takes a navy-at-18% ring and a soft lift (chosen by the owner in a live session, 2026-11-23).
- **Card:** portrait (or initial) beside the Playfair name, the slate serif line with country and count, the one-line bio in a 40ch measure, then at the foot up to four small plain covers (hairline and soft offset shadow, no tinted field) beside "Vedi i libri".
- **Who is listed:** authors with no books at all stay out.
- **Closing line:** "Vuoi pubblicare con Multimage?" with a navy link to `/info/chi-siamo`. There is no orange action on the page.

### Collections Shelf (`/collane`)

The catalogue as the editors think it.

- **Title row:** the catalogue's slim row: h1, the serif size line "18 collane · 363 libri in catalogo", and the CMS lede.
- **Shelves:** one per collection, largest first, "Fuori Collana" last, divided by navy-at-10% hairlines.
- **Each shelf:** text on the left (5fr) and a cover field on the right (7fr). On phones the field comes first.
  - Text: Playfair name (h2, a link), slate serif count, description clamped to 3 lines (2 on phones), "Ultima uscita: _titolo_, anno", and the navy link "Sfoglia nel catalogo" to `/libri?collana=<slug>`.
  - Field: tinted from the newest cover (`coverFieldPalette`), with the latest covers standing on its floor (`object-position: bottom`), each with a small coloured drop shadow (10px 16px 18px). They rise 6px together on hover.
- **Logos:** left out of the shelf, because they vary too much in shape. They appear only on the collection page, contained in a fixed box beside its title row.
- **Collection page:** h2 "I libri della collana", then the catalogue's grid of `catalogue` BookCards, newest print year first, with out-of-catalogue titles last.

### Magazine (`/magazine`, `/magazine/[slug]`)

- **Index title row:** the h1 and the CMS lede (hidden on phones). No size line: article counts mean nothing to a reader.
- **Category strip:** a flat strip between hairlines, like the /autori letters. "Tutti" comes first, then the categories (most used first, no counts); the current one is on navy. Labels are normalised in code (`news` → "Notizie"), whatever their case in the CMS. `?categoria=<slug>` filters on the server.
- **Entries:** flat, with no shadow and no chip. They are in 1, 2 or 3 columns (640px, 1024px).
  - An 8/5 image on mist.
  - The Playfair title as h2. It is the only link, stretched over the entry.
  - One slate line: "Recensione · 21 ottobre 2026".
  - The abstract on 3 lines, without URLs.
  - 12 entries show at first. "Mostra altri articoli (12 di 27)" reveals 12 more, announces them and focuses the first new one. Without JavaScript every entry stays visible.
- **Article title row:** left-aligned.
  - The h1.
  - One slate line: the category, as a navy link to the filtered index, then the date, then "di …".
  - The lede, without pasted URLs; it is dropped when it only repeats the title.
- **Featured image:** whole (`fit: max`) on a mist field, never cropped. Posters and press clippings carry text.
- **Text:** a 68ch reading column, as in the author profile.
  - The editors' headings shift so the highest becomes h2.
  - Blockquotes sit between hairlines; `hr` is a hairline.
  - Links typed to multimage.org become relative.
- **Blocks placed by the editors:**
  - **Book:** the cover whole on its `coverFieldPalette` field, with the pale copy half: title, subtitle, "di …", a Playfair price and "Vai al libro e ordinalo". It is visible on phones.
  - **Author:** a 72px portrait or the initial, the name and "Vedi il profilo e i suoi libri", between hairlines.
  - The magazine never infers a book: books appear only where the editors place them.
- **End:** "Altre recensioni" (the same category, newest 3, with dates on hairlines), then "Tutte le recensioni" and "Torna al magazine". There is no orange action.

### Search (`/cerca`)

- **Title row:** h1 "Cerca", then a one-line lede of what can be found.
- **Field:** the field is flat: a hairline frame, a search icon, a 48px input and a navy "Cerca" button that stays visible on phones. The focus outline goes on the whole field.
- **Toggles:** one row between hairlines.
  - "Mostra solo": Libri · Autrici/Autori · Magazine · Collane e pagine, as flat cells that turn navy when on. Each has a visible 3px focus outline.
  - "Solo la frase esatta" is a plain checkbox, apart.
- **Status line:** the real total ("321 risultati per “pace”: eccone 25, i più pertinenti.").
- **Results:** flat rows on hairlines, with no card, shadow or badge.
  - The Playfair title is the only link, stretched over the row.
  - One slate meta line: the type ("Autrice o autore", "Dal magazine", "Collana", "Catalogo", "Pagina"). For a book it reads "di … · anno · formato · prezzo", with a Playfair price and "Anche in ebook · 2,99 €" linking to the other edition.
  - The excerpt runs to 3 lines, with matches on a sky/20 `mark` in navy semibold.
  - Books carry a small cover (72px, 96px from 768px) on the pale tint of their cover field.
- **More:** "Mostra altri risultati" (outlined navy) loads the next 25.
- **Ways on:** "Oppure parti da qui" (catalogue, authors, collections, magazine, where to find the books) when nothing is typed or nothing is found.

### Faceted Catalogue (signature)

The `/libri` surface. Toolbar: the Playfair result count as h2 on the left; search field, "Ordina per" select and (below 1024px) the navy "Filtri" button on the right, over a navy-at-10% rule. Active filters appear as a chip row under it. Facets are fieldsets (Collana, Formato, Periodo, Altro) plus an author field with suggestions ("Autrice o autore"); legends are semibold navy 0.875rem, groups divided by navy-at-10% rules. Collections show the largest eight, then a "Tutte le collane (n)" text toggle. Options with no matching books turn slate but stay selectable.

Below 1024px the column is a bottom sheet (max 85dvh): it slides up over 320ms on an exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`, no transition under reduced motion), focus is contained inside it, and its foot holds an "Azzera" text link and the surface's one orange-deep action, "Mostra n libri". No results: a mist panel with a Playfair title, a short charcoal sentence, outlined secondary buttons ("Togli ...", "Azzera filtri") and a "Cerca nel sito" text link. Without JavaScript the facet column is not rendered and every in-catalogue card shows.

### Navigation

- **Header:** three navy bands: a top bar of channel links (social colours, white text, uppercase 0.75rem), the logo and search band in deep window navy, the main tabs on navy (uppercase Inter semibold, 1px translucent white border, square). Dropdowns are navy panels with divided rows. Focus ring is white throughout. Below 768px a full-screen navy menu replaces the tabs.
- **Header bag button:** a "Borsa" control with an inline shopping-bag icon, hidden until the script runs: from 768px a 44px high square button with a translucent white border and an uppercase label, under 768px a 44px square icon button beside search and menu. The copy count sits in a white square badge with navy digits, shown only when the bag holds something; the button's accessible name says it ("Borsa, 4 copie"). It opens the bag drawer.
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

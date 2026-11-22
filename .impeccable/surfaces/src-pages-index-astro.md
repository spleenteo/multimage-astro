---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Home (`/`)

Scope: the home page only. Mode: Persuade. Extension of the incumbent world (navy, orange-deep actions, Playfair + Inter, cover-tinted panels, hand-drawn logo); no new visual identity in this round.

Audience: new readers, the nearby community, authors (PRODUCT.md). Action: reach a book and know how to get it.
Proof: real covers, prices, authors, collections; "dal 1995", volunteer non-profit. No invented reviews or numbers. Movement vocabulary stays off the top of the page.

Structure (fixed in code, top): hero with the book of the moment (CMS field `home.featured_book`, fallback first SingleBook block, then latest book) → doors Catalogo / Autori / Collane → first book carousel. Below: CMS blocks in editor order, banner text clamped to 3 lines when a link exists. Before the newsletter: one about line with links.

Open: max one campaign banner is guidance for editors, not enforced in code. The "Cosa cerchi?" pills block duplicates the doors and should be removed in the CMS by editors.

## Direction contract

THESIS: the home opens on a real book, at the size a bookshop window gives it; it refuses the stock-photo hero with a centred slogan.
OWN-WORLD: the incumbent system: a full-width field tinted from the cover's own colour, the cover tilted with a coloured drop shadow, Playfair titles in navy, Inter text, orange-deep primary action, square corners.
STORY: the visitor sees a book worth reading, learns who publishes it in one line, finds the price and three ways to get it, then the doors to the catalogue.
FIRST VIEWPORT: slim intro row (H1 "La casa editrice dei diritti umani", search, catalogue link); below it the cover-tinted band: text column left (title, author, two-line summary, price, "Scopri il libro" + ways to get it), cover large on the right. Mobile: cover first, actions right after.
FORM: structure fixed by the confirmed shape brief; seed: none (pinned) "Il libro del momento" occupa il primo schermo; parte alta fissa, resto libero.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

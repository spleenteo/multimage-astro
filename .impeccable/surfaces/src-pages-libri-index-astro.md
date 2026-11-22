---
version: 1
slug: "src-pages-libri-index-astro"
primary_target: "src/pages/libri/index.astro"
related_targets: []
---

# Catalogo libri (`/libri`)

Scope: the books catalogue page and the BookCard it renders. Mode: Operate (the visitor finds a book and opens it). Extension of the incumbent world (DESIGN.md); no new identity.

Audience: new readers, the nearby community (a book for themselves, a class, a gift), authors checking their title. Success: from a vague idea to an open book page in a few gestures.
Data: ~352 published books in catalogue (+22 out of catalogue), 18 collections (every book has one), 226 authors, 313 print / 50 ebook, ~76 translated, print year on all. Themes (`keywords`) too sparse: second phase.

Structure: slim title row (h1, count, one line) → section tabs (Catalogo first; Collane, In evidenza, Ebooks stay separate pages) → facets (collana with counts, formato, autrice/autore with suggestions, periodo: ultime uscite + decades, tradotti, includi fuori catalogo) + in-page search + sort (novità / titolo) → active filter chips with "Azzera" → grid, 40 at a time with "Mostra altri". Filters live in the URL. All cards are rendered server-side; the script only shows and hides them, so no-JS readers and crawlers get the whole catalogue. `/libri/pagina/N` redirects to `/libri`.

Build note (2026-11-22): the section tabs stay in the shared header band (BooksSectionNav in Header.astro), above the title row, for consistency with Collane, In evidenza and Ebook. Collections are ordered by size, first 8 shown, "Tutte le collane" for the rest. On phones the CMS lede is hidden so the first covers reach the fold.

Mobile: "Filtri (n)" opens a bottom panel with the result count and "Mostra n libri"; compact 2-column grid (cover, title, author).

Card (catalogue): cover on a quieter tinted field, serif title, sentence-case subtitle, authors, one meta line (collana · anno · Ebook), serif price; only the cover moves on hover. No summary in the catalogue.

Anti-goals: e-commerce furniture (cart, stars, best-seller, discount badges), 226 author checkboxes, page reloads on filter, losing shareable links.

## Direction contract

THESIS: a shelf you can question: the collections the publisher already thinks in become the way in, and the grid answers at once.
OWN-WORLD: the incumbent system: navy frame and headings, Playfair titles, Inter text, orange-deep only for the page's primary action, square corners, covers on fields tinted from their own colour (quieter in a grid than in a hero).
STORY: the reader sees how many books there are and by which roads to enter; picks a collection, a format or a name; the count and the covers change in place; they open a book.
FIRST VIEWPORT: slim title row with h1 and count; tabs; on desktop the facet column on the left and the first row of covers on the right; on mobile the title, a "Filtri" button with the search field, and the first two covers.
FORM: structure fixed by the confirmed shape brief; seed: none (pinned) faccette su collana, formato, autrice/autore, periodo, tradotti; schede separate; novità prima; temi dopo.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

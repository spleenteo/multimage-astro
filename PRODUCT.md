# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, served together; none of them is assumed to know Multimage already.

- **New readers**: people who care about peace, human rights and nonviolence, arriving from search, social media or word of mouth. They do not know Multimage or the Humanist Movement. Their job: find a book worth reading and know how to get it.
- **The nearby community**: members (soci), humanists, activists and friendly associations who already know Multimage. Their job: see what is new (books, campaigns, events such as Eirenefest) and stay involved.
- **Authors who want to publish**: people looking for a non-profit publisher for their book. Their job: understand what Multimage publishes and how to submit a manuscript (to the editorial director, Olivier Turquet, per `/info/chi-siamo`).

Bookshops, schools and associations ordering in quantity are served (special conditions on `/info/ordinare`, `/distributori`) but are not the primary audience.

## Product Purpose

Multimage APS is a non-profit publishing association (Associazione di Promozione Sociale) run by volunteers, publishing since 1995 books on human rights, peace, nonviolence, non-discrimination, the convergence of diversity, solidarity economy and spirituality: essays, fiction, poetry, children's books, comics.

The website is the publisher's catalogue and front door. **Success means books ordered and read.** Membership, the magazine, campaigns and events matter, but they follow from people discovering and reading the books.

## Positioning

"La casa editrice dei diritti umani": a volunteer-run, non-profit publisher outside the profit logic of the publishing market, with thirty years of books on these themes and partnerships with human-rights organisations. It also helps authors who struggle to publish elsewhere.

## Operating Context

- **Ordering**: there is no e-commerce. Readers order by email to `ordini@multimage.org` (titles, copies, address), pay by bank transfer (Banca Etica) or PayPal; standard shipping by "piego di libri" is free, tracked shipping +5 €. Books are also sold through bookshops and distributors (`/distributori`), and some as ebooks (`/libri/ebooks`).
- **Membership**: soci 2026 cost 20 € (10 € students and unemployed), include two free books and 30% off every publication (`/diventa-socio`); sign-up through an online form.
- **Content**: everything is edited by volunteers in DatoCMS (books, authors, collections, magazine posts, info pages, home blocks). The home page is assembled from CMS blocks whose order editors control; seasonal content (hero image, "Proposte per l'autunno") changes during the year.
- **Channels**: newsletter, Instagram, Facebook; festivals and events (e.g. Eirenefest) where authors take part.

## Capabilities and Constraints

- Italian only, permanently (see `docs/guidelines/i18n.md`).
- Catalogue: books with collections (collane), authors, prices, covers; paginated catalogue, author pages, collection pages, magazine, site search (`/cerca`).
- Stack and hosting are set by the codebase (Astro, Tailwind 4, DatoCMS, Cloudflare Workers); see `CLAUDE.md` and `docs/current-state.md`.
- Anything shown on the site must be editable by non-technical volunteers in DatoCMS; layouts must survive real CMS content (long texts, missing covers, images of any colour).
- Undecided: whether online payment will ever exist (the bag and the order form do). Until then, every path to a book ends at the email order, a bookshop, or an ebook.

## Brand Commitments

- **Name and tagline**: "Multimage" (also "Multimage Editrice", "Multimage APS"); tagline "La casa editrice dei diritti umani".
- **Logo**: the existing hand-drawn Multimage logo (asset in DatoCMS, used in header and footer).
- **Voice**: neutral on the themes. Human rights, peace and nonviolence lead; the link to the Humanist Movement and its vocabulary ("Umanesimo Universalista", "Nazione Umana Universale") stays on the pages that tell the story (`/info/chi-siamo`, `/info/la-storia`, `/info/carta-etica`) and is not the first thing a new visitor has to decode.

## Evidence on Hand

From the site's own info pages (`/info/la-storia`, `/info/pubblicazioni`, `/info/carta-etica`):

- Founded 1995; first book "Umanizzare la Terra", three reprints, 10,000 copies.
- Book-campaigns since 1999 (e.g. "Il Tritacarne" by Karl Guillen, proceeds to the author's legal defence).
- Collaborations with Amnesty International, Un Ponte per, PeaceLink, Comitato Paul Rougeau, Coalizione Italiana contro la Pena di Morte, Opera Nomadi; institutions such as Biblioteche di Roma, Università La Sapienza, Fondazione Fossoli.
- Published the complete works of Silo, an essay by Noam Chomsky, an unpublished work by Mikhail Gorbachev, classics by Pico della Mirandola and Erasmus.
- Real catalogue data: covers, summaries, prices, authors, collections in DatoCMS.

Absent, and not to be invented: reader reviews or testimonials, sales figures beyond the ones above, press quotes, member counts.

## Product Principles

1. **Books first.** Every surface should bring a visitor closer to a book they want to read and to the way to get it; campaigns and membership support this, they do not replace it.
2. **Clear to an outsider.** A first-time visitor understands who Multimage is and what it publishes without knowing the movement's vocabulary.
3. **Say how to get the book.** The bag collects books and the order is sent from a form (still no payment online): the ordering path (bag, email, bookshops, ebook) must be obvious wherever a book is.
4. **Editable by volunteers.** Designs work with whatever editors put in the CMS and do not depend on developer intervention for routine changes.
5. **Practise what it publishes.** A human-rights publisher's site is readable and usable by everyone.

## Accessibility & Inclusion

Working target: WCAG 2.1 AA (contrast, keyboard focus, skip link), adopted in the home-page critique of 2026-11-22. Readers include older people and people reading on phones.

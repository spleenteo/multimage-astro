---
shaping: true
---

# Shape: Astro 6 Migration

**Status**: done (2026-05-16)
**Date**: 2026-05-16
**Appetite**: ~1.5 giornate (più ½ giornata buffer per Tailwind via PostCSS)
**Predecessor**: `2026-05-16-upgrade-and-env-security.md` (slice D5)

---

## Source

> e solo dopo pensare un upgrade di astro

Findings da D2 audit (`npm audit` post-upgrade pacchetti):

- **GHSA-j687-52p2-xcff** — Astro <6.1.9: XSS in `define:vars` via incomplete `</script>` sanitization (moderate)
- **GHSA-xr5h-phrj-8vxv** — Astro <6.1.9: Server island encrypted parameters cross-component replay (moderate)
- **GHSA-mr6q-rp88-fx84** — `@astrojs/vercel` <10: unauthenticated path override via `x-astro-path` / `x_astro_path` (high)
- **GHSA-9wv6-86v2-598j** — `path-to-regexp` ReDoS via transitive `@vercel/routing-utils` (high)

Findings da D4 review DatoCMS:

- Pattern `@datocms/astro` (Image, QueryListener) sono già canonici e compatibili con Astro 6.
- Nessuna dipendenza tra Astro 6 e gli altri shape candidates (gql.tada, content-link).

---

## Problem

Astro 5.x ha 2 CVE non-patchabili senza major upgrade. Adapter Vercel 8.x ne ha altri 2 con stessa caratteristica. Lo stack non riceve più fix di sicurezza Astro mentre il progetto resta su 5.x; ogni giorno che passa è esposizione cumulativa.

In più:
- Astro 5 → 6 introduce Node 22+, Vite 7, Zod 4, Shiki 4. La progressione di ecosistema è già in corso; rimanere indietro accumula debito.
- `@astrojs/tailwind` integration v6.0.2 (ultima rilasciata) ha peerDep `astro ^3 || ^4 || ^5` — **non c'è compatibility con Astro 6 e non c'è una versione successiva pianificata**. Per fare Astro 6 va sostituita.

## Outcome

- Tutti i CVE Astro 5.x e adapter Vercel 8.x risolti.
- Build matrix (`SERVER=static` SSG + `SERVER=preview` SSR) invariata.
- `@astrojs/tailwind` rimosso, Tailwind 3 wired via PostCSS plugin senza perdita funzionale (stesso `tailwind.config.mjs`).
- `npm audit` non segnala più advisory `astro` o `@astrojs/vercel`.
- Zero modifiche al codice business (pattern Astro 5 usati dal progetto sono tutti compatibili Astro 6 — verificato in D1 + D4).

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | Risolvere i 4 CVE pendenti aggiornando Astro a 6.x e `@astrojs/vercel` a 10.x | Core goal |
| **R1** | **Build matrix invariata** | |
| R1.1 | `SERVER=static npm run build` passa con output SSG identico funzionalmente | Must-have |
| R1.2 | `SERVER=preview npm run build` passa con SSR + draft mode funzionante | Must-have |
| R1.3 | `astro check` clean (0 errori) | Must-have |
| R1.4 | `npm run lint` clean | Must-have |
| **R2** | **Compatibilità integrations** | |
| R2.1 | `@astrojs/check` e `@astrojs/ts-plugin` aggiornati a versioni Astro 6-compat | Must-have |
| R2.2 | `@astrojs/vercel` su v10.x (Astro 6 compatible) | Must-have |
| R2.3 | `@astrojs/tailwind` rimosso, Tailwind 3 funzionante via PostCSS plugin | Must-have |
| **R3** | **No regressioni funzionali** | |
| R3.1 | Draft mode + preview SSR continua a funzionare (cookie, JWT, QueryListener) | Must-have |
| R3.2 | Responsive images da `@datocms/astro/Image` invariati | Must-have |
| R3.3 | Sitemap, robots, llms-full.txt, search bundle, swiper element OK | Must-have |
| R3.4 | Stili Tailwind invariati (smoke test visuale su home + libro + autore) | Must-have |
| **R4** | **Esclusioni esplicite** | |
| R4.1 | Tailwind v4 → shape separato, non in questa migrazione | Out |
| R4.2 | TypeScript v6 → fuori scope | Out |
| R4.3 | Content Collections / Content Layer API → progetto non li usa, non introdurre adesso | Out |
| R4.4 | Adottare nuove feature Astro 6 (es. Sessions, Server Islands) → fuori scope | Out |
| **R5** | **Operatività** | |
| R5.1 | Slice atomiche con rollback | Must-have |
| R5.2 | `docs/current-state.md` + `TODO.md` aggiornati | Must-have |

---

## Solution sketch

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Pre-check: Tailwind via PostCSS** | |
| A1.1 | Rimuovere import `@astrojs/tailwind` da `astro.config.mjs` | |
| A1.2 | Creare `postcss.config.mjs` con `tailwindcss` + `autoprefixer` (oppure inline in vite config) | |
| A1.3 | Verificare `tailwind.config.mjs` content paths includono `./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}` | |
| A1.4 | Sostituire eventuale import diretto di stili (verificare `src/styles/global.css` o `src/layouts/BaseLayout.astro` per `@tailwind` directives) | |
| A1.5 | Test build su Astro 5 ancora (per isolare: prima Tailwind funziona senza integration, poi facciamo Astro 6) | |
| **A2** | **Astro 6 + adapter Vercel 10** | |
| A2.1 | `npm install astro@^6 @astrojs/vercel@^10 @astrojs/check@^0.10` (verificare versione check compat Astro 6) | |
| A2.2 | Aggiornare `@astrojs/ts-plugin` se necessario | |
| A2.3 | Verificare `astro.config.mjs` — non dovrebbe servire nulla, ma controllare se `output: 'server'`/`'static'` ancora corretto | |
| A2.4 | Eseguire `astro check` per scoprire eventuali type breaks (Zod 4, Vite 7) | |
| A2.5 | Eseguire build matrix completa | |
| **A3** | **Spot-check funzionali** | |
| A3.1 | `/api/draft-mode/enable` + `/api/preview-links` con cURL: 200 + cookie set | |
| A3.2 | `/` (home), `/libri/[slug]`, `/autori/[slug]`, `/magazine/[slug]` renderizzati correttamente | |
| A3.3 | `/sitemap.xml` valido | |
| A3.4 | Swiper element + search bundle funzionano (smoke test browser) | |
| A3.5 | Tailwind classi applicate correttamente (visual diff su home) | |
| **A4** | **Cleanup + docs** | |
| A4.1 | `npm audit`: confermare che i 4 CVE sono risolti | |
| A4.2 | Aggiornare `docs/current-state.md` § Dependencies | |
| A4.3 | Aggiornare `TODO.md` con D5 completato + qualsiasi follow-up emerso | |
| A4.4 | Eliminare `@astrojs/tailwind` da `package.json` se non già fatto | |

---

## Rabbit holes

- **Vite 7 plugin rotture**: Astro 6 usa Vite 7 con la nuova Environment API. Plugin custom potrebbero rompersi, ma il progetto non ha `vite.config.ts` custom → rischio basso. Se emerge, isolare e fixare in A2.
- **Zod 4**: alcuni string formats sono stati spostati al top-level `z` namespace. Il progetto usa Zod solo indirettamente via `astro:env` schema → impatto trascurabile. Se `astro check` segnala errori Zod, sono in dipendenze, non nel nostro codice.
- **`@astrojs/check` e Astro 6**: la 0.9.9 attualmente installata supporta solo Astro 5. Va verificata l'esistenza di una versione Astro 6-compat (probabilmente 0.10.x o 1.0.x). Non bloccante se manca: si può fare `tsc --noEmit` direttamente.
- **Tailwind via PostCSS — i `@tailwind` directives**: con l'integration removed, il file CSS con `@tailwind base; @tailwind components; @tailwind utilities;` deve essere importato esplicitamente nel layout. Verificare `src/styles/global.css` per la presenza delle directive.
- **`<ViewTransitions />` deprecato → `<ClientRouter />`**: il progetto non lo usa, già verificato. Niente da fare.
- **`Astro.glob()` rimosso**: il progetto non lo usa, già verificato.
- **`getStaticPaths()` con params numerici**: 6 route dinamiche da verificare (`/info/[slug]`, `/magazine/[slug]`, `/autori/[slug]`, `/libri/[slug]`, `/libri/schede/[slug]`, `/collane/[slug]`). Tutti usano `slug` stringa, non ID numerici → safe.
- **Image API breaking change** (`getImage()` server-only + crop default): già confermato in D1 che il progetto NON usa `getImage()`. Niente da fare.

## No-gos

- Niente Tailwind 4 in questa migrazione (shape dedicato separato).
- Niente TypeScript 6.
- Niente introduzione di Content Collections "perché ora è obbligatoria" — il progetto non li usa e non serve cominciare ora.
- Niente adozione di feature nuove Astro 6 (Sessions, Server Islands, ecc.) — questa è una **migrazione di sicurezza**, non un refactor.
- Niente push automatico.
- Niente modifiche al codice business (componenti, query, helper) salvo strict necessità per fix TS.

---

## Slices

- [x] **A1 — Tailwind via PostCSS (preparatorio)** (commit `ce82572`)
  - Verificare `src/styles/global.css` (o ovunque siano le `@tailwind` directive)
  - Creare `postcss.config.mjs` con plugin `tailwindcss` + `autoprefixer`
  - Rimuovere integration `tailwind()` da `astro.config.mjs`
  - Build matrix su Astro 5 (deve passare ancora) → conferma che la PostCSS-pipeline funziona da sola
- [x] **A2 — Astro 6 + Vercel adapter 10** (commit `1ff2339`)
  - `npm install astro@^6 @astrojs/vercel@^10`
  - Verificare e aggiornare `@astrojs/check`, `@astrojs/ts-plugin` a versione Astro 6-compat
  - `astro check` → risolvere eventuali errori (probabilmente type-only)
  - Build matrix completa
- [x] **A3 — Spot-check funzionali** (build-time validation done — runtime check tramite `npm run dev` rimane in mano all'utente per browser-side smoke test)
  - Home, libro, autore, magazine renderizzati OK
  - Draft mode enable/disable + preview links
  - Sitemap valido
  - Search bundle e swiper element nel browser
  - Visual diff Tailwind (no regressioni stili)
- [x] **A4 — Cleanup + docs**
  - `npm audit` → 0 advisory Astro/Vercel
  - Aggiornare `current-state.md`, `TODO.md`
  - Rimuovere `@astrojs/tailwind` da `package.json`

## Open questions

1. **`@astrojs/check` versione Astro 6-compat esiste?** Da verificare in A2.1 con `npm view @astrojs/check`. Se non esiste ancora una versione compatibile, fallback su `tsc --noEmit` o aspettare release.
2. **Visual diff Tailwind: come?** Manuale via browser dev tools, o screenshot diff con Playwright/Puppeteer? Per appetite di shape, basta manuale.
3. **Vercel adapter v10 breaking changes**: la skill non ha info dettagliate sull'adapter major. In A2.4 leggere il changelog di `@astrojs/vercel` 9→10 e 10.x prima di committare.

---

## Related shapes

- [upgrade-and-env-security](2026-05-16-upgrade-and-env-security.md) — predecessore, contiene findings D2 (CVE) + D4 (DatoCMS pattern compatibili).
- (future) `tailwind-v4-migration` — separato; può seguire questa migrazione una volta che `@astrojs/tailwind` è già rimosso (è un prerequisito comune).
- (future) `gql-tada-auto-pagination` — emerso da D4-R1+R2, indipendente da Astro 6.
- (future) `content-link-visual-editing` — emerso da D4-R3, indipendente da Astro 6.

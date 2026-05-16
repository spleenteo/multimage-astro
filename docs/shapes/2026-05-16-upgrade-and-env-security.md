---
shaping: true
---

# Shape: Upgrade Dipendenze + Env Vars Security Audit

**Status**: ready
**Date**: 2026-05-16
**Appetite**: ~2 giornate (Shape D selezionata)
**Selected shape**: **D — Sequenziale: deps prima, DatoCMS review dopo, Astro 6 in shape separato**

---

## Source

> voglio fare un upgrade generale del progetto e dei pacchetti. In particolarmodo mi interessa assicurarmi che la cli di dato sia l'ultima versione. Capiamo anche se merita passare a Astro 6 e quando complesso può essere.
>
> voglio aggiungere anche un giro di verifica di sicurezza: ci sono molte chiavi in env, e vercel indica quelle che sono esposte pubblicamente. Forse alcuno non dovrebbero esserlo?

Screenshot Vercel: 6 variabili con badge "Needs Attention" — `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_API_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (e altre). Il badge significa **non cifrate at-rest nel dashboard Vercel** (variabili create prima della feature *Sensitive Environment Variables*), non "esposte al browser".

---

## Problem

1. **Drift di dipendenze**: 22 pacchetti hanno aggiornamenti disponibili. DatoCMS CLI 3 è ufficialmente legacy (rinominato `datocms`), CMA client 5 ha una superficie d'API rivista, Astro 6 introduce miglioramenti su Vite 7/Zod 4/Node 22.
2. **Astro 6 inevitabile**: rimanere su 5 accumula debito di migrazione (Content Layer obbligatoria, image API cambiata, adapter rinnovati).
3. **Env vars non cifrate**: 6 secret su Vercel sono in plain text nel dashboard team — chi ha accesso può leggerle.
4. **Token pubblico non verificato**: `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` è esposto al bundle client. Va confermato che lo scope sia *Site Search* read-only e non un CDA token con accesso completo al CMS.

## Outcome

- Dipendenze allineate eccetto esclusioni esplicite (Tailwind 4, TypeScript 6).
- DatoCMS CLI v4 attiva, `schema:generate` invariato.
- Astro 6 (o decisione documentata di rimandarlo) + adapter `@astrojs/vercel` v10.
- Tutti i secret Vercel migrati a tipo *Sensitive*.
- Token pubblici verificati come read-only e scoped al minimo necessario.
- Build statica + preview pass, nessuna regressione user-facing.

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | Aggiornare dipendenze e chiudere gap di sicurezza env vars senza regressioni in produzione | Core goal |
| **R1** | **Build matrix invariata** | |
| R1.1 | `SERVER=static npm run build` passa | Must-have |
| R1.2 | `SERVER=preview npm run build` passa | Must-have |
| R1.3 | `astro check` (typecheck) clean | Must-have |
| **R2** | **Scope upgrade** | |
| R2.1 | DatoCMS CLI su v4.x (alias `datocms` o `@datocms/cli` compat) | Must-have |
| R2.2 | DatoCMS CMA client su v5.x | Leaning yes |
| 🟡 R2.3 | Astro su v6.x | 🟡 Out (shape separato post-D4) |
| 🟡 R2.4 | `@astrojs/vercel` adapter su v10.x | 🟡 Out (segue R2.3) |
| R2.5 | `@vercel/analytics` v2 + `@vercel/speed-insights` v2 | Leaning yes |
| R2.6 | Major minori: `swiper` 12, `esbuild` 0.28, `dotenv-cli` 11, `jsdom` 29, `serialize-error` 13 | Nice-to-have |
| **R3** | **Esclusioni esplicite** | |
| R3.1 | Tailwind v4 → fuori scope (shape separato) | Out |
| R3.2 | TypeScript v6 → fuori scope (immaturo) | Out |
| **R4** | **Workflow invariati** | |
| R4.1 | `npm run sync-datocms` (schema:generate) funziona | Must-have |
| R4.2 | Draft mode + preview SSR funziona | Must-have |
| R4.3 | Sitemap, robots, SEO meta, search client bundle OK | Must-have |
| 🟡 **R4.4** | **Sub-slice: DatoCMS skills review dell'esistente** | 🟡 Must-have |
| 🟡 R4.4.1 | Review uso `@datocms/astro` (Image/QueryListener) — best practice attuali | 🟡 Must-have |
| 🟡 R4.4.2 | Review pattern CDA (`src/lib/datocms/`, query colocate `_graphql.ts`) | 🟡 Must-have |
| 🟡 R4.4.3 | Review uso CMA client v5 (post-deploy, seo-analysis) | 🟡 Must-have |
| 🟡 R4.4.4 | Review CLI workflow (`schema:generate`, eventuali nuove feature v4) | 🟡 Must-have |
| **R5** | **Env vars security** | |
| R5.1 | Tutti i secret Vercel marcati *Sensitive* (cifrati at-rest) | Must-have |
| R5.2 | `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` verificato come token *Site Search* (read-only) | Must-have |
| R5.3 | Nessun secret accidentalmente `PUBLIC_`-prefissato in `astro.config.mjs` | Must-have |
| R5.4 | Token con scope troppo ampio identificati e ridotti dove possibile | Nice-to-have |
| **R6** | **Operatività** | |
| R6.1 | Slice in commit atomici con rollback facile | Must-have |
| R6.2 | `docs/list-*.md`, `current-state.md`, `TODO.md` aggiornati | Must-have |

---

## Shapes (S)

### A: Bundle unico — 4 slice consecutive

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Minor/patch + DatoCMS upgrade** (½ giornata) | |
| A1.1 | Bump 16 pacchetti patch/minor (astro 5.18, prettier 3.8, typescript 5.9, ecc.) | |
| A1.2 | DatoCMS CLI 3 → 4 (alias `datocms`); verifica `schema:generate` | |
| A1.3 | DatoCMS CMA client 4 → 5; aggiorna call site in `post-deploy`, `seo-analysis`, `utils.ts` | ⚠️ |
| **A2** | **Astro 6 + adapter Vercel 10** (1 giornata) | |
| A2.1 | Bump `astro` 6 + `@astrojs/vercel` 10 | |
| A2.2 | Verifica 6 route dinamiche (`getStaticPaths`) per params numerici | |
| A2.3 | Verifica `getImage()`/responsive images per il nuovo default crop | ⚠️ |
| A2.4 | Test build matrix (static + preview) | |
| **A3** | **Major minori** (½ giornata) | |
| A3.1 | Vercel analytics v2 + speed-insights v2 (verifica import API) | |
| A3.2 | swiper 12, esbuild 0.28, jsdom 29, dotenv-cli 11, serialize-error 13 | |
| **A4** | **Env vars security audit** (½ giornata) | |
| A4.1 | Migrazione 6 secret Vercel a *Sensitive* (richiede rotazione+rinserimento) | |
| A4.2 | Verifica scope `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` (deve essere Site Search read-only) | |
| A4.3 | Audit `astro.config.mjs` envField: ogni `PUBLIC_*` confermato come safe-for-client | |
| A4.4 | Documentare matrice scope in `docs/guidelines/security.md` | |

**Appetite stimata**: ~2.5 giornate.

### B: Split in 2 cicli — Security prima, upgrade dopo

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | **Ciclo 1 — Security + must-have upgrade** (1 giornata) | |
| B1.1 | Env vars Sensitive migration + scope audit (= A4) | |
| B1.2 | Patch/minor bumps (= A1.1) | |
| B1.3 | DatoCMS CLI 4 + CMA 5 (= A1.2 + A1.3) | ⚠️ |
| **B2** | **Ciclo 2 — Astro 6 + maintenance** (1.5 giornate) | |
| B2.1 | Astro 6 + adapter v10 (= A2) | ⚠️ |
| B2.2 | Major minori (= A3) | |

**Appetite stimata**: 2 cicli × ~1.25gg ciascuno. Decoupling tra security e Astro 6.

### 🟡 D (SELECTED): Sequenziale — Deps → DatoCMS review → (later) Astro 6

Sequenza esplicita richiesta dall'utente: aggiornare prima tutto ciò che è non-Astro, poi usare le skill DatoCMS per fare una review dell'esistente, poi (in shape separato) valutare Astro 6.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **D1** | **Spike getImage** — ✅ RISOLTO | |
| D1.1 | `getImage()` non usato; tutte immagini via `@datocms/astro/Image` → Astro 6 image breaking change non impatta | |
| **D2** | **Upgrade pacchetti (primo giro)** (½ giornata) | |
| D2.1 | Bump tutti i patch/minor (16 pacchetti) | |
| D2.2 | DatoCMS CLI 3 → 4 (alias `datocms`), verifica `schema:generate` | |
| D2.3 | DatoCMS CMA client 4 → 5, aggiorna 3 call site | ⚠️ |
| D2.4 | Major minori non-Astro: `@vercel/analytics` v2, `@vercel/speed-insights` v2, `swiper` 12, `esbuild` 0.28, `dotenv-cli` 11, `jsdom` 29, `serialize-error` 13 | |
| D2.5 | **NON aggiornare**: `astro`, `@astrojs/vercel`, `@astrojs/check`, `@astrojs/ts-plugin`, `tailwindcss`, `typescript` (TS 6), `@types/jsdom` | |
| D2.6 | Build matrix verifica: static + preview + `astro check` | |
| **D3** | **Env vars security audit** (½ giornata) | |
| D3.1 | Migrazione 6 secret Vercel a *Sensitive* (ricreazione con stesso valore) | |
| D3.2 | Verifica scope `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` (deve essere Site Search read-only su `/search-results`) | |
| D3.3 | Audit `astro.config.mjs` envField: confermare ogni `PUBLIC_*` safe-for-client | |
| D3.4 | Documentare matrice scope in `docs/guidelines/security.md` | |
| **D4** | **DatoCMS skills review** (½–1 giornata) | |
| D4.1 | Skill `datocms-frontend-integrations`: review `Image` + `QueryListener` usage, draft mode, real-time updates, cache tags | |
| D4.2 | Skill `datocms-cda`: review pattern query (colocate `_graphql.ts`, fragments, `executeQuery`), gql.tada potential | |
| D4.3 | Skill `datocms-cma`: review uso v5 dopo D2.3 (publishing, asset upload patterns) | |
| D4.4 | Skill `datocms-cli`: review setup `datocms.config.json` (assente?), migrations, profiles, eventuali nuove feature CLI v4 (`schema:inspect`, `cma:script`) | |
| D4.5 | Produrre report findings in `docs/decision-log/2026-05-XX-datocms-review.md` | |
| **D5** | **Astro 6** — OUT-OF-SCOPE | |
| D5.1 | → nuovo shape `YYYY-MM-DD-astro-6-migration.md` dopo D4 completato | |

**Appetite stimata**: ~2 giornate complessive (D2 + D3 + D4). Astro 6 in ciclo successivo dedicato.

### C: Conservativa — Defer Astro 6

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | **Minor/patch + DatoCMS** (½ giornata) | |
| C1.1 | = A1 (16 bumps + CLI 4 + CMA 5) | |
| **C2** | **Env vars security audit** (½ giornata) | |
| C2.1 | = A4 | |
| **C3** | **Major minori non-Astro** (¼ giornata) | |
| C3.1 | Vercel analytics/speed v2, swiper 12 (omette ciò che dipende da Astro 6) | |
| **Out** | Astro 6 + adapter v10 → nuovo shape | |

**Appetite stimata**: ~1.5 giornate. Astro 6 valutato in futuro round.

---

## Fit Check (Shape D selezionata)

| Req | Requirement | Status | 🟡 D |
|-----|-------------|--------|:---:|
| R0 | Upgrade + chiusura gap env vars senza regressioni | Core goal | ✅ |
| R1.1 | Static build passa | Must-have | ✅ |
| R1.2 | Preview build passa | Must-have | ✅ |
| R1.3 | `astro check` clean | Must-have | ✅ |
| R2.1 | DatoCMS CLI v4 | Must-have | ✅ |
| R2.2 | CMA client v5 | Leaning yes | ✅ |
| R2.3 | Astro v6 | 🟡 Out (shape separato) | — |
| R2.4 | Adapter Vercel v10 | 🟡 Out (shape separato) | — |
| R2.5 | Vercel analytics/speed v2 | Leaning yes | ✅ |
| R2.6 | Major minori | Nice-to-have | ✅ |
| R4.1 | `sync-datocms` funziona | Must-have | ✅ |
| R4.2 | Draft preview funziona | Must-have | ✅ |
| R4.3 | Sitemap/robots/SEO OK | Must-have | ✅ |
| 🟡 R4.4 | DatoCMS skills review eseguita | Must-have | ✅ |
| R5.1 | Secret Vercel Sensitive | Must-have | ✅ |
| R5.2 | Public token scope verificato | Must-have | ✅ |
| R5.3 | No secret PUBLIC_-prefissati | Must-have | ✅ |
| R6.1 | Slice atomiche | Must-have | ✅ |
| R6.2 | Docs aggiornati | Must-have | ✅ |

**Notes:**
- 🟡 Spike D1 risolto: `getImage()` non usato in `src/` → image breaking change Astro 6 inerte. Verifica fatta con `grep -rn "getImage\|from 'astro:assets'" src/` → nessun match.
- D2.3 ⚠️ CMA v5: 3 call site (`src/pages/api/post-deploy/index.ts`, `src/pages/api/seo-analysis/index.ts`, `src/pages/api/utils.ts`) — verifica targata in D2.
- Shape A, B, C **non più candidate** — Shape D copre la sequenza richiesta dall'utente.

---

## Rabbit holes

- **Tailwind 4** — out of scope, shape separato. Sostituisce `@astrojs/tailwind` con plugin Vite, riscrive il config: lavoro a sé.
- **Token rotation completa** — la migrazione a Sensitive richiede di reinserire i valori. Tentazione di ruotarli tutti contestualmente: farlo solo se il valore è effettivamente compromesso o sospetto, altrimenti aumenta blast radius del cambio.
- **TypeScript 6** — appena rilasciato, evitare finché ecosistema (Astro, plugin TS) non lo dichiara stabile.
- **Astro Content Collections migration** — il progetto non li usa, ma se durante l'upgrade emerge la tentazione di introdurli "perché ora è API ufficiale", rimandare a shape dedicato.
- **Vite 7 ripples** — qualche plugin custom potrebbe rompersi; il progetto non ha vite.config.ts custom, quindi rischio basso.

## No-gos

- **Niente push automatici**: tutto via Issue + patch (regola CLAUDE.md).
- **Non toccare `.env*`** locali — solo Vercel dashboard.
- **Non ruotare token in modo cieco** — solo migrazione a Sensitive con stesso valore, a meno di sospetto compromissione.
- **Niente Tailwind 4 in questo shape**.
- **Niente TypeScript 6**.
- **Niente Content Collections introdotte ex-novo**.

---

## Slices (Shape D)

- [ ] **D2 — Upgrade pacchetti primo giro**
  - [ ] D2.1 Bump 16 patch/minor + verifica `npm run lint`
  - [ ] D2.2 DatoCMS CLI 3 → 4; verifica `npm run sync-datocms` produce `schema.ts` identico (diff)
  - [ ] D2.3 DatoCMS CMA client 4 → 5; aggiorna i 3 call site (`post-deploy`, `seo-analysis`, `utils.ts`)
  - [ ] D2.4 Major minori non-Astro (`@vercel/analytics` v2, `@vercel/speed-insights` v2, `swiper` 12, `esbuild` 0.28, `dotenv-cli` 11, `jsdom` 29, `serialize-error` 13)
  - [ ] D2.6 Build matrix: `SERVER=static npm run build && SERVER=preview npm run build && astro check` → tutto verde
- [ ] **D3 — Env vars security audit**
  - [ ] D3.1 Migrazione 6 secret Vercel a *Sensitive* (rinserire valori, vedi guida Vercel)
  - [ ] D3.2 Verifica scope `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` su DatoCMS dashboard
  - [ ] D3.3 Audit `astro.config.mjs` envField; aggiungere commenti dove utile
  - [ ] D3.4 Aggiornare/creare `docs/guidelines/security.md` con tabella env vars
- [ ] **D4 — DatoCMS skills review**
  - [ ] D4.1 Frontend integrations review (Image, QueryListener, draft mode, cache tags)
  - [ ] D4.2 CDA patterns review (executeQuery, _graphql.ts colocation, fragments)
  - [ ] D4.3 CMA v5 review (uso post-upgrade)
  - [ ] D4.4 CLI v4 review (schema:generate, eventuali nuove feature da adottare)
  - [ ] D4.5 Report findings in `docs/decision-log/2026-05-XX-datocms-review.md`
- [ ] **D5 — (post-D4) Creare shape Astro 6**
  - [ ] Nuovo file `docs/shapes/YYYY-MM-DD-astro-6-migration.md` con findings di D4 come input

## Open questions

1. Sequenza di D3 (security) vs D2 (deps): in serie o in parallelo? **Proposta**: D2 prima (verifichiamo che nulla si rompa con i bump), poi D3 (security audit puro su Vercel, indipendente dal codice).
2. D4 (DatoCMS review): output minimo? **Proposta**: un decision-log con lista di follow-up actions, non patch di codice immediati — diventa input per shape successivi.

---

## Related shapes

- [security-baseline](2026-03-05-security-baseline.md) — copre staff auth, sanitization, `/llms-full.txt`, `/api/post-deploy`. **Nessun overlap** con env vars audit.
- (future) `tailwind-v4-migration` — shape da creare quando si decide di affrontare Tailwind 4.

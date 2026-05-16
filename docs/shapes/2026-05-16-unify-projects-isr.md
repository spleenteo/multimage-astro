---
shaping: true
---

# Shape: Unificare i due progetti Vercel via ISR + bypassToken

**Status**: shaping
**Date**: 2026-05-16
**Appetite**: ~1.5–2 giornate
**Predecessor**: richiede merge di `2026-05-16-astro-6-migration.md` (Astro 6 + adapter Vercel 10 indispensabili)

---

## Source

> AL momento multimage gira con Astro su Vercel con due istanze: una statica e una solo per far funzionare il preview nelle sidebar di datocms. Questo obbliga gli editor a dover fare una build; obbliga me ad avere due progetti (simili) e obbliga il codice a differenze (non grandi) in base alla variabile SERVER. Questa cosa è accettabile, ma onestamente non mi piace. Perché è così? perché siamo su un piano free di Vercel e non volevo usare troppe chiamate API.
>
> con Next è possibile usare cache tags in modo non granulare: se ci sono modifiche tutto viene rigenerato, ma altrimenti il sito viene restituito staticamente. Mi domandavo se fosse possibile fare la stesa cosa con Astro (su Vercel) e così tenere abilitato il preview e visual editing su un unico progetto.

Numeri analytics (ultimi 30 giorni):
- 3.780 visitors, 9.071 page views, bounce 37%
- Top route: `/libri/[slug]` 1.7K, `/autori/[slug]` 1.2K, `/` 251
- ~2 update CMS / settimana

---

## Problem

### Cosa fa male oggi

1. **Due progetti Vercel da mantenere**: configurazione doppia, env vars doppi, deploy doppi. Drift inevitabile tra i due.
2. **Codice ramificato su `SERVER`**: 3 punti chiave hanno branching compile-time:
   - `astro.config.mjs:5-9` — switch `output: 'static'` / `'server'`
   - `src/lib/prerender.ts:1-4` — esporta `prerender` per ogni page
   - `src/lib/draftPreview.ts:4-5` — gate `resolveDraftMode` su preview SSR
3. **Editor friction**: per vedere una preview occorre attendere il build del progetto preview (la sidebar DatoCMS punta lì).
4. **Visual Editing impossibile**: il D4-R3 (Content Link / click-to-edit) richiede draft mode sullo stesso dominio della produzione — incompatibile col setup attuale.

### Perché era così

Assunzione storica: "il piano free Vercel limita le function invocations, meglio statico tutto per risparmiare". Cost analysis (vedi sezione successiva) mostra che **l'assunzione non regge ai numeri attuali**: anche un setup all-SSR consumerebbe <1% del budget free.

### Cost analysis

Stima budget Vercel Hobby plan (~1M function invocations/mese, ~100GB bandwidth):

| Architettura | Function invocations/mese | % del free | Bandwidth |
|---|---|---|---|
| Oggi (statico) | ~0 (solo preview SSR) | <0,1% | ~9 GB (9%) |
| Cammino A (SSR + ISR) | ~15-25K (regen TTL + webhook) | **~2%** | ~9 GB |
| All-SSR senza cache (worst case) | ~9K (1/page view) | <1% | ~9 GB |

A 9K page views/mese serve un traffico **100x** per saturare il free plan. Spike del 26 aprile (~340 visits/giorno) sarebbe stato trascurabile anche in regime full-SSR.

## Outcome

- **Un solo progetto Vercel** che serve sia la produzione (statica per il visitatore) sia il preview/visual editing (dinamico per gli editor in draft mode).
- **Variabile `SERVER` eliminata** dal codice e da Vercel.
- Webhook DatoCMS → invalidation per URL granulare via bypassToken.
- Function invocations attese: **<3%** del budget Vercel free.
- D4-R3 (Content Link / Visual Editing) diventa implementabile come shape successiva.

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | Singolo progetto Vercel che serve sia anonymous visitors (statico) sia editor in draft mode (SSR) | Core goal |
| **R1** | **DX editori** | |
| R1.1 | Preview DatoCMS sidebar punta allo stesso dominio della produzione | Must-have |
| R1.2 | Modifica record → propagazione in produzione entro pochi secondi (webhook → bypass URL) | Must-have |
| R1.3 | Visual Editing / Content Link diventa abilitabile (shape successiva, ma non bloccata da questa architettura) | Leaning yes |
| **R2** | **Budget** | |
| R2.1 | Function invocations attese ≤5% del free plan Vercel (margine 20x) | Must-have |
| R2.2 | Nessun degrado bandwidth | Must-have |
| **R2.3** | Monitoraggio: comandi per vedere quanti invocation/mese si stanno usando documentati | Nice-to-have |
| **R3** | **Manutenibilità** | |
| R3.1 | Variabile env `SERVER` rimossa dal codebase | Must-have |
| R3.2 | `src/lib/prerender.ts` e `src/lib/draftPreview.ts` semplificati o rimossi | Must-have |
| R3.3 | `astro.config.mjs` senza branching su SERVER | Must-have |
| **R4** | **Performance** | |
| R4.1 | TTFB anonymous user ≤ statico attuale (ISR CDN-cached) | Must-have |
| R4.2 | Editor in draft mode: TTFB accettabile (SSR + DatoCMS round-trip) | Nice-to-have |
| **R5** | **Operatività** | |
| R5.1 | Migrazione reversibile (sa che il rollback è git revert + redeploy) | Must-have |
| R5.2 | Decommissioning del secondo progetto Vercel **dopo** validazione del nuovo singolo progetto | Must-have |
| R5.3 | `docs/guidelines/preview-mode.md` + `current-state.md` + `TODO.md` aggiornati | Must-have |

---

## Solution sketch — Cammino A (selezionato)

`output: 'server'` permanente, ogni route SSR ma cached aggressivamente sul CDN Vercel via ISR. Anonymous visitors → response cached → cost zero. Editor in draft mode → cache miss → SSR con `includeDrafts: true`. Webhook DatoCMS → bypassToken → rigenera l'URL toccato.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Architettura ISR** | |
| A1.1 | `astro.config.mjs`: rimosso branching `SERVER`, fissato `output: 'server'`, adapter con `isr: { expiration, bypassToken, exclude }` | |
| A1.2 | Generare e salvare `BYPASS_TOKEN` come env Vercel (Sensitive) | |
| A1.3 | Decidere TTL ISR: proposta default `expiration: 86400` (24h) con possibilità di override per route alta cadenza | |
| **A2** | **Eliminare branching SERVER** | |
| A2.1 | Rimuovere `src/lib/prerender.ts` (o ridurlo a `export const prerender = false` se serve esplicito) | |
| A2.2 | Semplificare `src/lib/draftPreview.ts`: `resolveDraftMode` torna a leggere solo il cookie | |
| A2.3 | Aggiornare 9 file che importano `prerender` da `src/lib/prerender.ts` | |
| A2.4 | Rimuovere `SERVER` da `envField` schema in `astro.config.mjs` | |
| A2.5 | Rimuovere `SERVER` da Vercel env vars (entrambi i progetti) | |
| **A3** | **Webhook invalidation** | |
| A3.1 | Nuovo endpoint `src/pages/api/revalidate/index.ts` che riceve webhook DatoCMS, valida token, mappa record → URL via `recordToWebsiteRoute`, chiama bypass URL per ogni URL toccato | |
| A3.2 | Configurare un Webhook in DatoCMS: trigger su publish/unpublish/update, target `/api/revalidate?token=...` | |
| A3.3 | Decidere ambito invalidation: solo l'URL del record (semplice) o anche index/sitemap (più completo). Proposta: invalidare URL del record + `/` + `/sitemap.xml` se il record è in `BlogPost|Book|Author|Collection` | ⚠️ |
| **A4** | **Cache-Control + Vary per draft cookie** | |
| A4.1 | Middleware `src/middleware.ts`: se draft cookie presente, imposta `Cache-Control: private, no-store`. Altrimenti lascia che ISR cache | |
| A4.2 | Verifica che ISR cache key non includa il cookie (default su Vercel: cache by URL only) | |
| **A5** | **Validation + decommissioning** | |
| A5.1 | Deploy del singolo progetto su un sottodominio di staging (es. `staging.multimage.org`) | |
| A5.2 | Smoke test: anonymous load, draft mode toggle, webhook end-to-end (publish in CMS → vedere il cambio in produzione entro 10s) | |
| A5.3 | Cutover: aggiornare DatoCMS plugin Web Previews per puntare al singolo dominio. Aggiornare DNS se serve | |
| A5.4 | Monitorare function invocations su Vercel per una settimana | |
| A5.5 | Eliminare il secondo progetto Vercel | |
| **A6** | **Cleanup + docs** | |
| A6.1 | Aggiornare `docs/guidelines/preview-mode.md` con la nuova architettura ISR | |
| A6.2 | Aggiornare `docs/current-state.md` § Hosting e § Configuration | |
| A6.3 | Aggiungere paragrafo "Monitoring" con comandi Vercel per controllare invocation usage | |

---

## Fit Check (Cammino A)

| Req | Requirement | Status | A |
|-----|-------------|--------|:--:|
| R0 | Singolo progetto Vercel | Core goal | ✅ |
| R1.1 | Sidebar DatoCMS punta a single domain | Must-have | ✅ |
| R1.2 | Modifica → propagazione in pochi secondi | Must-have | ✅ |
| R1.3 | Visual Editing abilitabile | Leaning yes | ✅ |
| R2.1 | Function invocations ≤5% free | Must-have | ✅ |
| R2.2 | No degrado bandwidth | Must-have | ✅ |
| R2.3 | Monitoring documentato | Nice-to-have | ✅ |
| R3.1 | `SERVER` rimosso da codice | Must-have | ✅ |
| R3.2 | `prerender.ts` e `draftPreview.ts` semplificati | Must-have | ✅ |
| R3.3 | `astro.config.mjs` senza branching SERVER | Must-have | ✅ |
| R4.1 | TTFB anonymous ≤ statico attuale | Must-have | ✅ |
| R4.2 | TTFB editor accettabile | Nice-to-have | ✅ |
| R5.1 | Migrazione reversibile | Must-have | ✅ |
| R5.2 | Decommissioning dopo validation | Must-have | ✅ |
| R5.3 | Docs aggiornati | Must-have | ✅ |

**Notes:**
- ⚠️ in A3.3 sull'ambito di invalidation: scelta tra "solo URL del record" (semplice, ma index pages mostrano dati vecchi fino al TTL) vs "URL + index/sitemap" (più completo, ma più chiamate per webhook). Decisione operativa in slice A3.

---

## Rabbit holes

- **Cache key e cookies**: bisogna verificare che Vercel ISR non includa cookies nella cache key per default. Se invece le include, ogni utente loggato/diverso bypassa la cache → costo function aumenta. Pattern raccomandato: middleware imposta `Cache-Control: private` quando draft cookie presente, altrimenti lascia ISR cache. Da provare in staging.
- **Sitemap.xml** è una route a sé: con un solo URL ma list aggregata di TUTTI i record. Va invalidato a ogni publish — può essere un piccolo costo extra ma trascurabile.
- **Webhook idempotency**: DatoCMS può inviare lo stesso webhook più volte. L'endpoint `/api/revalidate` deve essere idempotente (chiamare il bypass URL N volte è sicuro: regenera N volte, ultima vince).
- **`/llms-full.txt` e `/archived-books.json`**: route a contenuto aggregato. Stesso pattern del sitemap (invalidare a ogni publish rilevante).
- **Search bundle**: `/cerca` è frontend pure (JS che chiama l'API DatoCMS Site Search direttamente), non ha SSR data fetch dipendente da contenuti. Cache-Control può essere lungo, no invalidation needed.
- **API routes** (`/api/draft-mode/*`, `/api/preview-links`, `/api/seo-analysis`, `/api/post-deploy`, `/api/preview`): devono NON essere ISR-cached. Vercel adapter ISR per default skippa le API routes; verificare con `exclude` se serve.
- **Build time vs runtime cost trade-off**: ISR significa "build veloce" (nessun pre-render) ma "primo visitatore paga" la SSR. Per route a basso traffico questo è ok; per home/index pages val la pena considerare `expiration: 60` (1 min) per evitare staleness percepito.

## No-gos

- **Tailwind 4** — shape separato.
- **gql.tada + auto-pagination** (D4-R1+R2) — shape separato; può seguire dopo.
- **Content Link / Visual Editing** (D4-R3) — shape successiva, abilitata da questa.
- **Migrazione a CDN esterno** (Netlify/Cloudflare/Bunny) per cache-tag nativo — fuori scope, restiamo su Vercel.
- **Rinominare `SERVER` per "compatibilità"** — l'env var è privata al progetto, può essere semplicemente rimossa.
- **Non toccare i pattern `@datocms/astro/Image` / `QueryListener` / `executeQuery`** — già canonici e compatibili.

---

## Slices

- [ ] **A0 — Spike: verifica ISR su `@astrojs/vercel@10`** (½ giornata)
  - Confermare opzioni `isr` (expiration, bypassToken, exclude) effettivamente disponibili nell'adapter v10
  - Test minimal: una route SSR con ISR, verificare che il primo hit genera function invocation e i successivi sono cache hit
- [ ] **A1+A2 — Switch a `output: 'server'` + cleanup SERVER** (½ giornata)
  - Aggiornare `astro.config.mjs` (output fisso, adapter con ISR config, env schema senza SERVER)
  - Rimuovere `prerender.ts`, semplificare `draftPreview.ts`
  - Aggiornare 9 file che importano `prerender`
  - Build matrix passa (solo `npm run build`, non più due varianti)
- [ ] **A3 — Webhook revalidate endpoint** (½ giornata)
  - `src/pages/api/revalidate/index.ts` con auth via `SECRET_API_TOKEN`
  - Mapping record → URL via `recordToWebsiteRoute`
  - Chiamata bypass URL per URL del record + `/` + `/sitemap.xml` (decisione su altre index in slice)
  - Test locale: simulare payload DatoCMS, verificare invalidation chain
- [ ] **A4 — Middleware cache-control per draft mode** (¼ giornata)
  - `src/middleware.ts` che vede il cookie e imposta `Cache-Control: private, no-store`
  - Test: editor in draft mode vede sempre fresh, anonymous vede cached
- [ ] **A5 — Staging deploy + smoke test** (½ giornata)
  - Deploy single-project a sottodominio di staging
  - End-to-end test: publish CMS → vedere update in <10s
  - Monitor 24-48h invocations
- [ ] **A6 — Cutover + decommissioning + docs** (½ giornata)
  - Aggiornare DatoCMS plugin Web Previews
  - Decommissioning secondo progetto Vercel
  - Update `preview-mode.md`, `current-state.md`, `TODO.md`

## Open questions

1. **Ambito invalidation (A3.3)**: oltre all'URL del record, vale la pena toccare anche home/sitemap/index pages? Proposta: sì, lista whitelist hard-coded di 3-4 URL "globali" che si invalidano sempre.
2. **TTL ISR di default**: 24h va bene? O più aggressivo (es. 1h per home, 24h per pagine record)? Proposta: 24h ovunque per partire, ottimizzare se serve.
3. **Staging deploy come?** Sottodominio temporaneo `staging.multimage.org`? Branch deploy su preview Vercel? Proposta: il preview Vercel del nuovo branch dovrebbe bastare (vedi solo lui prima di toccare la prod).

---

## Related shapes

- [astro-6-migration](2026-05-16-astro-6-migration.md) — **prerequisito** (Astro 6 e adapter v10 sono indispensabili per ISR).
- [upgrade-and-env-security](2026-05-16-upgrade-and-env-security.md) — D3 azioni Vercel (Sensitive migration) restano indipendenti.
- [cache-tags](2026-03-05-cache-tags.md) — **sovrappone parzialmente**: questa shape risolve la stessa problematica con approccio URL-based invece di tag-based. Decisione: dopo questa shape, valutare se la shape cache-tags ha ancora senso o può essere chiusa come "superseded".
- (futura) `content-link-visual-editing` (D4-R3) — abilitata da questa shape (single domain + draft mode = prerequisito Content Link).
- (futura) `gql-tada-auto-pagination` (D4-R1+R2) — indipendente.

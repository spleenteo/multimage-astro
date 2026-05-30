---
shaping: true
---

# Shape: Unificare i due progetti Vercel via ISR + bypassToken

**Status**: done (A0-A9 completati; live in produzione dal 2026-05-30. Unica azione residua non bloccante: decommissioning del secondo progetto Vercel)
**Date**: 2026-05-16
**Appetite**: ~2 giornate (con Visual Editing integrato)
**Predecessor**: richiede merge di `2026-05-16-astro-6-migration.md` (Astro 6 + adapter Vercel 10 indispensabili)

## Decisioni post-conversazione

- **Invalidation scope**: 🟡 *invalidate everything* (~1000 record × 8 publish/mese ≈ 8K invocations = ~1% budget Vercel free). Costo DatoCMS rate-limit accettato dall'utente.
- **Cache bypass per draft**: 🟡 *cookie `__prerender_bypass` (meccanismo Vercel-nativo)* affiancato al JWT cookie esistente (pattern DatoCMS canonico). Finding emerso dallo spike A0: l'adapter `@astrojs/vercel@10` espone `isr.bypassToken` che, presente come valore del cookie `__prerender_bypass`, fa bypassare la CDN. Nessun query param `?draft=1` necessario — URL editor restano puliti.
- **TTL ISR default**: 🟡 24h. Con invalidation totale a ogni publish, il TTL è di fatto un floor per le pagine non visitate.
- **Staging**: 🟡 Preview Vercel del branch (auto-deploy del push).
- **Visual Editing + Web Previews**: 🟡 integrato in questa shape (richiede draft mode su same-domain — questa shape è il prerequisito tecnico).

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
| 🟡 Cammino A scelto: SSR + ISR + invalidation totale | ~8K (~1000 record × 8 publish) + ~1-2K residual | **~1%** | ~9 GB |
| Draft mode browsing (editor team) | ~100-500 (uncached SSR) | <0,1% | trascurabile |
| All-SSR senza cache (worst case) | ~9K (1/page view) | <1% | ~9 GB |

A 9K page views/mese serve un traffico **100x** per saturare il free plan. Spike del 26 aprile (~340 visits/giorno) sarebbe stato trascurabile anche in regime full-SSR.

**Trade-off accettato**: invalidation totale fa partire ~1000 query GraphQL DatoCMS in burst a ogni publish. Rate-limit DatoCMS (40 req/sec) → completamento in ~25-75s. L'utente ha confermato che il costo DatoCMS non è un blocker.

## Outcome

- **Un solo progetto Vercel** che serve sia la produzione (statica per il visitatore) sia il preview/visual editing (dinamico per gli editor in draft mode).
- **Variabile `SERVER` eliminata** dal codice e da Vercel.
- Webhook DatoCMS → invalidation **totale** via 1 endpoint che gira il bypass su tutte le URL pubbliche.
- Function invocations attese: **~1%** del budget Vercel free.
- 🟡 **Visual Editing attivo via plugin Web Previews di DatoCMS**: editor clicca "Preview" in sidebar → atterra sul dominio prod in draft mode → vede overlay click-to-edit su testi e blocchi.

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | Singolo progetto Vercel che serve sia anonymous visitors (statico) sia editor in draft mode + visual editing (SSR) | Core goal |
| **R1** | **DX editori** | |
| R1.1 | Preview DatoCMS sidebar punta allo stesso dominio della produzione | Must-have |
| R1.2 | Modifica record → propagazione in produzione entro 60 secondi (webhook → bypass URL su tutte le pagine) | Must-have |
| 🟡 R1.3 | Visual Editing / Content Link attivo in draft mode + integrato col tab "Visual" del plugin Web Previews | Must-have |
| 🟡 R1.4 | URL editor: clean (no query param). Cache bypass via cookie Vercel-nativo `__prerender_bypass` + JWT cookie esistente | Must-have |
| **R2** | **Budget** | |
| R2.1 | Function invocations attese ≤5% del free plan Vercel (margine 20x) | Must-have |
| R2.2 | Nessun degrado bandwidth | Must-have |
| 🟡 R2.3 | Costo DatoCMS rate-limit accettato: ~1000 query/burst a ogni publish | Accepted |
| R2.4 | Monitoraggio: comandi per vedere quanti invocation/mese si stanno usando documentati | Nice-to-have |
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

`output: 'server'` permanente, ogni route SSR ma cached aggressivamente sul CDN Vercel via ISR. Anonymous visitors → response cached → cost zero. Editor con `?draft=1` → cache miss → SSR con `includeDrafts: true` + stega encoding per Visual Editing. Webhook DatoCMS → endpoint che invalida TUTTI gli URL pubblici.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Architettura ISR** | |
| A1.1 | `astro.config.mjs`: rimosso branching `SERVER`, fissato `output: 'server'`, adapter con `isr: { expiration: 86400, bypassToken, exclude: ['/api/**'] }` | |
| A1.2 | Generare e salvare `BYPASS_TOKEN` come env Vercel (Sensitive) | |
| A1.3 | TTL default 24h. Floor naturale per pagine non visitate, irrilevante per le altre (invalidate totale a ogni publish). | |
| **A2** | **Eliminare branching SERVER** | |
| A2.1 | Rimuovere `src/lib/prerender.ts` | |
| A2.2 | Semplificare `src/lib/draftPreview.ts`: `resolveDraftMode` legge solo cookie + query param `?draft=1` (entrambi richiesti per attivare draft) | |
| A2.3 | Aggiornare 9 file che importano `prerender` da `src/lib/prerender.ts` | |
| A2.4 | Rimuovere `SERVER` da `envField` schema in `astro.config.mjs` | |
| A2.5 | Rimuovere `SERVER` da Vercel env vars (entrambi i progetti) | |
| **A3** | **Webhook invalidation totale** | |
| A3.1 | Nuovo helper `src/lib/datocms/publicUrls.ts` esporta `getAllPublicUrls(): Promise<string[]>` — enumera tutti gli URL pubblici tramite query CDA + costanti hard-coded (vedi tabella sotto). Riusabile anche da `sitemap.xml.ts` in futuro. | |
| A3.2 | Endpoint `src/pages/api/revalidate/index.ts`: auth via `SECRET_API_TOKEN`. Chiama `getAllPublicUrls()`, fa `fetch` su ciascun URL con header `x-prerender-revalidate: <BYPASS_TOKEN>`. Chunked 20 in parallelo con `Promise.all`, ~250ms pausa tra chunk per stare sotto i 40 req/sec di DatoCMS. Tempo stimato: 30-45s a publish. | |
| A3.3 | **Debouncing in-memory**: variabile module-level `lastRunAt`. Se l'ultimo run è <5s fa, il webhook risponde 200 senza rilanciare (DatoCMS spesso invia burst, evitiamo doppi run). | |
| A3.4 | **Logging**: `console.log('[revalidate] ...')` con count URL invalidati, tempo totale, eventuali errori. Visibile in `vercel logs`. | |
| A3.5 | Configurare Webhook in DatoCMS (slice A8): trigger su tutti i publish/unpublish/update, target `https://www.multimage.org/api/revalidate?token=...`. | |

### URL enumerati da `getAllPublicUrls()`

| Categoria | Sorgente | Stima |
|---|---|---|
| Statici | array hard-coded: `/`, `/sitemap.xml`, `/llms-full.txt`, `/archived-books.json`, `/robots.txt`, `/libri`, `/autori`, `/magazine`, `/collane`, `/distributori`, `/cerca`, `/info` | ~12 |
| `/libri/[slug]` | CDA query `allBooks { slug }` | ~300 |
| `/libri/schede/[slug]` | stesso `allBooks` (stesso slug, route diversa) | ~300 |
| `/autori/[slug]` | CDA query `allAuthors { slug }` | ~200 |
| `/magazine/[slug]` | CDA query `allBlogPosts { slug }` | ~50 |
| `/collane/[slug]` | CDA query `allCollections { slug }` | ~20 |
| `/info/[slug]` | CDA query `allPages { slug }` | ~10 |
| **Totale stimato** | | **~900-1100 URL** |
| **A4** | **Draft mode + cache bypass via cookie `__prerender_bypass`** | |
| A4.1 | Modificare `src/lib/draftMode.ts` → `enableDraftMode()` setta DUE cookie in un colpo: (a) JWT cookie (pattern attuale, signed con `SIGNED_COOKIE_JWT_SECRET`, identifica editor autenticato) (b) `__prerender_bypass=<BYPASS_TOKEN>` (cookie Vercel-nativo, http-only, secure, sameSite=none — la CDN lo riconosce e bypassa cache). `disableDraftMode()` rimuove entrambi. | |
| A4.2 | `src/lib/draftPreview.ts`: `resolveDraftMode(Astro)` resta API pubblica invariata per le pages. Implementazione interna invariata (legge JWT cookie). | |
| A4.3 | `/api/draft-mode/enable` e `/api/draft-mode/disable` esistenti: chiamano `enableDraftMode/disableDraftMode` → setteranno/elimineranno automaticamente entrambi i cookie | |
| A4.4 | `/api/preview-links`: nessuna modifica — emette URL diretti tipo `/libri/foo`, l'enable endpoint si occupa di settare i cookie prima del redirect | |
| A4.5 | Verifica: due cookie sempre coerenti (entrambi presenti o entrambi assenti). Edge case: cookie singolo presente → trattato come anonymous (sicuro per default) | |
| **A5** | **Visual Editing (Content Link) integrato** | |
| A5.1 | `npm install @datocms/content-link` | |
| A5.2 | Aggiungere `DATOCMS_BASE_EDITING_URL` a `astro.config.mjs` envField + a Vercel | |
| A5.3 | `executeQuery` wrapper: in draft mode aggiungi `contentLink: 'v1'` + `baseEditingUrl: DATOCMS_BASE_EDITING_URL` alle option | |
| A5.4 | Nuovo componente `src/components/ContentLink.astro` che inizializza `createController().enableClickToEdit()` da `@datocms/content-link` — renderizzato condizionalmente in `BaseLayout` solo se draft mode attivo | |
| A5.5 | Aggiungere `data-datocms-content-link-boundary` agli 8 Structured Text block components in `src/components/datocms/structuredText/blocks/`: `BannerBlock.astro`, `BookCarouselBlock.astro`, `CtaButtonWithImageBlock.astro`, `ImageBlock.astro`, `SectionBlock.astro`, `SingleAuthorBlock.astro`, `SingleBookBlock.astro`, `VideoBlock.astro` | |
| A5.6 | `DraftModeQueryListener` props: aggiungi `contentLink="v1"` + `baseEditingUrl` quando attivo (per real-time updates con stega) | |
| **A6** | **CSP per Visual Tab iframe** | |
| A6.1 | Estensione `src/middleware.ts`: set header `Content-Security-Policy: frame-ancestors 'self' https://plugins-cdn.datocms.com` quando draft mode attivo (permette al plugin Web Previews di caricare il sito nell'iframe del tab "Visual") | |
| **A7** | **Staging + validation** | |
| A7.1 | Push del branch → Vercel preview auto-genera URL `chore-merge-projects-...-vercel.app` | |
| A7.2 | Smoke test: anonymous load, draft mode toggle via `/api/draft-mode/enable?redirect=/libri/x&token=...`, edit overlay click → DatoCMS apre il record | |
| A7.3 | Test end-to-end webhook: simulare publish in DatoCMS (anche solo un campo testo banale) e verificare propagazione in <60s | |
| A7.4 | Monitorare function invocations su Vercel dashboard per 24-48h | |
| **A8** | **Cutover + decommissioning** | |
| A8.1 | Merge branch in `main`, Vercel deploy automatico | |
| A8.2 | DatoCMS plugin Web Previews: aggiornare frontend URL al dominio prod unificato | |
| A8.3 | Configurare Webhook DatoCMS in dashboard (target `/api/revalidate`) | |
| A8.4 | Decommissioning del secondo progetto Vercel (preview SSR) | |
| **A9** | **Cleanup + docs** | |
| A9.1 | Aggiornare `docs/guidelines/preview-mode.md`: nuova architettura ISR + draft mode + Visual Editing | |
| A9.2 | Aggiornare `docs/current-state.md`: § Hosting (un solo progetto), § Dependencies (+ @datocms/content-link), § Configuration (- SERVER, + BYPASS_TOKEN, + DATOCMS_BASE_EDITING_URL) | |
| A9.3 | Aggiornare `docs/list-components.md` con `ContentLink.astro` | |
| A9.4 | Sezione "Monitoring" in operations.md con comandi `vercel logs` / dashboard invocation stats | |
| A9.5 | Aggiornare TODO.md (D4-R3 "content-link visual editing" → done, riferimento qui) | |

---

## Fit Check (Cammino A)

| Req | Requirement | Status | A |
|-----|-------------|--------|:--:|
| R0 | Singolo progetto Vercel | Core goal | ✅ |
| R1.1 | Sidebar DatoCMS punta a single domain | Must-have | ✅ |
| R1.2 | Modifica → propagazione <60s | Must-have | ✅ |
| 🟡 R1.3 | Visual Editing attivo + integrato col tab Visual | Must-have | ✅ |
| 🟡 R1.4 | URL editor clean + cache bypass via cookie Vercel-nativo | Must-have | ✅ |
| R2.1 | Function invocations ≤5% free | Must-have | ✅ |
| R2.2 | No degrado bandwidth | Must-have | ✅ |
| 🟡 R2.3 | Costo DatoCMS rate-limit accettato | Accepted | ✅ |
| R2.4 | Monitoring documentato | Nice-to-have | ✅ |
| R3.1 | `SERVER` rimosso da codice | Must-have | ✅ |
| R3.2 | `prerender.ts` e `draftPreview.ts` semplificati | Must-have | ✅ |
| R3.3 | `astro.config.mjs` senza branching SERVER | Must-have | ✅ |
| R4.1 | TTFB anonymous ≤ statico attuale | Must-have | ✅ |
| R4.2 | TTFB editor accettabile | Nice-to-have | ✅ |
| R5.1 | Migrazione reversibile | Must-have | ✅ |
| R5.2 | Decommissioning dopo validation | Must-have | ✅ |
| R5.3 | Docs aggiornati | Must-have | ✅ |

**Notes:**
- Tutte le decisioni open dello shaping precedente risolte.
- D4-R3 (Visual Editing) **assorbito in questa shape** (era pianificato come shape successivo): la single-domain + draft mode lo abilita naturalmente e va wired contestualmente perché il middleware è condiviso.

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

- [x] **A0 — Spike ISR su `@astrojs/vercel@10`** (completato)
  - **Trovato**: `isr` config supporta `{ bypassToken, expiration: number|false, exclude: (string|RegExp)[] }`
  - **Trovato critico**: `bypassToken` ha doppia funzione: (a) come valore del cookie `__prerender_bypass` → CDN bypassa cache (Draft Mode) (b) come header `x-prerender-revalidate` → CDN bypassa + ri-cache (on-demand ISR per webhook)
  - **Conseguenza**: stesso TOKEN serve sia per draft mode (cookie) sia per webhook (header). Una sola env var `BYPASS_TOKEN`.
  - **Design change**: niente `?draft=1` query param — uso il cookie nativo Vercel + JWT cookie esistente (vedi A4)
- [x] **A1+A2 — `output: 'server'` + cleanup `SERVER`** (commit `cf33bdd`)
  - `astro.config.mjs`: output fisso, adapter con ISR config, env schema senza SERVER, + `DATOCMS_BASE_EDITING_URL`
  - Rimuovere `prerender.ts`, aggiornare 9 file che lo importano
  - Semplificare `draftPreview.ts`: legge cookie + query `?draft=1`
  - Build singola passa (`npm run build`)
- [x] **A3 — Webhook revalidate "invalidate everything"** (commit `de51b33`)
  - Nuovo helper `src/lib/datocms/publicUrls.ts` con `getAllPublicUrls()`
  - `src/pages/api/revalidate/index.ts`: auth `SECRET_API_TOKEN`, chunked 20 in parallelo, ~250ms pausa, debouncing 5s, logging
  - Test locale: chiamare l'endpoint con curl, verificare i log riportano ~900-1100 URL invalidati
  - Configurare Webhook DatoCMS dopo cutover (in slice A8)
- [x] **A4 — Draft mode dual-cookie (JWT + `__prerender_bypass`)** (commit `87d12b8`)
  - Modificare `src/lib/draftMode.ts`: `enableDraftMode/disableDraftMode` settano/eliminano entrambi i cookie
  - `resolveDraftMode(Astro)` invariato (pages non toccate)
  - Endpoint `/api/draft-mode/{enable,disable}` invariati (delegano alle funzioni in `draftMode.ts`)
  - `/api/preview-links` invariato (URL clean)
- [x] **A5 — Visual Editing (Content Link)** (commit `932a9cb`)
  - `npm install @datocms/content-link`
  - Estendere `executeQuery` wrapper con `contentLink: 'v1'` + `baseEditingUrl` quando draft attivo
  - Nuovo `src/components/ContentLink.astro` con `createController().enableClickToEdit()`, renderizzato in `BaseLayout` se draft
  - Aggiungere `data-datocms-content-link-boundary` agli 8 block components in `src/components/datocms/structuredText/blocks/`
  - Aggiornare `DraftModeQueryListener` con props contentLink + baseEditingUrl
- [x] **A6 — CSP middleware** (commit `b8e313a`)
  - Estendere `src/middleware.ts`: in draft mode aggiungere `Content-Security-Policy: frame-ancestors 'self' https://plugins-cdn.datocms.com`
  - Test: il sito si carica nel tab "Visual" del plugin Web Previews
- [x] **A7 — Staging + smoke test** (completato 2026-05-30)
  - Smoke test eseguiti direttamente in produzione dopo merge (l'utente ha scelto deploy diretto + fix dopo, dato il rollback istantaneo Vercel e il traffico basso)
  - Verificati live: cookie dual (`__prerender_bypass` presente), `x-vercel-cache: HIT` anonimo / `BYPASS` in draft, CSP `frame-ancestors`, webhook end-to-end (669 URL in ~20s)
- [x] **A8 — Cutover + decommissioning** (completato 2026-05-30)
  - Merge in main + deploy ✓
  - Plugin Web Previews aggiornato via CLI: `previewWebhook` → `https://www.multimage.org/api/preview-links?token=...` + blocco `visualEditing.enableDraftModeUrl` (mancava → Visual Editing non si attivava)
  - Webhook DatoCMS creato via CLI: "Revalidate site cache (ISR)" id `33942`, eventi `item:publish/unpublish/delete`, auto_retry on
  - **Fix post-cutover** (vedi `docs/decision-log/2026-05-30-isr-cutover-fixes.md`):
    - CSP `frame-ancestors` esteso a `https://*.datocms.com https://admin.multimage.org` (catena iframe annidata — commit `17c9e43`)
    - `DATOCMS_BASE_EDITING_URL` corretto a URL bare senza `/environments/main` (mismatch environment)
  - Decommissioning secondo progetto Vercel: **azione utente residua** (non bloccante)
- [x] **A9 — Cleanup + docs** (questo commit)
  - `preview-mode.md` riscritta con architettura ISR + dual-cookie + Visual Editing + webhook
  - `current-state.md` aggiornata (Hosting single project, dependencies, env vars)
  - `list-components.md` aggiunto `ContentLink`, aggiornato `DraftModeQueryListener`
  - `TODO.md` entry "Unify Vercel projects via ISR" in Completed

---

## Related shapes

- [astro-6-migration](2026-05-16-astro-6-migration.md) — **prerequisito** (Astro 6 e adapter v10 sono indispensabili per ISR).
- [upgrade-and-env-security](2026-05-16-upgrade-and-env-security.md) — D3 azioni Vercel (Sensitive migration) restano indipendenti.
- [cache-tags](2026-03-05-cache-tags.md) — **superseded** da questa shape (approccio URL-based + invalidation totale invece di tag-based granulare).
- 🟡 `content-link-visual-editing` (D4-R3) — **assorbito in A5+A6** di questa shape.
- (futura) `gql-tada-auto-pagination` (D4-R1+R2) — indipendente.

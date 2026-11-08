# DatoCMS Patterns Review (2026-05-16)

> Riferimento: shape `docs/shapes/2026-05-16-upgrade-and-env-security.md` slice D4.
> Skill consultate: `datocms-cda`, `datocms-frontend-integrations`, `datocms-cma`, `datocms-cli`.
> Pacchetti post-D2: `astro` 5.18.1, `@astrojs/astro` 0.6.12, `@datocms/cda-client` 0.2.10, `@datocms/cma-client` 5.4.18, `datocms` (CLI) 4.0.27.

## TL;DR

- Pattern **CDA + draft mode + responsive images + Structured Text** sono allineati alle best practice canoniche delle skill. Niente da rifare in profondità.
- 3 gap che valgono uno **shape dedicato**: (a) `gql.tada` type generation per i risultati GraphQL, (b) `executeQueryWithAutoPagination` per le query `first: 500`, (c) **Content Link / Visual Editing** in preview deployment.
- 4 follow-up rapidi da `TODO.md` senza shape: `ApiError` boundary handling, `security.checkOrigin: false` per preview, allineamento `DRAFT_MODE_COOKIE_NAME` context, automazione `list-models.md` via `datocms schema:inspect`.
- CMA v5 e CLI v4 sono ora attivi e funzionanti — superficie d'uso limitata, nessuna azione obbligatoria.

---

## Findings per area

### 1. CDA / GraphQL data loading

**Stato corrente.** `src/lib/datocms/executeQuery.ts:12-28` wrappa `@datocms/cda-client` con un'API pulita: token resolution via `includeDrafts`, `excludeInvalid: true` di default, propagazione di `environment` e `variables`. I `_graphql.ts` co-locati a `pages/` e `components/` sono il pattern raccomandato dalle skill.

**Allineato alla best practice:**

- `executeQuery` invocato sempre attraverso il wrapper, mai raw fetch.
- `excludeInvalid: true` default (skill raccomanda esattamente questo per produzione).
- GraphQL variables usate sistematicamente (`$slug`, `$first: IntType!`, `$skip: IntType!`) — niente string interpolation.
- Token in env var, mai hardcoded.
- Co-location query + result types in `_graphql.ts` accanto al consumer.

**Gap rilevanti:**

1. **Nessun type-generation automatico.** I result types come `HomePageQueryResult` (`src/pages/index/_graphql.ts:166-178`), `BookPageQueryResult`, `AuthorPageQueryResult` sono scritti a mano. La skill `datocms-cda` raccomanda `gql.tada` per:
   - tipi auto-derivati dallo schema (impossibile dimenticare un campo)
   - `FragmentOf<>` / `ResultOf<>` / `VariablesOf<>`
   - validazione query-time tramite TS plugin
   
   La setup richiede: `npm install gql.tada`, `npm run generate-schema` per produrre `schema.graphql`, tsconfig plugin `gql.tada/ts-plugin`, `src/lib/datocms/graphql.ts` con `initGraphQLTada` e mapping degli scalar custom (`ItemId`, `IntType`, `DateTime`, ...). Output: `graphql-env.d.ts`. Migrare i `_graphql.ts` uno a uno (~30 file).

2. **`first: 500` hard cap in 7 query.** Quando il CMS supera 500 record di un modello, queste query perdono dati **silenziosamente**:
   - `src/pages/magazine/[slug]/_graphql.ts:169` (`allBlogPosts`)
   - `src/pages/autori/index/_graphql.ts:13,33` (`allAuthors`, `allBooks`)
   - `src/pages/autori/[slug]/_graphql.ts:82` (`allAuthors`)
   - `src/pages/sitemap.xml/_graphql.ts:12,20,24` (`allBooks`, `allAuthors`, `allBlogPosts`)
   - `src/pages/staff/archivio-catalogo/_graphql.ts:3` (`allBooks`)
   - `src/pages/info/[slug]/_graphql.ts:140` (`allPages`, hard-cap a 200)
   - `src/pages/distributori/_graphql.ts:14` (hard-cap a 300)
   
   `llms-full/_graphql.ts` ha già implementato pagination manuale con `$first/$skip` — pattern correttoa, ma la skill raccomanda `executeQueryWithAutoPagination` di `@datocms/cda-client` (gestisce internamente la pagination via aliased selections in una sola query). Gap già tracciato come **CD2** in `TODO.md`.

3. **Nessuna integrazione cache tags.** Il wrapper non passa attraverso `rawExecuteQuery` né legge `x-cache-tags`. Vercel non riceve mai tags da invalidare → ogni publish DatoCMS triggera un full rebuild invece di invalidare solo le pagine toccate. Già coperto dallo shape `2026-03-05-cache-tags.md`.

4. **Nessun `ApiError` catch boundary.** `executeQuery(...)` viene invocata senza try/catch nella maggior parte delle pages (es. `src/pages/index.astro:105`, `src/layouts/BaseLayout.astro:80`, `src/pages/distributori/index.astro:16`). Un errore CDA propaga e fa 500 sulla route. Le skill suggeriscono di catturare `ApiError` ai boundary giusti (es. layout SSR per fallback graceful, route per error message dedicato). Su SSG non è critico (errore = build fail = lo vedi subito), ma su `SERVER=preview` (SSR) sì.

### 2. Frontend integrations

**Stato corrente.** Il progetto allinea il pattern Astro canonico in modo molto stretto: `@datocms/astro/Image` in ~15 componenti, `QueryListener` wrappato da `DraftModeQueryListener` (`src/components/DraftModeQueryListener/index.astro`), draft mode JWT signed cookie (`src/lib/draftMode.ts`), preview links endpoint che usa `itemType.attributes.api_key`.

**Allineato alla best practice (canoniche skill `datocms-frontend-integrations` per Astro):**

- `Image` da `@datocms/astro/Image` con `responsiveImage(imgixParams: {...})` lato GraphQL — perfetto, niente più da fare.
- `RESPONSIVE_IMAGE_FRAGMENT` riusato ovunque (`src/lib/datocms/commonFragments.ts:14-26`) — match esatto della firma raccomandata.
- `DraftModeQueryListener` con `Props` che omette `includeDrafts`/`token`/`excludeInvalid` (`src/components/DraftModeQueryListener/index.astro:9-12`) → impossibile bypassare token gating dal chiamante. Best-practice exact.
- Preview links endpoint switch via `itemType.attributes.api_key` (string) e non model ID numerico — Astro-correct, skill esplicita questa differenza rispetto a Next/SvelteKit/Nuxt.
- Draft mode JWT con `partitioned: true` (cast `as AstroCookieSetOptions`) — pattern raccomandato fino a quando Astro non aggiorna i tipi cookie.

**Gap rilevanti:**

1. **Niente Content Link / Visual Editing.** Quando un editor è in draft mode su preview deployment, le skill raccomandano:
   - `contentLink: 'v1'` + `baseEditingUrl` nelle option di `executeQuery` (solo in draft)
   - componente `<ContentLink />` che inietta `createController().enableClickToEdit()` da `@datocms/content-link`
   - boundaries (`data-datocms-content-link-boundary`) su blocchi Structured Text custom + `data-datocms-content-link-group` wrapper su `StructuredText`
   - per campi non-stega (numeri, booleani, date) usare `_editingUrl` + `data-datocms-content-link-url`
   
   Risultato editoriale: l'editor vede overlay click-to-edit direttamente sul preview, salta il giro "trova il record in DatoCMS → modifica → torna su preview". DX significativo, niente downside per la produzione (codice contentLink attivo solo quando `includeDrafts === true`).

2. **`security.checkOrigin: false` mancante in `astro.config.mjs`.** La skill richiede questa opzione per permettere a DatoCMS di fare POST verso `/api/preview-links` quando il deployment è in SSR mode (`SERVER=preview`). Da verificare: se i preview links funzionano oggi, è perché Astro 5 non applica `checkOrigin` con la stessa rigidità, o perché Vercel preview ha un origin riconosciuto. Aggiungere esplicitamente toglie ambiguità.

3. **`DRAFT_MODE_COOKIE_NAME` context divergente.** `astro.config.mjs:45-49` lo dichiara `context: 'server', access: 'secret', optional: true`. La skill canonica lo mette su `context: 'client', access: 'public'`. Impatto: zero a runtime perché il cookie attualmente non viene mai letto lato client. Ma se in futuro si aggiunge una banner UI "draft mode attivo" che legge il cookie, va spostato. Decisione minore — può restare server-only se documentata.

4. **Logo header/footer remoto senza dimensioni intrinseche.** `docs/current-state.md:49` flagga già il problema. La skill raccomanda di passare anche i logo statici da `@datocms/astro/Image` (oppure usare un width/height esplicito + `loading="eager"` per LCP). Non è un finding nuovo della review, ma vale ricordarlo qui per completezza.

### 3. CMA usage

**Stato corrente.** Superficie minima — `@datocms/cma-client` v5.4.18 usato in 3 punti:

- `src/pages/api/post-deploy/index.ts:1,107` — `buildClient()`, `client.plugins.rawList()`, `client.plugins.create()`, `client.plugins.update()`. Setup post-deploy dei plugin Web Previews e SEO Analysis.
- `src/pages/api/seo-analysis/index.ts:1,63` — `buildClient({ apiToken, environment })`, `client.items.rawFind()`. Endpoint per il plugin SEO/Readability.
- `src/pages/api/utils.ts:1` — solo import del tipo `ApiError`.

**Allineato alla best practice:**

- API stabili tra v4 e v5, nessuna modifica necessaria dopo l'upgrade D2.4.
- `buildClient` invocato server-side (env vars secret), mai esposto al browser.
- Uso di `rawFind`/`rawList` quando si vuole l'oggetto raw con `data.attributes` (corretto: SEO analysis ha bisogno di accedere a `attributes` direttamente).

**Gap rilevanti:** nessuno significativo.

**Opportunità minore.** CMA v5 introduce typed responses via i tipi generati da `schema:generate`. Se in futuro si aggiunge logica di scrittura più articolata (es. backfill, migrations programmatiche, plugin custom), si possono importare i tipi di `schema.ts` e ottenere autocomplete su attributes/relationships. Per ora la superficie è troppo piccola perché valga la pena.

### 4. CLI v4

**Stato corrente.** CLI `datocms` 4.0.27 attiva. Usata solo per `npm run sync-datocms` → `datocms schema:generate schema.ts`.

**Allineato alla best practice:**

- Schema generato, mai modificato a mano.
- Token via env var (`DATOCMS_API_TOKEN`).
- Nessun `datocms.config.json` — accettabile perché c'è un solo profilo e un solo environment.

**Opportunità (non gap critici):**

1. **`datocms schema:inspect`** — nuovo in v4. Emette JSON con tutti i modelli, campi, fieldsets, blocchi nested e relazioni. Si può scriptare per auto-generare `docs/list-models.md` invece di mantenerlo a mano. Riduce drift docs/CMS.
2. **`datocms cma:script`** — esegue script TypeScript one-off contro CMA con il client già configurato. Utile per:
   - backfill di campi (es. quando il content team aggiunge una validazione che invalida record esistenti)
   - export ad-hoc (CSV, JSON dump per analytics)
   - migrations programmatiche prima di toccare lo schema
3. **`datocms migrations:new/run`** — sistema di migration scripts versionate. Diventa rilevante quando l'editorial team richiede cambi schema ricorrenti che vogliamo replay-are tra environments. Per ora il progetto fa schema management a mano sul CMS — accettabile finché non si introducono ambienti staging/sandbox.
4. **`datocms cma:docs`** — apre la reference API CMA in CLI. Solo DX, niente da configurare.

---

## Recommendations

| ID | Area | Cosa | Perché | Effort | Impatto | Diventa shape? |
|----|------|------|--------|--------|---------|----------------|
| **D4-R1** | CDA | Introdurre `gql.tada` type generation + migrare i ~30 `_graphql.ts` | Elimina ~500 righe di tipi scritti a mano. Type-safety end-to-end query → result. Zero drift schema/codice. | L | H | **Sì** — shape dedicato |
| **D4-R2** | CDA | Sostituire `first: 500` con `executeQueryWithAutoPagination` nelle 7 query | Evita data loss silenzioso quando i modelli crescono. Già tracciato come CD2 in TODO.md. | M | H | **Sì** — sovrappone con `CD2`, può diventare slice dello shape gql.tada |
| **D4-R3** | Frontend | Implementare Content Link + Visual Editing in preview | Editorial DX: click-to-edit overlay sul preview deployment. Riduce friction nelle review redazionali. Solo attivo in draft mode. | M | H | **Sì** — shape dedicato |
| **D4-R4** | Cross | Cache tags integration (riferimento shape esistente) | Invalidazione granulare invece di full rebuild. Critico se i tempi di build crescono. | M | M | Già coperto da `2026-03-05-cache-tags.md` |
| **D4-R5** | CDA | Catch `ApiError` ai boundary giusti (layout SSR, route SSR) | Su `SERVER=preview` un errore CDA fa 500 spaventoso. Su SSG meno critico. | S | M | No — follow-up in TODO.md |
| **D4-R6** | Frontend | Aggiungere `security: { checkOrigin: false }` a `astro.config.mjs` | Disambigua il funzionamento di `/api/preview-links` in SSR mode. | S | L | No — follow-up rapido in TODO.md |
| **D4-R7** | CLI | Script che usa `datocms schema:inspect` per generare `docs/list-models.md` automaticamente | Elimina drift CMS ↔ docs. Hook in CI o `npm run docs:inventory`. | S | M | No — follow-up in TODO.md |
| **D4-R8** | CLI | Considerare migrations system quando si introdurranno environments staging | Replay schema changes tra environments. Solo se/quando staging arriva. | L | L | Differire — non shape ora |
| **D4-R9** | Frontend | Decidere se spostare `DRAFT_MODE_COOKIE_NAME` a `context: 'client'` | Allineamento canonico. Impatto runtime zero finché nessun client code legge il cookie. | S | L | No — solo se serve client-side |

**Priorità suggerita** (ordine di esecuzione):

1. **D4-R1 + D4-R2 insieme** in un nuovo shape `gql.tada + auto-pagination`. Sono complementari: introdurre gql.tada è il momento giusto per toccare i `_graphql.ts` anche per la pagination.
2. **D4-R3** in shape separato `content-link-visual-editing`. Lavoro frontend-puro, indipendente.
3. **D4-R5, D4-R6, D4-R7, D4-R9** come singoli entry in `TODO.md`. Effort small, nessuna shape necessaria.
4. **D4-R4** già coperto da `cache-tags` shape — non duplicare.

---

## Non-issue confermati

- **`@datocms/astro/Image` ubiquitous + `RESPONSIVE_IMAGE_FRAGMENT`** — pattern canonico, niente da rivedere.
- **`@datocms/astro/QueryListener` via `DraftModeQueryListener`** — wrapping corretto, Props gating impeccabile.
- **`isDraftModeEnabled` accetta sia `APIContext` sia `AstroCookies`** — match esatto pattern di riferimento.
- **`buildClient` CMA v5** — superficie d'uso (3 file) compatibile senza modifiche dopo upgrade D2.4.
- **CLI `schema:generate`** + script `sync-datocms.mjs` — workflow corretto, regenera tipi numerici post-CLI v4.
- **Query variables (no string interpolation)** — usate sistematicamente.
- **`excludeInvalid: true` default nel wrapper** — già la scelta giusta per produzione.

---

## Out of scope (deliberatamente non trattato)

- **Astro 6** — già pianificato in shape successivo a D4 (vedi findings D2 sui CVE pendenti).
- **Tailwind 4** — shape dedicato a parte (decisione utente in D2).
- **XSS in `toRichTextHtml` + `set:html`** — già coperto da `security-baseline` slice S2.
- **`/staff` route senza auth, `/llms-full.txt` pubblico, `/api/post-deploy` leak** — `security-baseline`.
- **Generazione automatica di `_graphql.ts` da schema** — sproporzionato rispetto al beneficio; `gql.tada` (D4-R1) copre già la parte che conta.

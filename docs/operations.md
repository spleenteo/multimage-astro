**Deployments**

- Default deployment target is Vercel; README documents linking the repo, syncing env vars, and running `vercel deploy --prod`; build command is `npm run build` with static output in `dist/` (README.md:57-80, astro.config.mjs:1-18).
- A `wrangler.toml` is present for Cloudflare Pages with `pages_build_output_dir = "./dist"`, but there is no Cloudflare adapter configured, so deployments there remain manual (wrangler.toml:1-3).
- Local dev (`npm run dev`) ora invoca `npm run sync-datocms` prima di `npm run ensure-swiper`, generando lo `schema.ts` (se `DATOCMS_API_TOKEN` è disponibile; lo script legge automaticamente anche dal file `.env` e propaga eventuali `DATOCMS_CMA_TOKEN` legacy) e scaricando `https://www.datocms.com/docs/llms-full.txt` in `DATOCMS.md` solo quando cambia, così documentazione e tipi restano aggiornati senza touching manuali (package.json:7-15, scripts/sync-datocms.mjs:1-110).

**Environment & Secrets**

- DatoCMS tokens (`DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_API_TOKEN` per gli strumenti CLI) plus eventual preview secrets (riintroducili solo quando implementi `/api/preview`) sono dichiarati in datocms.json, ma solo il token pubblicato è validato via Astro env schema (datocms.json:1-31, astro.config.mjs:6-16).
- Il token locale per la CLI (`DATOCMS_API_TOKEN`) può essere un ruolo “Read-only” o dedicato allo schema generation; rimane opzionale su Vercel perché la pipeline cloud non rigenera lo schema (scripts/sync-datocms.mjs:1-110).
- `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` non è referenziato dal codice; tienilo fuori da Vercel finché non esiste una pipeline di preview e prevedi una rotazione se era stato condiviso (src/lib/datocms/executeQuery.ts:13-26).
- Su Vercel sono indispensabili `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, oltre a `NODE_ENV=production`; il token CLI (`DATOCMS_API_TOKEN`) resta facoltativo e può stare solo negli ambienti di sviluppo (datocms.json:1-31, astro.config.mjs:6-16).
- `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` (server-only, GraphQL CDA) e `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` (client-side, Site Search API) vanno mantenuti separati: il primo offre accesso completo ai contenuti pubblicati via query personalizzate e non deve uscire dal build server; il secondo espone solo l’indice pubblico per la ricerca e può vivere nel browser senza rischiare dati sensibili (src/lib/datocms/executeQuery.ts:1-21, src/pages/cerca/index.astro:10-78).
- Per `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` crea in DatoCMS un ruolo dedicato (es. “Search Role”) con l’unico permesso **Perform Site Search API calls**, poi genera da Site Search → API tokens un token associato a quel ruolo; non usare token CDA/CMA o ruoli con privilegi aggiuntivi, perché il valore finisce nel browser. Evita ruoli “Admin” o “Editor” per il token della ricerca pubblica.
- Oltre ai token, il runtime legge variabili standard come `NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL` e `NETLIFY`; attiva solo quelle necessarie su Vercel (`NODE_ENV`, `VERCEL`) e documenta gli interruttori opzionali per gli script locali (scripts/build-search-client.mjs:26-31).
- Public runtime expects `PUBLIC_SITE_URL` per la sitemap e `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` per la pagina di ricerca; valori mancanti causano errori di build (src/pages/sitemap.xml.ts:5-44, src/pages/cerca/index.astro:6-28).

**Preview & Drafts**

- There is no `/api/preview` endpoint, DraftMode toggler, or QueryListener implementation even though AGENTS.md calls for them; as a result editors cannot trigger draft previews or live updates (AGENTS.md:73-89, src/lib/datocms/executeQuery.ts:13-26).
- `executeQuery` always uses the published CDA token, so draft mode cannot be enabled without code changes; this also prevents secure gating of preview tokens (src/lib/datocms/executeQuery.ts:13-26).

**Monitoring & Logging**

- Client monitoring relies on Google Analytics (legacy UA), Vercel Analytics, and Vercel Speed Insights; there is no server-side logging, error tracking, or health checks configured (src/layouts/BaseLayout.astro:132-210).
- No CI/CD workflow exists to run builds before deployment; deployments rely on developers running `npm run build` manually as per README instructions (README.md:49-66).

**Gaps & Recommendations**

- Protect the `/staff` routes before deploying; add authentication middleware or move the catalogue export into a secured API function (src/pages/staff/index.astro:1-55).
- Document required environment variables in a dedicated ops runbook and add validation for draft/CMA tokens similar to the published token check (astro.config.mjs:6-16, .env.example:1-3).
- L’endpoint prerender `src/pages/llms-full.txt.ts` genera il file `/llms-full.txt` durante la build; non servono script manuali, ma documenta quando aggiornare la logica se cambia la struttura del catalogo (src/pages/llms-full.txt.ts, src/pages/llms-full/\_graphql.ts).

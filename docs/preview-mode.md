---
agent_edit: true
scope: How to manage draft preview for editors
---

# Preview & Draft Mode

Multimage now exposes a full Draft Mode pipeline so editors can review unpublished
DatoCMS content (with live query updates) on Vercel without switching the public
site away from static output. `/api/*` routes run as Vercel serverless functions
while every page stays prerendered.

## 1. Access control & secrets

1. Provision these environment variables locally and on every Vercel project:
   - `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` – draft-only CDA token scoped to the
     Multimage project.
   - `SECRET_API_TOKEN` – arbitrary preview secret shared between `/api/preview`,
     `/api/draft-mode/enable`, and the Post-Deploy/Preview Links webhooks.
   - `SIGNED_COOKIE_JWT_SECRET` – random string used to sign the Draft Mode
     cookie (`astro` handles the cookie name/value).
   - `DRAFT_MODE_COOKIE_NAME` – facoltativo; imposta il nome effettivo del
     cookie (default: `multimage_draft_mode`). Il backend e gli strumenti DatoCMS
     utilizzano sempre questo valore, quindi evita virgolette/incapsulamenti
     nello `.env`.
2. Editors can enter preview via either of these flows:
   - Visit `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso`. The
     endpoint validates the secret, enables Draft Mode via a signed cookie, and
     307-redirects to the requested route.
   - Inside DatoCMS, the **Web Previews** plugin hits
     `/api/draft-mode/enable?url=/percorso&token=<SECRET_API_TOKEN>`, then
     returns a draft link. Published links still go through
     `/api/draft-mode/disable` so the cookie is cleared.
3. Anyone without the secret continua a vedere solo i contenuti pubblicati. Il
   cookie è partitioned/secure, quindi non può essere creato da origini esterne.

## 2. Fetching draft data safely

- `src/lib/datocms/executeQuery.ts` now accepts `{ includeDrafts: true }` and
  automatically swaps the CDA token. Every page/component that calls
  `executeQuery` reads `isDraftModeEnabled(Astro.cookies)` and forwards the flag,
  so the same templates power both published and draft renders.
- Draft-only CDA tokens never reach the browser. They are only passed to
  `@datocms/cda-client` on the server and to Query Listeners when (and only when)
  Draft Mode is active for the current request.
- API routes that need preview data can call `enableDraftMode(event)`/
  `isDraftModeEnabled(event)` using the same helper exported by
  `src/lib/draftMode.ts`.

## 3. UI helpers & live updates

- `DraftModeToggler` (floating pill rendered by `BaseLayout`) lets editors enter
  or exit preview without memorising URLs. When enabling preview it prompts for
  `SECRET_API_TOKEN`, calls `/api/preview` with the current path, and reloads the
  page after the cookie flips.
- Pages import `DraftModeQueryListener` from `~/components/DraftModeQueryListener`
  and render it with the same GraphQL document/variables used by their
  `executeQuery` call. When DatoCMS emits an update for that query, the listener
  reloads the page so the newest draft content appears automatically.
- The component only renders when Draft Mode is active (so draft tokens never
  leak to anonymous visitors). It internally relies on `datocms-listen`.

## 4. Workflow on Vercel

1. Deploy the branch to any Vercel environment. The build targets
   `output: "server"` e i percorsi alimentati dal CMS esportano
   `export const prerender = false;`, quindi ogni richiesta passa dal server
   (Draft Mode funziona anche sui deploy Vercel preview/prod).
2. Editors open `/api/preview?secret=...&redirect=/pagina` once per browser
   session or use the Toggler prompt.
3. As they edit content in DatoCMS, the Query Listener reloads the page when the
   matching query updates. Poiché le pagine sono server-rendered, le bozze sono
   visibili sia localmente sia su Vercel (preview/prod), basta aver attivato la
   modalità Draft con l’endpoint o il Toggler.
4. Exiting preview is as simple as hitting `/api/draft-mode/disable?url=/pagina`
   or clicking “Esci dalla bozza” in the Toggler.

> ⚠️ `npm run preview` serves the static `dist/` output and cannot read draft
> cookies, even though il resto del sistema è ormai SSR. Usa `npm run dev`
> (eventualmente con `--port <n>`) oppure un deployment su Vercel per verificare
> le bozze.

### Required Vercel settings

| Variable | Value |
| --- | --- |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | Published-only CDA token |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | Draft-only CDA token |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | Site Search token (already public) |
| `SECRET_API_TOKEN` | Shared preview secret (store per-environment) |
| `SIGNED_COOKIE_JWT_SECRET` | Random string, eg. `openssl rand -hex 32` |
| `PUBLIC_SITE_URL` | `https://www.multimage.org` (or env-specific URL) |

Use `vercel env pull`/`vercel env add` to sync secrets locally. CI will fail if
any required schema entry is missing thanks to `env.validateSecrets` in
`astro.config.mjs`.

## 5. Troubleshooting

- **403/401 on `/api/preview`** → verify `SECRET_API_TOKEN` matches the stored
  value (remember that Vercel differentiates Production, Preview, and
  Development envs).
- **Draft Mode cookie present but published content still visible** → ensure the
  page/component wraps its query with `DraftModeQueryListener` *and* passes
  `includeDrafts` to `executeQuery`.
- **Missing live reload** → check the browser console for `QueryListener`
  messages. If the component threw an error, it usually means the draft token is
  absent or the query/variables are not serialisable.
- **Need to revoke access** → rotate `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`,
  and the draft CDA token. No deploy changes are required because the code reads
  env vars at runtime via `astro:env`.
- **Preview page still shows published content su Vercel** → assicurati di aver
  chiamato `/api/preview?secret=...` sulla stessa origine del deployment e che
  la pagina in questione esporti `prerender = false`. Se il cookie è presente ma
  il contenuto resta pubblicato, controlla i log serverless (funzione
  `_render`) per errori lato query.
- **DatoCMS Web Previews plugin** → l’endpoint `/api/preview-links` implementa il
  webhook del plugin. Ogni deploy (preview o prod) richiama `/api/post-deploy`,
  che aggiorna automaticamente il plugin aggiungendo i due “frontends”:
  `Production` (usa `PUBLIC_SITE_URL`) e `Preview` (l’URL del deployment
  corrente). Se aggiungi nuovi modelli o rotte, ricorda di aggiornare
  `recordToWebsiteRoute` perché il plugin sappia come costruire gli URL.
- **401 or missing query params on `/api/preview`** → usually indicates you’re
  hitting the static preview server instead of the dev server. Make sure `npm
  run dev` is running and note the port printed in the banner (4321 by default;
  Astro auto-increments when the port is busy). When you run `npm run preview`
  or access `/api/preview` from the prerendered `dist/`, the handler always
  returns 401 because query parameters are stripped.

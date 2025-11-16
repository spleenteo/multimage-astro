# Multimage Astro

This project powers the multimage.org frontend with Astro and DatoCMS. Follow the steps below to get a local copy running quickly and keep it in sync with the headless CMS.

## Prerequisites

- Node.js 20.x (use `nvm install 20` if needed)
- npm 10.x (bundled with modern Node releases)
- Access to the Multimage DatoCMS project (tokens listed in `datocms.json`)

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Create a `.env` file at the repo root and provide the required tokens. At minimum you need the published CDA token; add CMA if you plan to regenerate the schema.

```bash
cp .env.example .env
```

```bash
SERVER=static
DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN=your_published_token
DATOCMS_DRAFT_CONTENT_CDA_TOKEN=your_draft_token
PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN=your_public_search_token
PUBLIC_SITE_URL=https://www.multimage.org
SECRET_API_TOKEN=preview_secret_shared_with_dato
SIGNED_COOKIE_JWT_SECRET=random_64_char_secret
DRAFT_MODE_COOKIE_NAME=multimage_draft_mode
DATOCMS_CMA_TOKEN=optional_schema_token

> Nota: evita di racchiudere i valori tra virgolette nello `.env` (soprattutto
> `SECRET_API_TOKEN` e `DRAFT_MODE_COOKIE_NAME`), altrimenti i confronti lato
> server falliscono. Imposta `SERVER=preview` quando devi testare le preview in
> locale; lascia `SERVER=static` (o ometti la variabile) per simulare la build
> pubblica.
```

See `docs/DATOCMS.md` for the authoritative description of models and fields.

## 3. Generate the DatoCMS Schema

If the schema changed upstream, regenerate the local TypeScript bindings before running the app:

```bash
npm run generate-schema
```

This command uses the DatoCMS CLI to update `schema.ts`. The file is auto-generated—do not edit it manually.

## 4. Start the Development Server

```bash
npm run dev
```

Astro boots on `http://localhost:4321/` with hot reload (it auto-increments to
4322/4323 when the port is busy). Pass `npm run dev -- --port 5173` if you need
to bind a specific port. Edits under `src/pages/`, `src/components/`, and
`src/lib/` are reflected immediately.

## 5. Build & Preview Locally

Before deploying or sharing changes, run:

```bash
npm run build
npm run preview
```

`npm run build` executes `astro check` and honours the `SERVER` env var. With
`SERVER=static` (default) Astro switches to `output: 'static'` and writes only
`dist/` (pure SSG). With `SERVER=preview` the build stays fully SSR (via the
Vercel adapter) so every route can read Draft Mode cookies. `npm run preview`
always serves the static `dist/` snapshot; Draft Mode and `/api/preview` will
return 401 there because no server runtime executes.

## 6. Preview Draft Content

Previewing unpublished entries relies on the `SERVER` split:

- `SERVER=static` (production) prerenders every public route and does not
  include runtime preview APIs.
- `SERVER=preview` (preview Vercel project or local dev) runs the entire app in
  SSR so Draft Mode cookies can toggle draft CDA tokens per request.

1. Make sure `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, and
   `SIGNED_COOKIE_JWT_SECRET` are set (see the `.env` snippet above). `npm run
dev` fails fast if they are missing.
2. Visita `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso` una volta
   per sessione (oppure usa il plugin **DatoCMS Web Previews**, che chiama lo
   stesso endpoint). L’API valida il segreto, imposta il cookie e reindirizza
   alla pagina richiesta.
3. Ogni pagina alimentata dal CMS esporta `export { prerender } from
'~/lib/prerender'`: viene prerenderizzata quando `SERVER=static` e resta SSR
   quando `SERVER=preview`. `DraftModeQueryListener` si iscrive alla query
   GraphQL e ricarica automaticamente la pagina quando un editor salva in
   DatoCMS.
4. Esci dalla preview passando da `/api/draft-mode/disable?url=/percorso` (anche
   il plugin invia questa chiamata). Il cookie viene cancellato e torni alla
   versione pubblicata.

> **Nota:** `npm run preview` continua a servire lo snapshot statico di `dist/` e
> quindi ignora i cookie di Draft Mode. Usa `npm run dev` (eventualmente con
> `--port <n>`) o `vercel dev`/un deployment su Vercel quando vuoi verificare le
> bozze.

## 7. LLM Knowledge Export

Astro prerenders `/llms-full.txt` via `src/pages/llms-full.txt.ts`, producing a machine-readable Markdown dump alongside the rest of the site. Each build emits `dist/llms-full.txt`, which includes:

- Le sezioni introduttive (“Chi siamo” e “La storia”) estratte dalle relative pagine DatoCMS.
- L’intero catalogo con titoli, sottotitoli, URL assoluti, collane, recensioni, disponibilità e biografie complete degli autori.

Per rigenerare il file è sufficiente eseguire `npm run build` (oppure `npm run dev`, che calcola comunque l’endpoint). Non sono necessari script aggiuntivi.

## 8. Deploying Fast

- **Vercel** (canonical): link the repo twice — one project for production (`SERVER=static`) and another for previews (`SERVER=preview`). Run `vercel login`, then `vercel link --project multimage-astro --yes` (prod) and `vercel link --project multimage-astro-preview --yes` (example name) inside the repo. Sync the required environment variables (`SERVER`, `DATOCMS_*`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DRAFT_MODE_COOKIE_NAME`, etc.) with `vercel env pull`. Production deploys a pure static snapshot; the preview project runs full SSR (pages + `/api/preview`, `/api/draft-mode/*`, `/api/preview-links`, `/api/seo-analysis`) so editors can see drafts instantly.
- **Manual upload**: run `npm run build` and publish the `dist/` directory.

For contribution guidelines, coding style, and DatoCMS conventions, see `AGENTS.md`. Keep `docs/DATOCMS.md` open while working—it is the source of truth for the content model and avoids needless web searches.

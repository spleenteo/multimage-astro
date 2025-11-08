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
> server falliscono.
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

`npm run build` executes `astro check` and runs the Vercel adapter in server
mode. `dist/` still contains the prerendered HTML while `.vercel/output/`
collects the serverless entrypoints used for `/api/*`. `npm run preview` serves
the `dist/` snapshot only; Draft Mode and `/api/preview` will return 401 there
because no server runtime executes.

## 6. Preview Draft Content

Previewing unpublished entries now follows the same flow in development and on
Vercel, because the CMS-driven routes render on the server (no prerendering) so
Draft Mode cookies are honored ovunque:

1. Make sure `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, and
   `SIGNED_COOKIE_JWT_SECRET` are set (see the `.env` snippet above). `npm run
dev` fails fast if they are missing.
2. Visit `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso` once per
   browser session (or use the floating “Anteprima” pill rendered by
   `DraftModeToggler`). The endpoint validates the secret, drops the signed
   cookie, and redirects you to the requested page.
3. Every CMS-driven page runs on the server (`prerender = false`) and passes
   `includeDrafts` to `executeQuery`, so Draft Mode works on `npm run dev`,
   `vercel dev`, Vercel preview, and Vercel production. `DraftModeQueryListener`
   subscribes to the underlying GraphQL query and automatically reloads when a
   content editor hits “Save” in DatoCMS.
4. Exit preview through `/api/draft-mode/disable?url=/percorso` or the
   “Esci dalla bozza” button on the pill. The cookie is deleted and the site
   returns to published content.

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

- **Vercel** (canonical): the repository is linked to the `multimage-astro` project on your personal account. Run `vercel login`, then `vercel link --project multimage-astro --yes` inside the repo. Sync the required environment variables (`DATOCMS_*`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DRAFT_MODE_COOKIE_NAME`, etc.) with `vercel env pull`. Deploy with `vercel deploy --prod`; the build runs the Vercel adapter in server mode so `/api/*` **e tutte le pagine collegate al CMS** girano come funzioni serverless, consentendo l’uso del Draft Mode anche sui deploy preview/prod. `dist/` viene comunque prodotto nel caso servano asset statici legacy.
- **Manual upload**: run `npm run build` and publish the `dist/` directory.

For contribution guidelines, coding style, and DatoCMS conventions, see `AGENTS.md`. Keep `docs/DATOCMS.md` open while working—it is the source of truth for the content model and avoids needless web searches.

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
DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN=your_readonly_token
PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN=your_public_search_token
DATOCMS_CMA_TOKEN=optional_schema_token
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

Astro boots on `http://localhost:4321/` with hot reload. Edits under `src/pages/`, `src/components/`, and `src/lib/` are reflected immediately.

## 5. Build & Preview Locally

Before deploying or sharing changes, run:

```bash
npm run build
npm run preview
```

`npm run build` executes `astro check` for static analysis and produces the static site in `dist/`. `npm run preview` serves that output so stakeholders can review it quickly.

## 6. LLM Knowledge Export

Astro prerenders `/llms-full.txt` via `src/pages/llms-full.txt.ts`, producing a machine-readable Markdown dump alongside the rest of the site. Each build emits `dist/llms-full.txt`, which includes:

- Le sezioni introduttive (“Chi siamo” e “La storia”) estratte dalle relative pagine DatoCMS.
- L’intero catalogo con titoli, sottotitoli, URL assoluti, collane, recensioni, disponibilità e biografie complete degli autori.

Per rigenerare il file è sufficiente eseguire `npm run build` (oppure `npm run dev`, che calcola comunque l’endpoint). Non sono necessari script aggiuntivi.

## 7. Deploying Fast

- **Vercel** (canonical): the repository is linked to the `multimage-astro` project on your personal account. Run `vercel login`, then `vercel link --project multimage-astro --yes` inside the repo. Sync the required environment variables (`DATOCMS_*`) with `vercel env pull` and push updates via `vercel env add`. Deploy with `vercel deploy --prod` (build command defaults to `npm run build`).
- **Manual upload**: run `npm run build` and publish the `dist/` directory.

For contribution guidelines, coding style, and DatoCMS conventions, see `AGENTS.md`. Keep `docs/DATOCMS.md` open while working—it is the source of truth for the content model and avoids needless web searches.

---
agent_edit: true
---

# Doppia pipeline static/preview per Draft Mode

**Abbiamo introdotto la variabile `SERVER` per pubblicare un sito completamente statico (prod) e un gemello SSR solo per le anteprime, riusando la stessa codebase.**

- Date: 2025-11-16
- Alternatives Considered:
  - Restare con `output: 'server'` ovunque: semplice da mantenere ma costoso in termini di serverless invocations e latenza anche per i visitatori pubblici.
  - Mantenere due rami separati / duplicare il repo: avrebbe introdotto drift continuo tra la versione statica e quella dedicata alle preview.

## Decision

- `SERVER=static` (default) forza Astro in `output: 'static'`, pre-renderizza ogni route pubblica in `dist/`, e disattiva completamente gli endpoint SSR (sono richiesti solo nel progetto preview).
- `SERVER=preview` commuta lo stesso codice in `output: 'server'`, così tutte le pagine possono leggere i cookie di Draft Mode e passare `includeDrafts` alle query.
- Ogni pagina/utility con `export { prerender } from '~/lib/prerender'` prerenderizza solo quando `SERVER=static`, mentre rimane SSR quando `SERVER=preview`.
- Gli unici file che non usano il flag condiviso (e restano esplicitamente SSR) sono: `src/pages/api/preview/index.ts`, `src/pages/api/draft-mode/enable/index.ts`, `src/pages/api/draft-mode/disable/index.ts`, `src/pages/api/preview-links/index.ts`, `src/pages/api/seo-analysis/index.ts`, e `src/pages/api/post-deploy/index.ts`.

## Consequences

- Vercel ospita due progetti: dominio pubblico (build statico) e preview/editors (build SSR). Entrambi leggono gli stessi segreti.
- `docs/preview-mode.md`, `README.md`, `docs/project-structure.md`, e `docs/list-helpers.md` documentano il contratto `SERVER=static|preview` e la presenza del helper condiviso `~/lib/prerender`.
- Il plugin Web Preview continua a funzionare perché il progetto Vercel dedicato alle anteprime gira con `SERVER=preview`, quindi gli endpoint `/api/*` e le pagine restano SSR pur condividendo la stessa codebase.
- I deploy futuri devono impostare esplicitamente `SERVER` nell’ambiente Vercel appropriato; l’assenza del parametro ricade su `static`, quindi non c’è regressione per la produzione.

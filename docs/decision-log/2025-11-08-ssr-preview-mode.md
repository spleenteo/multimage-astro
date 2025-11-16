---
agent_edit: true
---

# Output SSR per abilitare anteprime editoriali

**Abbiamo portato l'output di Astro da `static` a `server` per consentire agli editor di usare le preview di DatoCMS senza rigenerare l'intero sito.** _(Superseded on 2025-11-16 by the `SERVER=static|preview` dual-runtime decision.)_

- Date: 2025-11-08
- Alternatives Considered:
  - Restare su build completamente statiche e chiedere agli editor di attendere un nuovo deploy ogni volta che serve anteprima.
  - Restare statici ma costruire un proxy custom che forzasse `includeDrafts` solo per `/api/preview`, con molta logica ad-hoc e cache difficile da governare.

## Decision

Passiamo definitivamente ad `ASTRO_OUTPUT=server` (adapter Vercel) così ogni pagina può leggere i cookie di Draft Mode e servire contenuti in tempo reale. Riutilizziamo il plugin ufficiale “Web Previews” di DatoCMS perché è supportato nativamente, Continua a collegarsi alle rotte `/api/preview`, `/api/draft-mode/*` e funziona bene su Vercel (gestisce i due ambienti Production/Preview senza configurazioni custom). In questo modo gli editor possono aprire una preview immediata, mentre i visitatori continuano a ricevere HTML prerenderizzato o servito via ISR senza dover mantenere due pipeline separate.

## Conseguenze

- Il deploy Vercel crea funzioni serverless per tutte le pagine dinamiche: dobbiamo monitorare i limiti di esecuzione e tenere `includeDrafts` disattivo finché non viene richiesto.
- `astro.config.mjs` e `datocms.json` devono chiarire che l’impostazione SSR è ora il default (vedi task **PS4** in `docs/TODO.md`).
- I plugin Dato (Web Previews + SEO/Readability) restano supportati senza mantenere codice custom; eventuali bug o aggiornamenti arrivano direttamente dal team Dato.
- L’ambiente locale deve avere tutte le variabili (`DATOCMS_*`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`) per simulare lo stesso flusso di preview.

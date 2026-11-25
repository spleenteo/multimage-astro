---
work: 2026-11-24-diventa-socio
slice: V1
level: essential
---

# V1 plan — The page and the form, from the CMS

**Mandate**: [slices.md § V1](./slices.md#v1--the-page-and-the-form-from-the-cms) · **Guidelines**: [docs/development-guidelines.md](../../development-guidelines.md) · **Lessons**: none yet · **Execution rules**: Flow `agents/executor.md` (Test policy, Commit rules)

**Summary**
1. T1 adds two blocks and four fields to the `membership` singleton on the primary environment through the CMA, between two `npm run generate-schema` runs.
2. T2 seeds the record (fee tiers, areas, `payment_note`, `success_text`, a new `content`), stops for the owner's approval, then publishes it.
3. T3 writes `src/lib/membership.ts` (keys, labels, rules, Italian messages, limits), import-free.
4. T4 moves the form rules of `_borsa.css` to `src/styles/form.css`; T5 moves the Turnstile loader and the error helpers out of `initOrderPage` into `src/lib/form.client.ts`. `/borsa` unchanged.
5. T6 builds `/diventa-socio` (CMS head, content, form markup, email way out); T7 adds its client script (validation, summary, Turnstile `socio`, "not available yet" note).
6. T8 makes the route discoverable: sitemap, public URLs, `recordToWebsiteRoute`, revalidation-map check.

**Files**: schema.ts, src/lib/membership.ts, src/styles/form.css, src/pages/borsa/_borsa.css, src/pages/borsa/index.astro, src/pages/designsystem/index.astro, src/lib/form.client.ts, src/pages/borsa/_order-page.client.ts, src/pages/diventa-socio/_graphql.ts, src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_membership-page.client.ts, src/pages/sitemap.xml.ts, src/lib/datocms/publicUrls.ts, src/lib/datocms/recordInfo.ts, scripts/revalidation-map/check.ts

## The slice, decided here

- Every CMA call names the environment: `-e home-featured-book`. Membership model id `LHYUU8UnQeG-_VSVHqGX9Q`, record `D-sTlquHR7GiqaEOpMA80w`. No script file is committed: `cma:call`, or `cma:script` read from stdin.
- `payment_note` and `success_text` are plain `text` fields with the `textarea` editor, not WYSIWYG: V2 writes them with `textContent` and builds the causale from them. Convention for V2: the first line of `payment_note` is the causale base, the following lines are instructions.
- Fee tiers seeded: Ordinaria 20, Studente under 25 10, Disoccupato 10 (**assumption** from the current prose "20€ (10€ studenti e disoccupati)"; the owner confirms at the T2 stop). Shown as "10 € — Studente under 25" by `membershipFeeLabel` (it-IT, no decimals on whole euros).
- Areas seeded, in order: "Area editoriale (leggere libri, correggere bozze…)", "Web e social", "Impaginare", "Fare video", "Scrivere articoli per il Magazine", "Ufficio stampa", "Partecipare in un gruppo locale". "Altro" is a fixed checkbox in the code with its free-text input (see Deviations).
- Form values carry ids, never labels or amounts: fee radio value = the fee block id, area checkbox value = the area block id or `altro`. V2 re-reads the fee by id.
- Rules: email (the `order.ts` pattern, copied: `membership.ts` stays import-free), first/last name 1–60, birth date a real `YYYY-MM-DD` from 1900-01-01 to today, birth place 2–100, address line 1 3–200, line 2 optional ≤200, city 2–100, state/province/region optional ≤60 (not every country has one), postcode 2–12 of `[A-Za-z0-9 -]` (any country), country 2–60 default "Italia", fee id `^[A-Za-z0-9_-]{1,40}$`, payment `bonifico|paypal`, areas ≤20 ids, `altro` text 2–200 when `altro` is checked, consent true. No control characters anywhere.
- Consent wording (owner sees it at the T2 stop): label "Acconsento al trattamento dei miei dati, compresi data e luogo di nascita e indirizzo, per gestire la mia adesione all'Associazione Multimage."; hint "Li usiamo solo per il libro soci e per le comunicazioni dell'associazione." + the iubenda link `/borsa` uses.
- Shared CSS keeps the `order-*` class names: renaming would rewrite `/borsa` and `/designsystem` markup for no behaviour; `form.css` is imported before `_borsa.css` so page rules keep winning ties.
- Turnstile loads on the form's first `focusin` (or on submit), not on page load: readers who never touch the form load no third-party script.
- The page query takes from `content` `value`, the links allowed by the field (`PageRecord`, `BlogPostRecord`: `id title slug`) and **all six** allowed blocks: `ImageBlockRecord`, `VideoRecord`, `BannerRecord` with the field selections of `src/pages/info/[slug]/_graphql.ts`, plus `SingleInfoBlockRecord { id }`, `NewsletterSubscriptionRecord { id }`, `ButtonRecord { id }` (each with `__typename` and `id`). The page passes a block map that renders those three as nothing (unless a renderer already exists in `structuredTextComponents.ts`) and `defaultInlineRecordComponents`: `@datocms/astro` throws (500) on a block id missing from `blocks`, a block with no component, or an inline record with no `inlineRecordComponents`. The drafted `content` uses no blocks.
- Page shell in Tailwind utilities (no new CSS module); ids `socio-<key>`, error slots `data-error-for="<key>"`, root `data-socio-page`. `revalidationUrls.ts` (Vercel, no traffic) gets no `membership` entry: on Cloudflare the cache tags purge the page.
- Draft-on loads need the magic link and its secret from `.env`, which the executor never reads: the executor checks draft off; draft on is checked by the conductor with the owner's session at the slice Done.

## Tasks

### T1 — Membership schema on the primary environment · critical
**What**: `npm run generate-schema`; create block `Membership Fee Block` (`membership_fee_block`, `modular_block: true`) with `label` (string, required) and `amount` (float, required); block `Collaboration Area Block` (`collaboration_area_block`) with `label` (string, required); on `membership` add `fees` (`rich_text`, `rich_text_blocks` = fee block), `collaboration_areas` (`rich_text`, `rich_text_blocks` = area block), `payment_note` and `success_text` (`text`, editor `textarea`). Syntax from `npx datocms cma:docs`. Nothing deleted or renamed. Then `npm run generate-schema` again.
**Files**: schema.ts
**Verified**: `npx datocms schema:inspect membership -e home-featured-book` lists 9 fields: the 5 existing unchanged plus `fees`, `collaboration_areas`, `payment_note`, `success_text`; `grep -c 'MembershipFeeBlock\|CollaborationAreaBlock' schema.ts` ≥ 2, and `fees:` and `collaboration_areas:` inside `export type Membership`.
**Done**: schema live, `schema.ts` regenerated and committed.
**Interfaces**: produces the block ids (for T2) and CDA names `fees { ... on MembershipFeeBlockRecord { id label amount } }`, `collaborationAreas { ... on CollaborationAreaBlockRecord { id label } }` (for T6).

### T2 — Seed, owner's approval, publish · critical · depends on: T1
**What**: read the record (`cma:call items find D-sTlquHR7GiqaEOpMA80w`); one `cma:script` on stdin (`buildBlockRecord`) writes as draft: the 3 fee tiers, the 7 areas, `payment_note` (line 1 "Quota associativa Multimage", then: send the receipt to info@multimage.org), `success_text` (welcome, "Benvenuta, benvenuto" first, says the membership is complete once the fee arrives), and a `content` rewritten from the current prose without the Mailchimp link, the IBAN block or fees in prose. **No stop** (owner, 2026-11-24: run all slices without stopping; texts reported at the close): publish at once with `cma:call items publish D-sTlquHR7GiqaEOpMA80w -e home-featured-book`, and copy into the ledger `content` (as text), `payment_note`, `success_text`, the fee tiers (flag the two assumed ones), the areas, the T3 consent wording and the note that "Altro" is fixed in code, not a CMS area, for the owner's review at the close. No route reads `membership` before T6, so the publish changes nothing visible.
**Files**: none (CMS record; no commit)
**Verified**: `npx datocms cma:call items find D-sTlquHR7GiqaEOpMA80w -e home-featured-book --json` shows `meta.status` `published`, 3 `fees`, 7 `collaboration_areas`.
**Done**: texts recorded in the ledger, record published.

### T3 — `src/lib/membership.ts`
**What**: no imports. Exports `MEMBERSHIP_EMAIL = 'info@multimage.org'`, `MEMBERSHIP_ACTION = 'socio'`, `PAYMENT_METHODS` (`bonifico` "Bonifico bancario", `paypal` "PayPal"), `AREA_OTHER = 'altro'`, the limits above, `MembershipFieldKey` (`email firstName lastName birthDate birthPlace address1 address2 city region postcode country fee payment areas areasOther consent`), `MembershipFields`, `MEMBERSHIP_LABELS` (Italian label per key), `MEMBERSHIP_FIELD_MESSAGES` (one Italian message per key, in the voice of `ORDER_FIELD_MESSAGES`: what to write, with an example), the consent texts, `membershipFeeLabel({ label, amount })`, `validateMembershipFields(f)` returning `Partial<Record<MembershipFieldKey, string>>`, `{}` when valid.
**Files**: src/lib/membership.ts
**Verified**: `node --import tsx -e "import('./src/lib/membership.ts').then(m=>{console.log(Object.keys(m.validateMembershipFields({email:'',firstName:'',lastName:'',birthDate:'',birthPlace:'',address1:'',address2:'',city:'',region:'',postcode:'',country:'Italia',fee:'',payment:'',areas:['altro'],areasOther:'',consent:false})).join());console.log(m.membershipFeeLabel({label:'Studente under 25',amount:10}))})"` prints `email,firstName,lastName,birthDate,birthPlace,address1,city,postcode,fee,payment,areasOther,consent` (any order) and `10 € — Studente under 25`; a second command with a complete valid object (`{email:'a@b.it',firstName:'Ada',lastName:'Neri',birthDate:'1990-05-01',birthPlace:'Firenze',address1:'Via Roma 1',address2:'',city:'Firenze',region:'FI',postcode:'50100',country:'Italia',fee:'abc',payment:'bonifico',areas:[],areasOther:'',consent:true}`) prints an empty line; `npx prettier --check src/lib/membership.ts` passes.
**Done**: committed.
**Interfaces**: produces the keys, labels, messages and `validateMembershipFields` for T6 and T7.

### T4 — Shared form stylesheet · critical
**What**: move from `src/pages/borsa/_borsa.css` the block from `/* Form */` to the end of the `.order-status` rule (fieldset, field, hint, input, pair, error, choices/choice, who, consent/check, turnstile, form-error, send, status) unchanged into `src/styles/form.css` (first line `@reference './global.css';`), except `#order-turnstile:focus-visible`, which becomes `.order-turnstile > [tabindex]:focus-visible` (or the class form that matches the current markup) so `#socio-turnstile` gets it too. Import it before `_borsa.css` in `src/pages/borsa/index.astro` and `src/pages/designsystem/index.astro`.
**Files**: src/styles/form.css, src/pages/borsa/_borsa.css, src/pages/borsa/index.astro, src/pages/designsystem/index.astro
**Verified**: `cat src/styles/form.css src/pages/borsa/_borsa.css | grep -c '^\.order-\|^  \.order-'` equals `git show HEAD:src/pages/borsa/_borsa.css | grep -c '^\.order-\|^  \.order-'`; `npx prettier --check` on the four files passes; `npm run dev`, `/borsa` with a book in the bag and `/designsystem` look as before (fields, radios, consent, error band after an empty submit).
**Done**: committed as a refactor.
**Interfaces**: produces `src/styles/form.css` for T6.

### T5 — Shared Turnstile loader and error helpers · critical
**What**: new `src/lib/form.client.ts` with the `Window.turnstile` declaration, `loadTurnstile({ container, sitekey, action, onToken, onExpire, onError })` (script injected once, `language: 'it'`, `size: 'flexible'`; returns `{ reset() }`), `checkFieldsLabel(n)` and `createFieldErrors({ root, idPrefix, keys, names, groupKeys, plainKeys, box, boxText, boxList, mailto })` returning `setError`, `clearError`, `clearAll`, `showFormError(text, withMailto)`, `hideFormError`, `showFieldSummary(keys)`, with the current behaviour (control `#<prefix>-<key>`, a group's control is its fieldset and focus goes to the checked or first input, `plainKeys` get no `aria-invalid`, hint ids kept in `aria-describedby`, summary links `#<prefix>-<key>-error`, focus on the box). `initOrderPage` uses them with prefix `order`, groups `shipping buyer`, plain `turnstile`; its markup contract is unchanged.
**Files**: src/lib/form.client.ts, src/pages/borsa/_order-page.client.ts
**Verified**: `npx astro check` reports 0 errors; `npx prettier --check` on both files passes; `npm run dev`, `/borsa` with a book: empty submit shows each field error, the "Controlla N campi:" summary with working links and focus on it; the Turnstile widget renders (dev test key); a valid submit reaches `/api/ordine` as before (status in DevTools).
**Done**: committed as a refactor.
**Interfaces**: produces `loadTurnstile`, `createFieldErrors`, `checkFieldsLabel` for T7.

### T6 — `/diventa-socio` page · depends on: T1, T3, T4
**What**: `_graphql.ts`: `MEMBERSHIP_PAGE_QUERY` (`membership { title subtitle content { … } fees { … } collaborationAreas { … } _seoMetaTags { tag attributes content } }`, as decided; no `slug`, no `_private` field) and its hand-written result type. `index.astro`: `resolveDraftMode`, `executeQuery`, `withFallbackSeo` (title `${title} | Multimage`, description `toPlainText(subtitle)`), `h1` title (fallback "Diventa socio"), subtitle through `sanitizeCmsHtml` with `set:html`, `content` through `StructuredText` with `hasStructuredTextContent` and the default block and link components, `DraftModeQueryListener`. Form (`data-socio-form`, `data-sitekey`, `novalidate`) when the singleton exists, `fees` is not empty and a site key exists (same rule as `/borsa`): error band at top, fieldsets "I tuoi dati", "Indirizzo", "Quota" (fee radios as `.order-choice`), "Come paghi", "Come vuoi collaborare" (area checkboxes + "Altro" with its text input), consent, Turnstile slot `#socio-turnstile`, submit "Invia la richiesta", status line. Each control has a `<label>` from `MEMBERSHIP_LABELS`, the autocomplete tokens (`email given-name family-name bday address-line1 address-line2 address-level2 address-level1 postal-code country-name`) and its `data-error-for` slot. Otherwise a box "Scrivici a info@multimage.org" with a mailto.
**Files**: src/pages/diventa-socio/_graphql.ts, src/pages/diventa-socio/index.astro
**Verified**: `npx astro check` 0 errors; prettier check on both files; `npm run dev`, `curl -s localhost:<port>/diventa-socio` (draft off) has the CMS title, one `name="fee"` input per published tier (or the email box before T2's publish), 7 area checkboxes plus `altro`, a `<label for="socio-…">` for every text, date and email input, and a wrapping `<label>` for every radio and checkbox (the `/borsa` `.order-choice` / `.order-check` pattern); field names match `npx datocms schema:inspect membership -e home-featured-book`.
**Done**: committed.
**Interfaces**: produces the markup contract (root `data-socio-page`, ids `socio-<key>`, `data-socio-*` box, text, list, mailto, status) for T7.

### T7 — Client script, first part · depends on: T3, T5, T6
**What**: `_membership-page.client.ts` exports `initMembershipPage()`, loaded by a `<script>` in `index.astro`. It reads the fields, runs `validateMembershipFields`, sets field errors and the summary through `createFieldErrors` (prefix `socio`, groups `fee payment areas`, plain `turnstile`), clears an error when its field becomes valid, shows or hides the "Altro" text input with its checkbox, loads Turnstile with `MEMBERSHIP_ACTION` on first `focusin`, and on a valid submit with a token writes in the status line "L'invio dal sito non è ancora attivo: scrivi a info@multimage.org." (until V2). No `innerHTML`.
**Files**: src/pages/diventa-socio/_membership-page.client.ts, src/pages/diventa-socio/index.astro
**Verified**: `npx astro check` 0 errors; prettier check; in a browser on `npm run dev`: an empty submit shows every required field's error, "Controlla N campi:" with links that move focus, focus on the summary; Turnstile renders after the first focus; a complete form shows the "non è ancora attivo" note.
**Done**: committed.

### T8 — Discovery · critical
**What**: `'/diventa-socio'` in `STATIC_PATHS` (`src/pages/sitemap.xml.ts`) and `STATIC_URLS` (`src/lib/datocms/publicUrls.ts`); `case 'membership': return '/diventa-socio';` in `recordToWebsiteRoute` (`src/lib/datocms/recordInfo.ts`); `['membership', '', '/diventa-socio']` in `ROUTES` of `scripts/revalidation-map/check.ts`.
**Files**: src/pages/sitemap.xml.ts, src/lib/datocms/publicUrls.ts, src/lib/datocms/recordInfo.ts, scripts/revalidation-map/check.ts
**Verified**: `npm run check:revalidation-map` exits 0 with `route membership - /diventa-socio OK`, `13 routes, 0 mismatches, fetch calls: 0`; `curl -s localhost:<port>/sitemap.xml | grep -c '/diventa-socio<'` prints 1.
**Done**: committed.

## Order

- First T1 alone (`npm run dev` regenerates `schema.ts` through `sync-datocms`, so no task may run it while T1 changes the schema). Then side by side (separate files): T3, T4, T5, T8. No task other than T1 stages `schema.ts`.
- T2 after T1; T6 after T1, T3, T4; T7 after T3, T5, T6.
- Slice Done (draft off, published tiers visible, `/borsa` unchanged, gate) after T2's publish and T7; the draft-on load is recorded as `pending:` for the conductor.

## Deviations from the mandate

- "Altro" is a fixed checkbox in the code, not a seeded `collaboration_area_block`: its free-text input must stay tied to it whatever editors rename or remove.

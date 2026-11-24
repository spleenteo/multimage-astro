# Spike: orders on Cloudflare only (no Resend)

- **Work**: borsa
- **Date checked**: 2026-11-24 (every source below was read on this date)
- **Kind**: research only. No code, no deploys, no account or DNS changes. The only commands run were read-only `dig`, `wrangler ... --help` and `npm view`/`npm pack` in a temp folder.
- **Constraint**: Workers Free plan only (10 ms CPU per HTTP request). Workers Paid is ruled out.
- **Builds on**: `spike-email.md` (same folder), which covered Resend, Brevo, Postmark and Turnstile.

## Starting point (read from the repo)

- `wrangler.jsonc`: one Worker `multimage-astro`, `main: ./src/worker.ts`, `compatibility_date 2026-11-01`, `nodejs_compat`. No `send_email`, no `d1_databases` today.
- `src/worker.ts`: the default entrypoint (gateway, cache off) forwards to the `Backend` entrypoint (cache on), which calls `handle(request, this.env, this.ctx)` from `@astrojs/cloudflare/handler`. Bindings are Worker-wide, so `Backend` and `import { env } from 'cloudflare:workers'` both see them.
- `src/pages/api/ordine/index.ts`: POST checks config, size, JSON, fields (`parseOrderRequest`), Turnstile, rebuilds lines from the CDA (`rebuildOrder`), computes totals, then sends two Resend mails (shop first, visitor copy second). Its header comment already notes that importing the Workers runtime module breaks the Vercel build.
- `src/lib/order.ts`: pure helpers, no imports. `orderEmail(data, 'shop' | 'visitor')` gives `{ subject, text }`. `ORDER_FROM` is still a Resend placeholder (`ordini@send.multimage.org`).
- `astro.config.mjs`: `DEPLOY_TARGET=cloudflare` picks `@astrojs/cloudflare` (v14.4.9 installed), anything else picks `@astrojs/vercel`. `import.meta.env.DEPLOY_TARGET` is replaced at build by `vite.define`. `npm run dev` has no `DEPLOY_TARGET`, so **local dev runs the Vercel adapter on Node, not workerd**.
- `src/middleware.ts`: `INTERNAL_PATH_PREFIXES = ['/staff', '/libri/schede']`; no draft cookie means a flat 404 with `private, no-store`.

DNS, read-only `dig` on 2026-11-24: NS on Cloudflare (`athena`, `lou`); MX to Google (`aspmx.l.google.com` and alternates); apex TXT has only two `google-site-verification`; no SPF, no `_dmarc`, no `google._domainkey`; `orders.multimage.org` has no MX.

## Questions

A. Notify ordini@multimage.org through the `send_email` binding: Free plan? Subdomain-only Email Routing? Sender and destination rules? Setup steps, binding config, message building, access from Astro, Vercel build, DKIM and deliverability.
B. Store orders in D1 on Workers Free: quotas, binding, migrations, access, local dev, table design, retention.
C. Visitor PDF on the success screen: jsPDF vs pdf-lib vs print stylesheet.
D. Can `/staff/ordini` read D1 under the existing middleware gate?
E. Recommendation and risks: CPU, missing bindings, fail-closed vs D1-only.

---

## A. Order notification through `send_email`

### A1. Is it on Workers Free?

**Yes, for verified destination addresses only.** "Sending to verified destination addresses in your account is free on all plans, even when only Email Routing is configured", and these sends do not count toward any quota or daily limit. Email Sending to arbitrary recipients is "Not available" on Workers Free. Email Routing itself is on both Free and Paid.

That fits this use case exactly: the only recipient is ordini@multimage.org, which can be verified once. The visitor gets no email (see C).

Sources:
- https://developers.cloudflare.com/email-service/platform/pricing/
- https://developers.cloudflare.com/email-service/platform/limits/

### A2. Sender and destination rules

- **Sender (`from`)**: before a sending domain is onboarded to Email Sending (which needs Paid), "you can send only from your routing domains". So `from` must be an address on a domain or subdomain with Email Routing enabled, for example `sito@orders.multimage.org`. The binding can narrow it further with `allowed_sender_addresses`.
- **Destination**: must be a verified destination address of the account. Destination addresses are account-scoped (up to 200, shared across all domains of the account) and can be any mailbox anywhere, including a Google Workspace mailbox on the apex. Verification is a link Cloudflare emails to the address; it sits behind a Cloudflare challenge, so it must be clicked in a normal browser.
- Errors to expect: `E_RECIPIENT_NOT_ALLOWED` (recipient outside the binding's restriction, or unverified with no onboarded sending domain), `E_RECIPIENT_PLAN_RESTRICTED` (plan allows verified destinations only), `E_SENDER_NOT_VERIFIED` (sender outside `allowed_sender_addresses`), `E_SENDER_DOMAIN_NOT_AVAILABLE`.
- Limits that matter here: 50 recipients, 25 MiB per message. Sends to verified addresses are exempt from the daily cap.
- Observability gotcha: messages sent via `send_email` show as **dropped** in the Email Routing summary even when delivered.

Sources:
- https://developers.cloudflare.com/email-service/platform/limits/
- https://developers.cloudflare.com/email-service/configuration/send-bindings/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/
- https://github.com/marcusquinn/aidevops/issues/36401 (verification link behind a challenge)

### A3. Email Routing on a subdomain only (apex MX to Google untouched)

**Possible, with two real caveats.**

What the docs say: Email Routing is zone-level and applies to the apex by default; subdomains are added under the apex's **Settings > Subdomains**, Cloudflare adds the records to the subdomain, catch-all rules are apex-only, and a zone can hold up to 30 Email Routing/Sending domains. The docs do not say what happens to the apex in that case. Cloudflare's Google Workspace guide states that Email Routing and Google MX records cannot coexist **on the same name** (the apex), which is why the apex must not be onboarded.

Field report (GitHub issue #36401, observed 2026-11-01, zone with Google MX on the apex, subdomain-only routing):
1. **The dashboard only offered apex onboarding** (which proposes replacing the apex MX). Subdomain enablement on such a zone was **API-only**: `GET /zones/{zone_id}/email/routing/dns?subdomain=<sub>` to preview, then `POST /zones/{zone_id}/email/routing/dns` with `{"name": "<sub>.<domain>"}`. Token needs Zone Settings Write, Email Routing Rules Write, DNS Write, Account Email Routing Addresses Write.
2. Because the apex had **no SPF**, Cloudflare **also created an apex SPF** `v=spf1 include:_spf.mx.cloudflare.net ~all` and a locked apex DKIM `cf2024-1._domainkey`. The apex MX was not changed. Zone status became `misconfigured` (`mx.foreign`) while the subdomain was `ready` and worked. Cloudflare's own docs confirm "If no SPF record exists, Cloudflare also adds one" and that Email Routing configures SPF on the root domain.

multimage.org has **no apex SPF today**, so it would hit point 2: Google Workspace mail from @multimage.org would go from "no SPF" to SPF softfail. The fix is to **publish the Google SPF on the apex first** (`v=spf1 include:_spf.google.com ~all`), so Cloudflare does not add its own, and to snapshot DNS before and after.

`wrangler email routing enable <domain>` (wrangler 4.147.0) is described as "Enable Email Routing for a zone": it targets the zone, so **do not use it** here. `wrangler email routing dns get <domain>` can preview records, and `wrangler email routing addresses create <email>` adds the destination address.

Sources:
- https://developers.cloudflare.com/email-service/configuration/subdomains/
- https://developers.cloudflare.com/email-routing/setup/subdomains/
- https://developers.cloudflare.com/email-routing/get-started/enable-email-routing/
- https://developers.cloudflare.com/dns/manage-dns-records/how-to/set-up-google-workspace/
- https://developers.cloudflare.com/email-routing/postmaster/
- https://github.com/marcusquinn/aidevops/issues/36401

### A4. What the user must do (in order)

1. **DNS snapshot**: export the multimage.org zone (DNS > Records > Export) to compare later.
2. **Apex SPF for Google** (a DNS change agreed with whoever runs Workspace): TXT `@` = `v=spf1 include:_spf.google.com ~all`. Optional but advised at the same time: Workspace DKIM (Admin console > Gmail > Authenticate email, publishes `google._domainkey`) and DMARC `_dmarc` = `v=DMARC1; p=none; rua=mailto:...`.
3. **Enable Email Routing on the subdomain only** (for example `orders.multimage.org`): try the dashboard (Email Service > Email Routing > multimage.org > Settings > Subdomains). If it only offers apex onboarding, **stop** and use the API call from A3 instead. Never accept a prompt to delete or replace the apex MX.
4. **Diff DNS** against the snapshot: expect new MX/TXT on `orders.` and possibly `cf2024-1._domainkey` at the apex; the apex MX and the Google SPF must be unchanged. If an extra apex SPF appeared, remove it (unlock it first in Email Routing settings).
5. **Add the destination address** ordini@multimage.org (Email Routing > Destination addresses, or `wrangler email routing addresses create ordini@multimage.org`). Olivier (or whoever reads ordini@) **clicks the verification link** in a normal browser. Status must read Verified.
6. No routing rule is needed to send. A rule on `sito@orders.multimage.org` forwarding to ordini@ is optional, only to catch bounces or stray replies.
7. Gmail side (optional): a filter "from:sito@orders.multimage.org > Never send to Spam" on ordini@.

### A5. Binding config (wrangler.jsonc)

```jsonc
"send_email": [
  {
    "name": "ORDER_MAIL",
    // Raw EmailMessage with an empty recipient goes here; structured send() must still set `to`.
    "destination_address": "ordini@multimage.org",
    "allowed_sender_addresses": ["sito@orders.multimage.org"]
  }
]
```

`destination_address` (one fixed address) is the tightest choice and turns any bug into `E_RECIPIENT_NOT_ALLOWED` instead of a mail to a stranger. `allowed_destination_addresses: [...]` is the allowlist form. Use one or the other.

Source: https://developers.cloudflare.com/email-service/configuration/send-bindings/

### A6. Building the message

Two APIs on the same binding:

- **Structured (recommended by the docs)**: `await env.ORDER_MAIL.send({ from: { email: 'sito@orders.multimage.org', name: 'Sito Multimage' }, to: 'ordini@multimage.org', replyTo: order.email, subject, text })`. Returns `{ messageId }`; errors are thrown with a `code` (table above); a malformed argument throws a `TypeError` without `code`. `replyTo` is a documented field, so Olivier can answer the buyer with one click. `orderEmail(data, 'shop')` already returns `{ subject, text }`, so no MIME work and no dependency.
- **Legacy raw MIME**: `import { EmailMessage } from 'cloudflare:email'`; `new EmailMessage(from, to, raw)` where `raw` is RFC 5322 text, built with `mimetext` (v3.0.28) or by hand. It must carry `From` and `Message-ID` (else `E_FIELD_MISSING`). A hand-built MIME needs RFC 2047 encoding for the subject (it contains `·` and accented names) and quoted-printable or base64 for the UTF-8 body: easy to get wrong, so prefer the structured call.

**Open point to verify on the first real send**: the docs are explicit that verified-destination sends work with Email Routing only, but the structured-API page words the sender rule as "onboarded to Email Service". Whether a routing-only subdomain counts for `send()` is not stated in one place. If `send()` answers `E_SENDER_DOMAIN_NOT_AVAILABLE`, fall back to `EmailMessage` with `mimetext`, which is the historical Email Routing path.

Sources:
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/ (now redirects to the page above)

### A7. Access from an Astro 7 endpoint (@astrojs/cloudflare v14) and the Vercel build

- `Astro.locals.runtime` was **removed in v13** (Astro 6). The documented way is `import { env } from 'cloudflare:workers'`, then `env.ORDER_MAIL`, `env.DB`. The execution context is `Astro.locals.cfContext`.
- A static `import ... from 'cloudflare:workers'` in the endpoint breaks the Vercel build (noted in the endpoint's own header) and the Node-based `npm run dev`. Options, best first:
  1. **Vite alias to a stub when not on Cloudflare**: in `astro.config.mjs`, when `!isCloudflare`, set `vite.resolve.alias['cloudflare:workers']` to a tiny `src/lib/platform/workers-stub.ts` exporting `export const env = {}`. One wrapper module, for example `src/lib/platform/bindings.ts`, imports `env` and exports `getOrderDb()` / `getOrderMail()` returning the binding or `null`. The Vercel build and Node dev compile against the stub and get `null`; the Cloudflare build gets the real module. Static, no runtime magic.
  2. **Guarded dynamic import**: `if (import.meta.env.DEPLOY_TARGET === 'cloudflare') ({ env } = await import('cloudflare:workers'))`. The `define` makes the condition constant, but whether Vite/Rollup still tries to resolve the specifier in the dead branch on the Vercel build and in Node dev must be tested; option 1 avoids the question.
- Types: `src/worker.ts` is excluded from `astro check` because Workers types clash with the DOM lib. Do not add `wrangler types` output globally; declare minimal local interfaces (`D1Database`-like `prepare().bind().run()/all()`, `send()`), plus `declare module 'cloudflare:workers' { export const env: Record<string, unknown> }` in the wrapper's `.d.ts`.

Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare/

### A8. DKIM and deliverability to Gmail/Workspace

- Cloudflare: "Outbound emails sent through Email Service are always authenticated with both SPF and DKIM". Email Routing signs with selector `cf2024-1`; its SPF include is `_spf.mx.cloudflare.net`. Outbound IPs `104.30.0.0/19` and `2405:8100:c000::/38`.
- For a subdomain, the field report shows the DKIM key published at **the apex** (`cf2024-1._domainkey.multimage.org`), so the signature is probably `d=multimage.org`, which aligns (relaxed) with a `From` on `orders.multimage.org`. Not documented for `send_email` specifically: **check `Authentication-Results` on the first delivered message** (expect `dkim=pass`, `spf=pass`).
- With no DMARC on the apex, Gmail has no policy to apply; a single low-volume internal notification that passes DKIM and SPF should reach the inbox. The real risk is Workspace's own spoofing checks for mail claiming the company's domain: authenticated mail passes them. The Gmail filter in A4 step 7 removes the residual risk, and adding DMARC `p=none` costs nothing.

Sources:
- https://developers.cloudflare.com/email-routing/postmaster/
- https://github.com/marcusquinn/aidevops/issues/36401

### A9. Local dev for `send_email`

Under `wrangler dev` without remote bindings, nothing is sent: Wrangler logs `send_email binding called with MessageBuilder:` and saves text/HTML to temp files. `remote: true` on the binding sends real mail. The Vite plugin (used by `astro dev` on the Cloudflare adapter) is not covered by that page. In this repo plain `npm run dev` runs on Node with no binding at all, so the endpoint keeps its current "print the email to the console in dev" path.

Source: https://developers.cloudflare.com/email-service/observability/local-development/sending/

---

## B. Orders in D1 on Workers Free

### B1. Quotas (Free)

| Item | Free limit |
|---|---|
| Rows read | 5,000,000 / day |
| Rows written | 100,000 / day |
| Storage | 5 GB per account, 500 MB per database |
| Databases | 10 per account |
| Queries per Worker invocation | 50 (`batch()` counts as one) |
| Time Travel (point-in-time restore) | 7 days |
| Reset | 00:00 UTC; over the limit, queries error until reset |

An order is one row written (plus index writes); a staff page listing 200 orders reads about 200 rows. Volume is orders of magnitude below the quotas. Indexes count as extra rows written per insert.

Sources:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/

### B2. Create, bind, migrate

- Create (user, once): `npx wrangler d1 create multimage-orders --jurisdiction eu` (wrangler 4.147.0 offers `--jurisdiction eu|us|fedramp`; with a jurisdiction the location hint is ignored). EU jurisdiction is the simple GDPR answer for where order data lives.
- Binding:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "multimage-orders",
    "database_id": "<uuid printed by d1 create>",
    "migrations_dir": "migrations"
  }
]
```

- Migrations: `wrangler d1 migrations create multimage-orders init` writes `migrations/0001_init.sql`; `wrangler d1 migrations list|apply multimage-orders --local` for local, `--remote` for production. Applied migrations are tracked in a `d1_migrations` table; `apply` asks for confirmation and takes a backup. The docs advise addressing migrations by `database_name`, not binding.
- Access in the endpoint: `await env.DB.prepare('INSERT INTO orders (...) VALUES (?1, ?2, ...)').bind(...).run()`; staff page: `prepare('SELECT ... ORDER BY created_at DESC LIMIT ?1').bind(100).all()`. Always `bind()`, never string-built SQL.

Source: https://developers.cloudflare.com/d1/reference/migrations/

### B3. Local dev

- `npm run dev` (Vercel adapter, Node): no D1. The endpoint must treat a missing `DB` as "dev: log only".
- For a real local test: `DEPLOY_TARGET=cloudflare astro dev` runs through the Cloudflare Vite plugin on workerd and reads `wrangler.jsonc`; D1 is local (Miniflare, persisted under `.wrangler/state`). Apply the schema first with `wrangler d1 migrations apply multimage-orders --local`. The adapter also exposes `remoteBindings`/`persistState`/`configPath`. `npm run build:cf` then `astro preview` is the closest to production. A `dev:cf` script would help (not added: spike only).
- Secrets for that mode go in `.dev.vars` (git-ignored); this is a new env file, so the user decides.

Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare/

### B4. Table design, commented

Proposed `orders(id, created_at, name, email, phone, address, city, province, shipping, buyer, notes, lines_json, copies, total_cents, notified)` is close. Suggested changes:

```sql
CREATE TABLE orders (
  id            INTEGER PRIMARY KEY,                -- internal rowid
  code          TEXT NOT NULL UNIQUE,               -- short human code, e.g. 'MM-261124-7K3Q', on the PDF and in the mail subject
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,                               -- NULL when not given
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  province      TEXT NOT NULL,
  shipping      TEXT NOT NULL CHECK (shipping IN ('piego','rapida')),
  buyer         TEXT NOT NULL CHECK (buyer IN ('privato','scuola','associazione','libreria')),
  notes         TEXT,
  lines_json    TEXT NOT NULL CHECK (json_valid(lines_json)),  -- server-rebuilt lines: id, title, authors, priceCents, qty, amountCents
  copies        INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents   INTEGER NOT NULL,
  consent_at    TEXT NOT NULL,                      -- proof of consent (same as created_at today)
  notify_status TEXT NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending','sent','failed','skipped')),
  notify_error  TEXT,                               -- error code only (E_...), never message text
  status        TEXT NOT NULL DEFAULT 'nuovo'       -- staff workflow: nuovo, confermato, spedito, annullato (optional, later)
);
CREATE INDEX orders_created_at ON orders(created_at DESC);
```

Notes:
- `lines_json` stores the **server-rebuilt** lines (titles and prices at order time), never the client payload: prices change, the record must not.
- Money in integer cents, matching `src/lib/order.ts`. Store subtotal and shipping too, so the staff page never recomputes.
- `notified` boolean becomes `notify_status` + `notify_error`: it tells "not tried" from "failed" and allows a retry.
- `code` instead of exposing the rowid: readable on the phone, unique, not guessable-sequential (it is never used as an access key anyway).
- Do not store the Turnstile token, IP or user agent.

### B5. Privacy / GDPR retention

- Storage limitation (GDPR art. 5(1)(e)): keep personal data only as long as needed to fulfil the order. Proposal: **anonymise 24 months after `created_at`** (null `name`, `email`, `phone`, `address`, `notes`; keep city/province, lines and totals for stats). Accounting retention (10 years in Italy) applies to receipts and bookkeeping, which live outside this table; confirm the period with the association.
- How: a monthly Cron Trigger (Free plan: 5 per account) calling a `scheduled` handler in `src/worker.ts`, or a documented manual `wrangler d1 execute multimage-orders --remote --command "UPDATE ..."`. Time Travel keeps 7 days of history on Free, so erased data fully disappears after a week.
- The privacy notice on /borsa must name Cloudflare (D1, EU jurisdiction) as processor and the retention period. Requests to erase data: one `UPDATE`/`DELETE` by `email`.

Source: https://developers.cloudflare.com/workers/platform/limits/ (Cron Triggers, CPU)

---

## C. Visitor PDF on the success screen

| Option | Size (measured 2026-11-24) | Maintenance | UX |
|---|---|---|---|
| **jsPDF 4.2.1** | `jspdf.es.min.js` 343.6 KB min, **109 KB gzip**; deps `fflate`, `fast-png`, `@babel/runtime`; `html2canvas`/`dompurify`/`canvg` are optional and only loaded by `.html()`/SVG | Active (last publish 2026-03-17) | One tap "Scarica il PDF" gives a real file on every platform |
| **pdf-lib 1.17.1** | `pdf-lib.esm.min.js` 523 KB min, **205 KB gzip** | **Unmaintained** (last publish 2022-05-12) | Same as jsPDF, twice the bytes, lower-level layout API |
| **Print stylesheet + `window.print()`** | 0 KB | Nothing to maintain | Desktop and Android Chrome: "Salva come PDF" is a print destination, good. iOS Safari: the print sheet needs Share > Save to Files (or a pinch on the preview), which few people know; in-app browsers (Instagram, Facebook, Gmail webviews) often ignore `window.print()` |

Sizes from `npm pack` + `gzip -9` in a temp folder. The iOS/Android print behaviour is from current platform knowledge, not from a source checked today: verify on a device.

Notes on jsPDF:
- Lazy load on click: `const { jsPDF } = await import('jspdf')` in the success-screen script; Vite splits it into its own chunk, so /borsa pays nothing until the tap.
- The built-in Helvetica uses WinAnsi encoding, which covers Italian accents, `€`, `·` and `×` used by `orderEmail`. Text-only layout (`text`, `line`, `splitTextToSize`), no `html()`, so the optional deps never load.
- Build the PDF from data already in the browser: the form fields plus the 200 response (lines, totals, `code`). Nothing personal travels back from the server.
- Deliver with `doc.save('ordine-<code>.pdf')`; on iOS Safari this opens the PDF viewer, from which Share > Save to Files works.

**Recommendation: jsPDF, lazy-loaded, text-only**, with the print stylesheet kept as a free secondary path ("Stampa") for desktop users.

Sources:
- https://www.npmjs.com/package/jspdf
- https://www.npmjs.com/package/pdf-lib

---

## D. Staff page `/staff/ordini`

Confirmed from `src/middleware.ts`:
- `/staff/ordini` matches the `/staff` prefix, so without the draft cookie the middleware answers a flat 404 (with `cache.set(false)` and `private, no-store` on Cloudflare) **before** the page runs. The page itself needs no guard and must be `prerender = false`.
- With the cookie, the middleware calls `next()` and marks the response private (`isInternalPath` makes it non-cacheable), so order data never enters Workers Cache.
- The page reads D1 the same way as the endpoint (wrapper from A7). On the Vercel build, or when `DB` is null, it renders "Ordini non disponibili su questo ambiente" instead of failing.

**Risk to raise**: the "editor session" is the draft-mode cookie, which `/api/draft-mode/enable?token=SECRET_API_TOKEN` issues to **anyone who opens a DatoCMS preview link** (`src/pages/api/preview-links/index.ts` builds that URL for the Web Previews plugin). So every DatoCMS editor with preview access would see buyers' names, addresses and phones. Today `/staff` exposes stock figures; orders are personal data. Options: accept it (small trusted team, document it), or add a second check for `/staff/ordini` only (for example Cloudflare Access on that path via Zero Trust's free tier, whose seat limit was not checked in this spike, or a separate staff secret). Decide before building D.

---

## E. Recommendation and risks

### Recommendation

1. **D1 is the record of truth; the email is a notification.** Endpoint order: existing checks (config, size, JSON, fields, Turnstile, CDA rebuild, totals) > **insert into D1** > **send one email** to ordini@ via `send_email` (structured `send()`, `replyTo` = buyer) > update `notify_status` > answer 200 with `code` (and `notified`). No visitor email; the success screen offers the jsPDF download.
2. Email Routing on **a subdomain only**, after publishing the Google SPF on the apex; API path if the dashboard only offers apex onboarding.
3. Bindings reached through one wrapper module with a Vite alias stub for non-Cloudflare builds.
4. Drop `RESEND_API_KEY` from `astro.config.mjs` and the endpoint; `ORDER_FROM` becomes the routing-subdomain sender; the `copySent` response field goes away (the client must stop reading it).

### Missing bindings and failures

| Situation | Behaviour |
|---|---|
| `DB` and `ORDER_MAIL` both missing, outside dev (Vercel build, misconfigured Worker) | **503 `not_configured`** (fail closed). The bag UI already has the `bagMailto` fallback |
| Dev (Node), no bindings | Log the email text to the console (as today) and answer 200 with a fake `code` |
| `DB` present, `ORDER_MAIL` missing or send throws | **200**: order saved, `notify_status='failed'` with the error code; staff page highlights unnotified orders; optional cron retry |
| `DB` insert fails, `ORDER_MAIL` works | Send the email anyway (it carries the whole order), answer 200 with `notified: true`, log `db_failed`. The order is not lost |
| Both fail | **502 `send_failed`** (or a new `save_failed`), visitor gets the mailto fallback |

Rationale: the visitor's order must never vanish silently, and one working channel is enough.

### CPU (10 ms)

- Network waits do not count: siteverify `fetch`, the CDA query, the D1 insert and the `send_email` call are all I/O. CPU is JSON parse, validation, `rebuildOrder`, `orderEmail` string building and the Astro router: a few ms at most. Subrequests: about 4 of 50.
- Avoid in the endpoint: MIME libraries (another reason for structured `send()`), PDF generation (kept in the browser), large JSON stringify of the catalogue.
- Startup limit is 1 s for global scope; nothing here adds to it.
- Watch `EXCEEDED_CPU` in Workers Logs (observability is enabled) for the first orders.

### Risks and open points

1. **Apex SPF side effect** of subdomain Email Routing (A3): publish Google SPF first, diff DNS after. Highest-impact risk because it touches all @multimage.org mail.
2. **Dashboard may not allow subdomain-only** on a zone with foreign apex MX: API call needed (token with four permissions). Never accept the apex onboarding prompt.
3. **Structured `send()` with a routing-only domain** is implied, not stated in one place (A6): verify with the first send; `EmailMessage` + `mimetext` is the fallback.
4. **Email Routing summary shows `send_email` messages as dropped** even when delivered: confirm delivery in the ordini@ inbox, not in the dashboard.
5. **Staff page visibility** (D): any DatoCMS editor with preview links would see personal data. Decide the gate before building it.
6. **Free-plan ceilings**: 100,000 requests/day for the whole site, D1 100,000 writes/day; an order spam wave is stopped by Turnstile, but consider a WAF rate-limit rule on `POST /api/ordine` if the zone plan allows one.
7. **Vercel build** must keep compiling: the alias stub is new config in `astro.config.mjs`; test both `npm run build` and `npm run build:cf` in the gate.
8. **Retention** needs a decision from the association (period, who erases on request) and a line in the privacy notice.
9. Re-check pricing/limits pages before implementation: Email Service is in beta and its docs changed often in 2026.

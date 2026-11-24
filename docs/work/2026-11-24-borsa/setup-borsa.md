# Setup note: going live with the bag and the order form

For the person who runs the Multimage Cloudflare account. Follow the steps in order: the order matters (apex SPF before Email Routing, the WAF rule before the Turnstile secret, the public site key last). Everything stays on Cloudflare: orders are saved in a D1 database and a notice goes to `ordini@multimage.org` through Email Routing. No secret value is written here or anywhere in the repo.

Every command runs from the repo root as `npx dotenv -e .env.cloudflare -- <command>`, so Wrangler finds the account. Never print the env file or a key.

## 0. What ships and what a missing piece means

From the client code (`src/pages/borsa/_order-page.client.ts`) and the endpoint (`src/pages/api/ordine/index.ts`):

- No `PUBLIC_TURNSTILE_SITE_KEY` built in: `/borsa` shows the email box at once (the `mailto:` way). A half-done setup never shows a form that cannot send.
- Site key built in but no `TURNSTILE_SECRET_KEY`, or neither the `ORDERS` nor the `ORDER_MAIL` binding: `POST /api/ordine` answers 503 `not_configured`. The form still shows, and the email box appears after a visitor submits.
- Placeholder D1 id in `wrangler.jsonc` (before step 4): with the placeholder id the deploy should fail. If it does not, saves fail and orders reach `ordini@` by email only.
- With everything in place, an order is saved in D1, then one notice goes to `ordini@multimage.org`; the visitor gets no email, only the PDF of the request on the confirmation screen.

## 1. DNS export and apex SPF

Do the SPF first: if the apex has no SPF when Email Routing is enabled, Cloudflare adds its own (`include:_spf.mx.cloudflare.net`) and Google Workspace mail from `@multimage.org` goes from "no SPF" to a softfail.

- **Do**:
  1. Cloudflare dashboard -> zone `multimage.org` -> DNS -> Records -> Export. Keep the file: you compare against it in step 2.
  2. Add a TXT record on the apex (`@`) with value `v=spf1 include:_spf.google.com ~all` (agree it with whoever runs Google Workspace).
- **Check**: `dig +short TXT multimage.org` shows that one `v=spf1` record (plus the two `google-site-verification` ones). Mail from `@multimage.org` to another mailbox still arrives.

## 2. Email Routing on `ordini.multimage.org` (API only)

Email Routing is enabled on the subdomain `ordini.multimage.org` only, so the apex MX (Google Workspace, carries the `ordini@` mailbox) stays untouched. The dashboard may only offer the apex, which proposes replacing the apex MX: never accept that prompt. Do not use `wrangler email routing enable`: it acts on the whole zone.

- **Do**: create an API token with Zone Settings Write, Email Routing Rules Write, DNS Write (zone `multimage.org`) and Account Email Routing Addresses Write; keep it out of the repo and out of chat. Then, with `ZONE_ID` the zone id and the token in `CF_API_TOKEN` (set in your shell only):
  1. Preview: `curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/dns?subdomain=ordini"`.
  2. Enable: `curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H 'content-type: application/json' "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/dns" -d '{"name":"ordini.multimage.org"}'`.
  3. Export the DNS again and diff it against the step 1 file.
- **Check**: the diff shows new MX and TXT records on `ordini.` (and possibly `cf2024-1._domainkey` at the apex). The apex MX records and the Google SPF are unchanged. If an extra apex SPF appeared, remove it (unlock it first in Email Routing settings). The zone may read "misconfigured" in the dashboard while the subdomain is ready: that is expected.

## 3. Verify `ordini@multimage.org` as destination

- **Do**: Email Routing -> Destination addresses -> add `ordini@multimage.org` (or `npx dotenv -e .env.cloudflare -- npx wrangler email routing addresses create ordini@multimage.org`). Whoever reads `ordini@` opens the verification email and clicks the link in a normal browser (it sits behind a Cloudflare challenge).
- **Check**: the address reads Verified. No routing rule is needed to send.

## 4. D1 database

- **Do**:
  1. `npx dotenv -e .env.cloudflare -- npx wrangler d1 create multimage-orders --jurisdiction eu` (EU jurisdiction: the order data stays in the EU). It prints the database id.
  2. Put the id in `wrangler.jsonc`, as `database_id` of the `ORDERS` binding, replacing the placeholder, and commit it before the merge.
  3. `npx dotenv -e .env.cloudflare -- npx wrangler d1 migrations apply multimage-orders --remote` (migrations are in `d1/migrations/`).
- **Check**: `npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "SELECT count(*) AS n FROM orders"` prints `n` = 0.

## 5. WAF rate limiting rule (before the Turnstile secret)

- **Do**: zone `multimage.org` -> Security -> WAF -> Rate limiting rules (newer dashboards: Security rules -> Create rule -> Rate limiting rule). One rule (the Free plan allows one):
  - Expression: `http.request.uri.path eq "/api/ordine"` (path only: the Free plan likely offers only Path and Verified Bot fields, so no Method condition; GET requests count too, they get 405 and are harmless).
  - Counted per IP, 2 requests per 10 seconds, action Block for 10 seconds.
  - Confirm the field and period options in the dashboard: if it offers other values, keep 2 requests per 10 s.
- **Check**: `for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/ordine -H 'content-type: application/json' -d '{}'; done` prints 404 for the first ones (the endpoint is not on production until the deploy of step 7; 503 or 400 after it) and 429 by the 3rd or 4th request (counters are approximate). The 429 is what proves the rule. A bare `{}` fails before anything is saved or sent. Run the same check again after step 7.

## 6. Turnstile widget, secret and site key

- **Do**:
  1. Cloudflare dashboard -> Turnstile -> Add widget. Name "Multimage ordine", hostnames `www.multimage.org` and `multimage.org`, mode Managed. Note the site key (public) and the secret key.
  2. `npx dotenv -e .env.cloudflare -- npx wrangler secret put TURNSTILE_SECRET_KEY`, paste the secret key at the prompt.
  3. Add the line `PUBLIC_TURNSTILE_SITE_KEY=<site key>` to `.env.cloudflare`. It is inlined at build time, so it is not a Worker secret and must not be put as one. Vercel needs nothing (no traffic).
- **Check**: the widget is listed with both hostnames; `npx dotenv -e .env.cloudflare -- npx wrangler secret list` lists `TURNSTILE_SECRET_KEY` (it never prints values). A secret put starts a new Worker version, so the cache empties (see `docs/guidelines/caching.md`): expect a few slower first requests.

## 7. Deploy and the first real order

- **Do**: after the merge into `main`, `npx dotenv -e .env.cloudflare -- npm run deploy:cf`. Then place one real order from `/borsa` with your own email.
- **Check**:
  - The step 5 loop now prints 400 for the first requests, then 429.
  - Saved and notified: `npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "SELECT code, notify_status, notify_error FROM orders ORDER BY created_at DESC LIMIT 1"` shows `notify_status` = `sent`. If it shows `failed`, `notify_error` holds the send error code (see `spike-cloudflare-only.md` A2, A6; the fallback for `E_SENDER_DOMAIN_NOT_AVAILABLE` is a raw `EmailMessage`).
  - Delivered and authenticated: the notice is in the `ordini@` inbox (the Email Routing summary shows `send_email` messages as dropped even when delivered: trust the inbox). In Gmail, "Show original" reads `dkim=pass` (and `spf=pass`).
  - The confirmation screen shows the code and the PDF downloads.

## 8. DMARC, Gmail filter and checklist

- **Do**: add the TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:<reports address>` (tighten after reading the reports; Workspace DKIM, Admin console -> Gmail -> Authenticate email, is advised at the same time: TODO MAIL-auth). In Gmail on `ordini@`, create a filter "from:sito@ordini.multimage.org" -> Never send to Spam.
- **Check**:
  - [ ] `/borsa` with a book shows the form and the widget.
  - [ ] `npx dotenv -e .env.cloudflare -- npx wrangler tail multimage-astro --format json` shows `[ordine] 200` lines with counts only: no name, email, address or notes.
  - [ ] `curl -s -o /dev/null -w '%{http_code}' https://www.multimage.org/api/ordine` prints 405.
  - [ ] WAVE (browser extension) on `/borsa` filled and on the success state, and with the bag drawer open: 0 errors, 0 contrast errors (bar: home 0/0, AIM 9.7, 2026-11-22).
  - [ ] VoiceOver pass (V2 Done 6, pending): Safari, Cmd+F5; open the bag from the header; Tab through the form; submit with an empty name and hear the error with its field; reach the widget; hear the success heading.
  - [ ] The PDF opens and reads well on a phone (iPhone Safari and Android Chrome).
  - [ ] `/info/ordinare` (CMS) shows the same IBAN, BIC and PayPal as `src/lib/order.ts` (TODO BORSA-info-sync).
  - [ ] The privacy policy (iubenda) and `/info/ordinare` name Cloudflare as processor and the retention (TODO BORSA-privacy).
  - [ ] Tell the staff the order form is live and where the notices arrive.

## 9. Unsent notices and anonymising

Until the staff app exists, nobody reads D1 by itself: an order saved but not notified (`notify_status` other than `sent`) is invisible unless you look. The visitor is told the notice did not go out and can write to `ordini@` with the code.

- **Do**: run this at least weekly, and whenever a visitor writes about a code:
  `npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --json --command "SELECT code, created_at, notify_status, notify_error FROM orders WHERE notify_status <> 'sent' ORDER BY created_at DESC"`
  Forward each row found to `ordini@` by hand (read the order itself with `SELECT * FROM orders WHERE code = '<code>'`).
- **Anonymise**: the personal data stays only until the order ships. After each shipment, until the staff app does it:
  `npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code='<code>'"`
  An erasure request is the same UPDATE with `WHERE email='<address>'`.
- **Check**: the first query returns an empty list when every notice went out; after the UPDATE, `SELECT code, name, email FROM orders WHERE code='<code>'` shows NULLs.

## 10. Rollback

- **Do**:
  1. Stop the endpoint: `npx dotenv -e .env.cloudflare -- npx wrangler secret delete TURNSTILE_SECRET_KEY`.
  2. Take the form away: remove the `PUBLIC_TURNSTILE_SITE_KEY` line from `.env.cloudflare` and redeploy with `npx dotenv -e .env.cloudflare -- npm run deploy:cf`.
- **Check**: after step 1 alone, `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/ordine -H 'content-type: application/json' -d '{}'` prints 503, but the site key is still built in, so `/borsa` still shows the form and the widget; the email box appears only after a visitor submits. After step 2, `/borsa` with a book in the bag shows the email box at once. Rows already saved stay in D1: keep running step 9 for them.

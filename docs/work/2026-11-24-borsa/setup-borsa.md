# Setup note: going live with the bag and the order form

For the person who runs the Multimage Cloudflare account. Follow the steps in order: the order matters (WAF rule before the Resend key, public site key last). No secret value is written here or anywhere in the repo.

Every command runs from the repo root as `npx dotenv -e .env.cloudflare -- <command>`, so Wrangler finds the account. Never print the env file or a key.

## 0. What ships and what a missing key means

- Without `PUBLIC_TURNSTILE_SITE_KEY` built in, `/borsa` shows the email box only (the `mailto:` way). A half-done setup never shows a form that cannot send.
- With the site key but without `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`, `POST /api/ordine` answers 503 `not_configured` and the page falls back to the email box.
- With all three, the form sends two emails: the order to `ordini@multimage.org` and a copy to the visitor.
- First, after the merge into `main`, deploy once with no keys.
  - **Do**: `npx dotenv -e .env.cloudflare -- npm run deploy:cf`
  - **Check**: `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/ordine -H 'content-type: application/json' -d '{}'` prints 503, and `/borsa` with a book in the bag shows the email box.

## 1. Sender

`ORDER_FROM` in `src/lib/order.ts` is `Multimage <ordini@send.multimage.org>`. Its domain, `send.multimage.org`, is the one added to Resend in step 2.

- **Do**: confirm this sender, or change `ORDER_FROM` (a code commit, before the deploy of step 7).
- **Check**: the domain after the `@` is the one you add in step 2.

## 2. Resend account and domain

- **Do**:
  1. Create a Resend account (free tier: 3,000 emails/month, 100/day, a hard stop with no overage).
  2. Domains -> Add domain: enter the sender's domain (`send.multimage.org`), region EU if offered.
  3. API Keys -> create a key with "Sending access" restricted to that domain. Keep it only until step 6.
- **Check**: Resend lists the domain as Pending and shows the DNS records to add.

## 3. DNS on Cloudflare

- **Do**: Cloudflare dashboard -> zone `multimage.org` -> DNS -> Records. Add exactly the records Resend lists, copying names and values as Resend shows them: an MX and an SPF TXT under the sender's domain (for `send.multimage.org`: `send.send`) and a DKIM TXT (`resend._domainkey.send`). Set each to DNS only (grey cloud). Never touch the apex MX records: they are Google Workspace and carry the `ordini@` mailbox.
- **Check**: in Resend, "Verify DNS records" turns the domain to Verified. Send yourself a normal mail at `ordini@multimage.org` from another account to see the mailbox still works.

## 4. WAF rate limiting rule (before the Resend key)

- **Do**: zone `multimage.org` -> Security -> WAF -> Rate limiting rules (newer dashboards: Security rules -> Create rule -> Rate limiting rule). One rule (the Free plan allows one):
  - Expression: `http.request.uri.path eq "/api/ordine"` (path only: the Free plan likely offers only Path and Verified Bot fields, so no Method condition; GET requests count too, they get 405 and are harmless).
  - Counted per IP, 2 requests per 10 seconds, action Block for 10 seconds.
  - Confirm the field and period options in the dashboard: if it offers other values, keep 2 requests per 10 s.
- **Check**: `for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/ordine -H 'content-type: application/json' -d '{}'; done` prints 503 for the first ones and 429 by the 3rd or 4th request (counters are approximate). The bare `{}` never sends mail.

## 5. Turnstile widget

- **Do**: Cloudflare dashboard -> Turnstile -> Add widget. Name "Multimage ordine", hostnames `www.multimage.org` and `multimage.org`, mode Managed. Note the site key (public) and the secret key.
- **Check**: the widget is listed with both hostnames.

## 6. Worker secrets

- **Do**: for each of the two, run the command and paste the value at the prompt:
  - `npx dotenv -e .env.cloudflare -- npx wrangler secret put RESEND_API_KEY` (the key from step 2)
  - `npx dotenv -e .env.cloudflare -- npx wrangler secret put TURNSTILE_SECRET_KEY` (the secret key from step 5)
- **Check**: `npx dotenv -e .env.cloudflare -- npx wrangler secret list` lists both names (it never prints values). A secret put starts a new Worker version, so the cache empties (see `docs/guidelines/caching.md`): expect a few slower first requests.

## 7. Site key and redeploy (last)

`PUBLIC_TURNSTILE_SITE_KEY` is inlined at build time, so it is not a Worker secret: it goes in the build env file. It must not be put as a Worker secret.

- **Do**: add the line `PUBLIC_TURNSTILE_SITE_KEY=<site key>` to `.env.cloudflare`, then redeploy: `npx dotenv -e .env.cloudflare -- npm run deploy:cf`. Vercel needs nothing (no traffic).
- **Check**: `/borsa` with a book in the bag shows the form and the Turnstile widget instead of the email box.

## 8. Post-deploy checklist

- [ ] `/borsa` with a book shows the form and the widget.
- [ ] One real order with your own email: `ordini@` receives the shop email (Reply-To is you); you receive the copy (Reply-To is `ordini@`; check spam); Resend -> Emails shows both delivered.
- [ ] `npx dotenv -e .env.cloudflare -- npx wrangler tail multimage-astro --format json` shows `[ordine] 200` with counts and no name or email.
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://www.multimage.org/api/ordine` prints 405.
- [ ] WAVE (browser extension) on `/borsa` filled and on the success state, and with the bag drawer open: 0 errors, 0 contrast errors (bar: home 0/0, AIM 9.7, 2026-11-22).
- [ ] VoiceOver pass (V2 Done 6, pending): Safari, Cmd+F5; open the bag from the header; Tab through the form; submit with an empty name and hear the error with its field; reach the widget; hear the success heading.
- [ ] Tell Olivier the order form is live and where the emails arrive.
- [ ] `/info/ordinare` (CMS) shows the same IBAN, BIC and PayPal as `src/lib/order.ts` (TODO BORSA-info-sync).

## 9. Rollback

- **Do**:
  1. Stop the sending: `npx dotenv -e .env.cloudflare -- npx wrangler secret delete RESEND_API_KEY`.
  2. Take the form away: remove the `PUBLIC_TURNSTILE_SITE_KEY` line from `.env.cloudflare` and redeploy with `npx dotenv -e .env.cloudflare -- npm run deploy:cf`.
- **Check**: after step 1 alone, `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/ordine -H 'content-type: application/json' -d '{}'` prints 503, but the site key is still built in, so `/borsa` still shows the form and the widget; the email box appears only after a visitor submits. After step 2, `/borsa` with a book in the bag shows the email box at once.

## 10. Follow-up, separate (TODO MAIL-auth)

multimage.org has no SPF, no DMARC and probably no Workspace DKIM today. Agree this with whoever runs Google Workspace; it does not block the steps above.

- Apex SPF TXT: `v=spf1 include:_spf.google.com ~all`
- Workspace DKIM: Admin console -> Gmail -> Authenticate email, publish the TXT `google._domainkey`.
- Then `_dmarc` TXT: `v=DMARC1; p=none; rua=mailto:<reports address>`, tightened after reading the reports.

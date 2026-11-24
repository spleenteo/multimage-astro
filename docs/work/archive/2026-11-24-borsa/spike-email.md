# Spike — sending the order email from a Worker on the Free plan

- **Work**: borsa
- **Date checked**: 2026-11-24 (all sources below read on this date)
- **Kind**: research only. No code, no deploy, no account or DNS changes.
- **Constraint**: Workers Free plan only (10 ms CPU per request); Workers Paid is ruled out.

## Questions

1. Can the Cloudflare Email Routing `send_email` binding send to non-verified recipients? Is it on Workers Free? Limits?
2. Cloudflare Email Service (Email Sending): status, Workers Free availability, free quota, domain requirements, arbitrary recipients, how to call it from Astro on Cloudflare.
3. External providers with a free tier usable via `fetch` from a Worker: quotas, domain verification.
4. Turnstile: cost, server-side verification cost in CPU terms, Free plan concerns.
5. Recommendation, with risks: SPF/DKIM/DMARC for multimage.org, and whether enabling Email Routing would break the existing mailbox for ordini@.

## Current DNS for multimage.org (read-only `dig`, 2026-11-24)

| Record | Value | Meaning |
|---|---|---|
| NS | `athena.ns.cloudflare.com`, `lou.ns.cloudflare.com` | DNS is on Cloudflare: provider records can be added in the same zone |
| MX | `aspmx.l.google.com` (1), `alt1/alt2.aspmx.l.google.com`, `aspmx2/3/4.googlemail.com` | Incoming mail, including ordini@, is handled by **Google Workspace** |
| TXT (apex) | two `google-site-verification=` only | **No SPF record** at the apex |
| TXT `_dmarc` | none | **No DMARC record** |
| TXT `google._domainkey` | none | No Google DKIM key at the default selector (Workspace DKIM probably not enabled) |
| TXT `send` | none | Free for a provider's sending subdomain |

The project's `wrangler.jsonc` has no `send_email` binding today (compatibility date 2026-11-01, `nodejs_compat`).

## Outcomes

### 1. Email Routing `send_email` binding

- Sending to **verified destination addresses** is free on every plan, including Workers Free and Email Routing-only setups, and does not count toward any quota. Sending to **arbitrary recipients requires Workers Paid**. On the Free plan an unverified recipient fails with `E_RECIPIENT_PLAN_RESTRICTED` (or `E_RECIPIENT_NOT_ALLOWED` when no sending domain is onboarded).
- Destination addresses are account-scoped and verified by clicking a link Cloudflare emails to them. Max 200 per account, 200 routing rules per domain.
- Before a binding can be used, Email Routing must be enabled on a domain of the account with at least one verified address. The `from` must be on a routing domain.
- **Conclusion**: it covers email (a) to ordini@ (which can be verified once) but **not** email (b) to the visitor. Not enough on its own.
- **MX conflict (flag)**: enabling Email Routing on the apex `multimage.org` **would break the Google Workspace mailbox**. Onboarding fails with error 2008 "Non-Cloudflare MX records exist", and the documented migration is to delete the current provider's MX records first. Email Routing cannot coexist with external mail servers on the same name. Email Routing can be enabled on a **subdomain** instead (records go on the subdomain, the docs imply the apex is untouched but say to check it afterwards), which would leave Google's MX in place.

Sources:
- https://developers.cloudflare.com/email-service/platform/pricing/
- https://developers.cloudflare.com/email-service/platform/limits/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/email-service/configuration/send-bindings/
- https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/
- https://developers.cloudflare.com/email-routing/setup/email-routing-dns-records/
- https://developers.cloudflare.com/email-routing/setup/subdomains/

### 2. Cloudflare Email Service (Email Sending)

- **Status**: public beta since 2026-04-16. No GA entry in the changelog as of the last entry (2026-09-25). SMTP submission is also beta (2026-06-08).
- **Plan**: Email Sending is **not available on Workers Free**. Workers Paid includes 3,000 emails/month, then $0.35 per 1,000. Ruled out by our constraint.
- Domain requirements (for reference): onboarding adds SPF and DKIM records automatically; DNS must be on Cloudflare (it is). After onboarding, any recipient is allowed; new accounts get a conservative daily quota that grows with reputation; 50 recipients per message, 25 MiB per message.
- How it would be called (for reference, if the plan constraint ever changes): `"send_email": [{ "name": "EMAIL" }]` in `wrangler.jsonc`, then in the Astro endpoint `import { env } from 'cloudflare:workers'` and `await env.EMAIL.send({ from, to, subject, html, text, replyTo })`, which returns `{ messageId }` and throws errors with a `code`.

Sources:
- https://developers.cloudflare.com/email-service/platform/pricing/
- https://developers.cloudflare.com/changelog/product/email-service/
- https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/
- https://blog.cloudflare.com/email-for-agents
- https://developers.cloudflare.com/email-service/platform/limits/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/

### 3. External providers (HTTP API via `fetch`)

| Provider | Free tier | Notes |
|---|---|---|
| **Resend** | 3,000 emails/month, **100/day**, 3 domains, 30-day log retention, no overage (sending stops at the limit) | Simple JSON API (`POST https://api.resend.com/emails` with a Bearer key). Recommends a sending subdomain. Records on Cloudflare: `MX send` + `TXT send` (SPF, Amazon SES) and `TXT resend._domainkey` (DKIM). The apex MX is not touched |
| **Brevo** | **300 emails/day**, full transactional API, SMTP relay and webhooks | Free-plan emails always carry a **"Sent with Brevo"** footer that cannot be removed. Needs domain authentication (DKIM/DMARC) for a custom sender |
| **Postmark** | Developer plan: **100 emails/month**, no overage, never expires, up to 10 sending domains | Best deliverability reputation, but 100/month is about 50 orders (2 emails each). Too tight |

All three work with a plain `fetch` from the Worker; the wait on the network does not count toward CPU time (see 4).

Sources:
- https://resend.com/pricing
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/knowledge-base/cloudflare
- https://www.brevo.com/features/email-api/
- https://help.brevo.com/hc/en-us/articles/208580669
- https://postmarkapp.com/pricing

### 4. Turnstile

- **Free**: Turnstile Free plan, up to 20 widgets per account, 10 hostnames per widget, unlimited challenges and verification requests, 7-day analytics. Cloudflare branding stays on the widget.
- **Server-side**: one `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response` (token) and optional `remoteip` / `idempotency_key`. Tokens last 300 s, are single use (replay returns `timeout-or-duplicate`), max 2048 chars. Check `success`, and also `hostname` and `action` against expected values. Calling siteverify is mandatory: the widget alone protects nothing. No documented rate limit on siteverify; the docs suggest rate limiting your own endpoint.
- **CPU cost**: negligible. On Workers Free the limit is 10 ms CPU per HTTP request, and "waiting on network requests (such as `fetch()` calls ...) does not count toward CPU time". The whole order endpoint is form parsing + 1 siteverify fetch + 1 or 2 provider fetches + building a short HTML/text body: a few ms of CPU at most. Subrequests: 4 at most, well under the 50 limit. Requests per day: 100,000.

Sources:
- https://developers.cloudflare.com/turnstile/plans/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/workers/platform/limits/

### 5. Recommendation

**Use Resend (free tier) via `fetch` from the Astro API route, with Turnstile in front.** One provider for both emails, no change to the Google Workspace MX, no Cloudflare plan change.

- Sender: an address on a Resend-verified subdomain of multimage.org, for example `ordini@send.multimage.org` or `noreply@...` (to decide), with `Reply-To: ordini@multimage.org` on the visitor copy so replies land in Olivier's real mailbox, and `Reply-To: <visitor>` on the internal email so Olivier can answer with one click.
- Email (a) to ordini@multimage.org and email (b) to the visitor: two sends (or one batch call). Keep the visitor copy as a fixed template with the order contents only, so the form cannot be used to send arbitrary text to arbitrary addresses.
- Secrets (Resend API key, Turnstile secret) as Worker secrets; never in the repo.
- Capacity: 100 emails/day = 50 orders/day; 3,000/month = 1,500 orders/month. Far above expected volume for a small publisher.
- Fallback with no new vendor for email (a) only: Email Routing on a **subdomain** plus ordini@ verified as destination. It does not solve (b), so it is not worth the extra setup unless Resend is refused.

Risks and open points:

1. **Do not enable Email Routing on the apex `multimage.org`.** It requires removing Google's MX records and would break the ordini@ mailbox (and every other @multimage.org mailbox).
2. **No SPF and no DMARC on multimage.org today**, and no visible Google DKIM. Resend on a subdomain brings its own SPF (on `send.`) and DKIM (`resend._domainkey.multimage.org`, `d=multimage.org`, so it aligns with a future DMARC). Strongly suggested, as separate DNS work to agree with whoever manages Google Workspace: apex SPF `v=spf1 include:_spf.google.com ~all`, Workspace DKIM, then DMARC starting at `p=none`. Without DMARC, Gmail and Yahoo treat bulk senders harshly; a low-volume transactional sender is accepted but lands in spam more easily.
3. **Free-tier ceilings are hard stops** (Resend: no overage). If a day exceeds 100 emails the endpoint must fail gracefully and still show the visitor how to contact ordini@ directly. Consider sending the internal email first, so the order is never lost if only the copy fails.
4. **Abuse**: the form sends mail to an address typed by a stranger. Turnstile, a server-side check that the books list is non-empty and valid, a size cap on notes, and Cloudflare's rate limiting (WAF rate limiting rule, if available on the zone plan) keep it from becoming a spam relay that would burn the sending reputation.
5. **Vendor terms are dated 2026-11-24**: re-check pricing pages before implementation. Brevo is the second choice (300/day) if Resend is not acceptable, at the cost of its forced footer.
6. Cloudflare Email Service becomes the natural choice only if the account ever moves to Workers Paid; the binding code path is documented above.

# Orders database (D1)

Database `multimage-orders` (Cloudflare D1, EU jurisdiction). Migrations live in `d1/migrations/` (`migrations/` belongs to DatoCMS) and are wired by `migrations_dir` on the `ORDERS` binding in `wrangler.jsonc`.

## Contract

The `orders` table is the contract between two Workers: this site and the separate staff app.

- The site only writes. It INSERTs one row per order, then UPDATEs `notify_status` and `notify_error` of that row by `code`. On a UNIQUE clash on `orders.code` the endpoint regenerates the code and retries the insert once.
- The staff app reads, fulfils, deletes or anonymises rows. It addresses a row by `code`, never by `id`.
- Anonymise: `UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code=?`. The site always writes name, email and address, so NULL means anonymised.
- Money is integer cents. Times are ISO 8601 in UTC (`2026-11-24T10:15:00.000Z`).
- Migrations are additive only: never rename or drop a column the other side reads. The staff app adds its own columns (for example a status) by a new migration.
- `shipping_kind`, `buyer_kind`, `member` and `notify_status` have CHECK constraints: a new value needs a migration.
- `member` (0/1) and `discount_cents` come from migration 0002; the discount is 30% of `subtotal_cents`, never of shipping; it is 0 unless `member` = 1, rounded half up to the cent (`memberDiscount` in `src/lib/order.ts`).

## Columns

| Column           | Type                     | Meaning                                                                                                         | Written by                           |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`             | INTEGER PK AUTOINCREMENT | Internal row id                                                                                                 | database                             |
| `code`           | TEXT NOT NULL UNIQUE     | Readable order code, `MM-YYMMDD-XXXX`; the public key of the order                                              | site (INSERT)                        |
| `created_at`     | TEXT NOT NULL            | When the order was saved                                                                                        | site (INSERT)                        |
| `name`           | TEXT NULL                | Buyer name; NULL once anonymised                                                                                | site (INSERT), staff (anonymise)     |
| `email`          | TEXT NULL                | Buyer email; NULL once anonymised                                                                               | site (INSERT), staff (anonymise)     |
| `phone`          | TEXT NULL                | Buyer phone, optional; NULL once anonymised                                                                     | site (INSERT), staff (anonymise)     |
| `address`        | TEXT NULL                | Street address; NULL once anonymised                                                                            | site (INSERT), staff (anonymise)     |
| `city`           | TEXT NOT NULL            | Shipping CAP and city, "50123 Firenze" (two form fields, joined by the site)                                    | site (INSERT)                        |
| `province`       | TEXT NOT NULL            | Shipping province                                                                                               | site (INSERT)                        |
| `shipping_kind`  | TEXT NOT NULL            | `piego` or `rapida`                                                                                             | site (INSERT)                        |
| `buyer_kind`     | TEXT NOT NULL            | `privato`, `scuola`, `associazione` or `libreria`                                                               | site (INSERT)                        |
| `notes`          | TEXT NULL                | Buyer notes, optional; NULL once anonymised                                                                     | site (INSERT), staff (anonymise)     |
| `lines_json`     | TEXT NOT NULL            | JSON array of the order lines, rebuilt on the server (see below)                                                | site (INSERT)                        |
| `copies`         | INTEGER NOT NULL         | Total copies                                                                                                    | site (INSERT)                        |
| `subtotal_cents` | INTEGER NOT NULL         | Books total at cover price, in cents                                                                            | site (INSERT)                        |
| `shipping_cents` | INTEGER NOT NULL         | Shipping cost, in cents                                                                                         | site (INSERT)                        |
| `total_cents`    | INTEGER NOT NULL         | Subtotal minus discount plus shipping, in cents                                                                 | site (INSERT)                        |
| `member`         | INTEGER NOT NULL         | 1 when the buyer ticked 'Sono socia o socio'; the staff checks membership (default 0, CHECK 0/1)                | site (INSERT)                        |
| `discount_cents` | INTEGER NOT NULL         | Member discount, in cents: 0 unless `member` = 1, rounded half up (`memberDiscount`); default 0                 | site (INSERT)                        |
| `consent_at`     | TEXT NOT NULL            | When the buyer accepted the privacy line                                                                        | site (INSERT)                        |
| `notify_status`  | TEXT NOT NULL            | `pending` (default), `sent`, `failed` or `skipped`                                                              | site (INSERT, then UPDATE by `code`) |
| `notify_error`   | TEXT NULL                | Why the notification email did not go: an `E_...` code from the send, `unknown` or `no_binding`; NULL otherwise | site (UPDATE by `code`)              |

`lines_json` is an array of `{ id, slug, title, authors, priceCents, qty, amountCents }`: titles and prices come from the catalogue, never from the browser.

## Retention

Personal fields (`name`, `email`, `phone`, `address`, `notes`) are kept until the order ships, then anonymised with the UPDATE by `code` (the staff app will do it; until then it is run by hand after each shipment):

```bash
npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code='<code>'"
```

Erasure requests are the same UPDATE with `WHERE email='<address>'`. City, province, `member`, lines and totals stay after anonymising: without name and address they no longer identify a person (the user's call, 2026-11-24).

## Unsent notices

Until the staff app exists, orders whose notice did not go out (`notify_status <> 'sent'`) are found with this query, run at least weekly and whenever a visitor writes about a code; each row is forwarded to `ordini@` by hand:

```bash
npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --json --command "SELECT code, created_at, notify_status, notify_error FROM orders WHERE notify_status <> 'sent' ORDER BY created_at DESC"
```

## Commands

Address the database by name:

```bash
npx wrangler d1 create multimage-orders --jurisdiction eu   # once, then put the id in wrangler.jsonc
npx wrangler d1 migrations apply multimage-orders --local
npx wrangler d1 migrations apply multimage-orders --remote
```

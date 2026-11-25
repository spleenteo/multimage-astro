# Orders database (D1)

Database `multimage-orders` (Cloudflare D1, EU jurisdiction). Migrations live in `d1/migrations/` (`migrations/` belongs to DatoCMS) and are wired by `migrations_dir` on the `ORDERS` binding in `wrangler.jsonc`.

## Contract

The `orders` table is the contract between two Workers: this site and the separate staff app.

- The site only writes. It INSERTs one row per order, then UPDATEs `notify_status` and `notify_error` of that row by `code`. On a UNIQUE clash on `orders.code` the endpoint regenerates the code and retries the insert once.
- The staff app reads, fulfils, deletes or anonymises rows. It addresses a row by `code`, never by `id`.
- Anonymise: `UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code=?`. The site always writes name, email and address, so NULL means anonymised.
- Money is integer cents. Times are ISO 8601 in UTC (`2026-11-24T10:15:00.000Z`).
- Migrations are additive only: never rename or drop a column the other side reads. The staff app adds its own columns (for example a status) by a new migration.
- `shipping_kind`, `member` and `notify_status` have CHECK constraints: a new value needs a migration.
- Migration 0003 rebuilt the table (every column and row kept) to drop the CHECK on `buyer_kind`: buyers now come from the DatoCMS `buyer` collection, so `buyer_kind` holds the buyer's name as the CMS has it (`Socio`, `Privato`, `Scuola`, …; rows before 0003 keep the old lowercase keys), and `discount_percent` the percentage applied. `discount_cents` is that percentage of `subtotal_cents`, never of shipping, rounded half up to the cent (`buyerDiscount` in `src/lib/order.ts`). `member` is kept for compatibility and is always 0 from 0003 on (rows before it: 1 meant the member box was ticked, and 0003 set their `discount_percent` to 30).

## Columns

| Column             | Type                     | Meaning                                                                                                         | Written by                           |
| ------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`               | INTEGER PK AUTOINCREMENT | Internal row id                                                                                                 | database                             |
| `code`             | TEXT NOT NULL UNIQUE     | Readable order code, `MM-YYMMDD-XXXX`; the public key of the order                                              | site (INSERT)                        |
| `created_at`       | TEXT NOT NULL            | When the order was saved                                                                                        | site (INSERT)                        |
| `name`             | TEXT NULL                | Buyer name; NULL once anonymised                                                                                | site (INSERT), staff (anonymise)     |
| `email`            | TEXT NULL                | Buyer email; NULL once anonymised                                                                               | site (INSERT), staff (anonymise)     |
| `phone`            | TEXT NULL                | Buyer phone, optional; NULL once anonymised                                                                     | site (INSERT), staff (anonymise)     |
| `address`          | TEXT NULL                | Street address; NULL once anonymised                                                                            | site (INSERT), staff (anonymise)     |
| `city`             | TEXT NOT NULL            | Shipping CAP and city, "50123 Firenze" (two form fields, joined by the site)                                    | site (INSERT)                        |
| `province`         | TEXT NOT NULL            | Shipping province                                                                                               | site (INSERT)                        |
| `shipping_kind`    | TEXT NOT NULL            | `piego` or `rapida`                                                                                             | site (INSERT)                        |
| `buyer_kind`       | TEXT NOT NULL            | The buyer's name from the CMS `buyer` collection (`Socio`, `Privato`, …); before 0003 a lowercase key           | site (INSERT)                        |
| `notes`            | TEXT NULL                | Buyer notes, optional; NULL once anonymised                                                                     | site (INSERT), staff (anonymise)     |
| `lines_json`       | TEXT NOT NULL            | JSON array of the order lines, rebuilt on the server (see below)                                                | site (INSERT)                        |
| `copies`           | INTEGER NOT NULL         | Total copies                                                                                                    | site (INSERT)                        |
| `subtotal_cents`   | INTEGER NOT NULL         | Books total at cover price, in cents                                                                            | site (INSERT)                        |
| `shipping_cents`   | INTEGER NOT NULL         | Shipping cost, in cents                                                                                         | site (INSERT)                        |
| `total_cents`      | INTEGER NOT NULL         | Subtotal minus discount plus shipping, in cents                                                                 | site (INSERT)                        |
| `member`           | INTEGER NOT NULL         | Legacy (0002): 1 when the old member box was ticked; always 0 from 0003 on (default 0, CHECK 0/1)               | site (INSERT)                        |
| `discount_cents`   | INTEGER NOT NULL         | The buyer's discount, in cents: `discount_percent` of the books subtotal, rounded half up (`buyerDiscount`)     | site (INSERT)                        |
| `discount_percent` | INTEGER NOT NULL         | The buyer's percentage off the books when ordering (0003; 0 to 100, default 0)                                  | site (INSERT)                        |
| `consent_at`       | TEXT NOT NULL            | When the buyer accepted the privacy line                                                                        | site (INSERT)                        |
| `notify_status`    | TEXT NOT NULL            | `pending` (default), `sent`, `failed` or `skipped`                                                              | site (INSERT, then UPDATE by `code`) |
| `notify_error`     | TEXT NULL                | Why the notification email did not go: an `E_...` code from the send, `unknown` or `no_binding`; NULL otherwise | site (UPDATE by `code`)              |

`lines_json` is an array of `{ id, slug, title, authors, priceCents, qty, amountCents }`: titles and prices come from the catalogue, never from the browser.

## Retention

Personal fields (`name`, `email`, `phone`, `address`, `notes`) are kept until the order ships, then anonymised with the UPDATE by `code` (the staff app will do it; until then it is run by hand after each shipment):

```bash
npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code='<code>'"
```

Erasure requests are the same UPDATE with `WHERE email='<address>'`. City, province, buyer kind, discount, lines and totals stay after anonymising: without name and address they no longer identify a person (the user's call, 2026-11-24).

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

## Membership requests

The `membership_requests` table (migration `0004_membership_requests.sql`) holds the requests of `/diventa-socio`, one row each. Migration 0004 was applied remotely on 2026-11-25. Same rules as `orders`: the site only writes (INSERT, then UPDATE of `notify_status` and `notify_error` by `code`; on a UNIQUE clash on `membership_requests.code` the endpoint regenerates the code and retries the insert once), and any reader addresses a row by `code`, never by `id`.

Columns: `id` (INTEGER PK AUTOINCREMENT), `code` (TEXT NOT NULL UNIQUE, `SO-YYMMDD-XXXX`), `created_at`, the personal columns `email`, `first_name`, `last_name`, `birth_date`, `birth_place`, `address1`, `address2`, `city`, `region`, `postcode`, `country` (all TEXT NULL, so an erased row is valid), `fee_id`, `fee_label`, `fee_cents` (the tier as the CMS had it, re-read on the server; integer cents), `payment_method` (`bonifico` or `paypal`, CHECK), `areas_json` (JSON array of the chosen areas, CHECK `json_valid`), `areas_other` (free text, NULL if none), `consent_at`, `notify_status` (`pending` default, `sent`, `failed`, `skipped`, CHECK) and `notify_error`.

No retention rule (owner, 2026-11-24): rows stay until erased. Erasure, by `code`, sets every personal column to NULL:

```bash
npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "UPDATE membership_requests SET email=NULL, first_name=NULL, last_name=NULL, birth_date=NULL, birth_place=NULL, address1=NULL, address2=NULL, city=NULL, region=NULL, postcode=NULL, country=NULL, areas_other=NULL WHERE code='<code>'"
```

Unsent notices, run at least weekly; each row is forwarded to `info@` by hand:

```bash
npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --json --command "SELECT code, created_at, notify_status, notify_error FROM membership_requests WHERE notify_status <> 'sent' ORDER BY created_at DESC"
```

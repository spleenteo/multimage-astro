# Orders database (D1)

Database `multimage-orders` (Cloudflare D1, EU jurisdiction). Migrations live in `d1/migrations/` (`migrations/` belongs to DatoCMS) and are wired by `migrations_dir` on the `ORDERS` binding in `wrangler.jsonc`.

## Contract

The `orders` table is the contract between two Workers: this site and the separate staff app.

- The site only writes. It INSERTs one row per order, then UPDATEs `notify_status` and `notify_error` of that row by `code`.
- The staff app reads, fulfils, deletes or anonymises rows. It addresses a row by `code`, never by `id`.
- Anonymise: `UPDATE orders SET name=NULL, email=NULL, phone=NULL, address=NULL, notes=NULL WHERE code=?`. The site always writes name, email and address, so NULL means anonymised.
- Money is integer cents. Times are ISO 8601 in UTC (`2026-11-24T10:15:00.000Z`).
- Migrations are additive only: never rename or drop a column the other side reads. The staff app adds its own columns (for example a status) by a new migration.
- `shipping_kind`, `buyer_kind` and `notify_status` have CHECK constraints: a new value needs a migration.

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
| `city`           | TEXT NOT NULL            | Shipping city                                                                                                   | site (INSERT)                        |
| `province`       | TEXT NOT NULL            | Shipping province                                                                                               | site (INSERT)                        |
| `shipping_kind`  | TEXT NOT NULL            | `piego` or `rapida`                                                                                             | site (INSERT)                        |
| `buyer_kind`     | TEXT NOT NULL            | `privato`, `scuola`, `associazione` or `libreria`                                                               | site (INSERT)                        |
| `notes`          | TEXT NULL                | Buyer notes, optional; NULL once anonymised                                                                     | site (INSERT), staff (anonymise)     |
| `lines_json`     | TEXT NOT NULL            | JSON array of the order lines, rebuilt on the server (see below)                                                | site (INSERT)                        |
| `copies`         | INTEGER NOT NULL         | Total copies                                                                                                    | site (INSERT)                        |
| `subtotal_cents` | INTEGER NOT NULL         | Books total, in cents                                                                                           | site (INSERT)                        |
| `shipping_cents` | INTEGER NOT NULL         | Shipping cost, in cents                                                                                         | site (INSERT)                        |
| `total_cents`    | INTEGER NOT NULL         | Subtotal plus shipping, in cents                                                                                | site (INSERT)                        |
| `consent_at`     | TEXT NOT NULL            | When the buyer accepted the privacy line                                                                        | site (INSERT)                        |
| `notify_status`  | TEXT NOT NULL            | `pending` (default), `sent`, `failed` or `skipped`                                                              | site (INSERT, then UPDATE by `code`) |
| `notify_error`   | TEXT NULL                | Why the notification email did not go: an `E_...` code from the send, `unknown` or `no_binding`; NULL otherwise | site (UPDATE by `code`)              |

`lines_json` is an array of `{ id, slug, title, authors, priceCents, qty, amountCents }`: titles and prices come from the catalogue, never from the browser.

Retention of personal data is not decided yet (documented in V5).

## Commands

Address the database by name:

```bash
npx wrangler d1 create multimage-orders --jurisdiction eu   # once, then put the id in wrangler.jsonc
npx wrangler d1 migrations apply multimage-orders --local
npx wrangler d1 migrations apply multimage-orders --remote
```

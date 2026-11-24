-- Buyers come from the DatoCMS `buyer` collection (name + discount percent), so `buyer_kind`
-- becomes the buyer's name with no CHECK, and the applied percent is stored. SQLite cannot drop
-- a CHECK in place: the table is rebuilt with every column kept and every row copied.
-- `member` stays for compatibility (always 0 from this migration on). Contract: d1/README.md.
CREATE TABLE orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  shipping_kind TEXT NOT NULL CHECK (shipping_kind IN ('piego', 'rapida')),
  buyer_kind TEXT NOT NULL,
  notes TEXT,
  lines_json TEXT NOT NULL CHECK (json_valid(lines_json)),
  copies INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  consent_at TEXT NOT NULL,
  notify_status TEXT NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending', 'sent', 'failed', 'skipped')),
  notify_error TEXT,
  member INTEGER NOT NULL DEFAULT 0 CHECK (member IN (0, 1)),
  discount_cents INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100)
);

INSERT INTO orders_new (
  id, code, created_at, name, email, phone, address, city, province, shipping_kind, buyer_kind,
  notes, lines_json, copies, subtotal_cents, shipping_cents, total_cents, consent_at,
  notify_status, notify_error, member, discount_cents, discount_percent
)
SELECT
  id, code, created_at, name, email, phone, address, city, province, shipping_kind, buyer_kind,
  notes, lines_json, copies, subtotal_cents, shipping_cents, total_cents, consent_at,
  notify_status, notify_error, member, discount_cents, CASE WHEN member = 1 THEN 30 ELSE 0 END
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;
CREATE INDEX orders_created_at ON orders(created_at);

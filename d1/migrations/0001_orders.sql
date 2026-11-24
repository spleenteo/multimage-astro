-- Book orders from the site (/api/ordine). The table is a contract with the staff app: see d1/README.md.
CREATE TABLE orders (
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
  buyer_kind TEXT NOT NULL CHECK (buyer_kind IN ('privato', 'scuola', 'associazione', 'libreria')),
  notes TEXT,
  lines_json TEXT NOT NULL CHECK (json_valid(lines_json)),
  copies INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  consent_at TEXT NOT NULL,
  notify_status TEXT NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending', 'sent', 'failed', 'skipped')),
  notify_error TEXT
);

CREATE INDEX orders_created_at ON orders(created_at);

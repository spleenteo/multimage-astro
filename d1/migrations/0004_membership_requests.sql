-- Membership requests from the site (/api/socio). The site only writes; the table is a contract with the staff app: see d1/README.md.
CREATE TABLE membership_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  birth_date TEXT,
  birth_place TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  region TEXT,
  postcode TEXT,
  country TEXT,
  fee_id TEXT NOT NULL,
  fee_label TEXT NOT NULL,
  fee_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bonifico', 'paypal')),
  areas_json TEXT NOT NULL CHECK (json_valid(areas_json)),
  areas_other TEXT,
  consent_at TEXT NOT NULL,
  notify_status TEXT NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending', 'sent', 'failed', 'skipped')),
  notify_error TEXT
);

CREATE INDEX membership_requests_created_at ON membership_requests(created_at);

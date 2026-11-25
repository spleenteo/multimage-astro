-- Membership sign-up no longer asks for the payment method or the collaboration areas; both move to the confirmation page (V4).
-- SQLite cannot drop a CHECK or a NOT NULL in place, so the table is rebuilt: payment_method becomes nullable (still limited to bonifico or paypal when set),
-- collaboration_at records the one allowed collaboration update of a request, and collab_token_hash holds the SHA-256 hex of the secret token returned only to the submitter.
CREATE TABLE membership_requests_new (
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
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('bonifico', 'paypal')),
  areas_json TEXT NOT NULL CHECK (json_valid(areas_json)),
  areas_other TEXT,
  collaboration_at TEXT,
  collab_token_hash TEXT,
  consent_at TEXT NOT NULL,
  notify_status TEXT NOT NULL DEFAULT 'pending' CHECK (notify_status IN ('pending', 'sent', 'failed', 'skipped')),
  notify_error TEXT
);

INSERT INTO membership_requests_new (id, code, created_at, email, first_name, last_name, birth_date, birth_place, address1, address2, city, region, postcode, country, fee_id, fee_label, fee_cents, payment_method, areas_json, areas_other, consent_at, notify_status, notify_error)
SELECT id, code, created_at, email, first_name, last_name, birth_date, birth_place, address1, address2, city, region, postcode, country, fee_id, fee_label, fee_cents, payment_method, areas_json, areas_other, consent_at, notify_status, notify_error FROM membership_requests;

DROP TABLE membership_requests;

ALTER TABLE membership_requests_new RENAME TO membership_requests;

CREATE INDEX membership_requests_created_at ON membership_requests(created_at);

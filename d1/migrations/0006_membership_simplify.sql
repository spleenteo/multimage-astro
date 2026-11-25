-- Membership sign-up is one send: one request, one row, one email (V5). The collaboration step, its token and the second email are gone.
-- Dropped columns: fee_id, payment_method, areas_json, collaboration_at, collab_token_hash, consent_at, notify_status, notify_error (mail failures stay in the Worker logs).
-- The areas become plain text: areas_json's labels joined by ", " in array order (NULL when none), so a row reads at a glance.
-- SQLite cannot drop several columns and a CHECK in place, so the table is rebuilt and the existing rows are copied.
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
  fee_label TEXT NOT NULL,
  fee_cents INTEGER NOT NULL,
  areas TEXT,
  areas_other TEXT
);

INSERT INTO membership_requests_new (id, code, created_at, email, first_name, last_name, birth_date, birth_place, address1, address2, city, region, postcode, country, fee_label, fee_cents, areas, areas_other)
SELECT m.id, m.code, m.created_at, m.email, m.first_name, m.last_name, m.birth_date, m.birth_place, m.address1, m.address2, m.city, m.region, m.postcode, m.country, m.fee_label, m.fee_cents,
  (SELECT group_concat(json_extract(j.value, '$.label'), ', ') FROM json_each(m.areas_json) AS j),
  m.areas_other
FROM membership_requests AS m;

DROP TABLE membership_requests;

ALTER TABLE membership_requests_new RENAME TO membership_requests;

CREATE INDEX membership_requests_created_at ON membership_requests(created_at);

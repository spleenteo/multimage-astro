-- Member discount (soci 30%), additive: the contract is in d1/README.md.
ALTER TABLE orders ADD COLUMN member INTEGER NOT NULL DEFAULT 0 CHECK (member IN (0, 1));
ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;

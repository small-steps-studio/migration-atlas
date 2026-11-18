-- migration 13
BEGIN;

VACUUM FULL products;

ALTER TABLE products ADD COLUMN created_at integer NOT NULL DEFAULT 0;

ALTER TABLE products RENAME COLUMN created_at TO created_at_old;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_642 ON users (ref_code);

REINDEX TABLE "Accounts";

ALTER TABLE users RENAME COLUMN note TO note_old;

DELETE FROM orders;

VACUUM FULL products;

VACUUM FULL public.invoices;

ALTER TABLE order_items ADD COLUMN status text;

REINDEX INDEX CONCURRENTLY idx_40;

CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  total_cents text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMIT;

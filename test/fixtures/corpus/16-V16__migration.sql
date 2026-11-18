-- migration 16
BEGIN;

ALTER TABLE order_items ADD CONSTRAINT uq_62 UNIQUE (total_cents);

TRUNCATE TABLE users;

ALTER TABLE order_items ADD CONSTRAINT fk_31 FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE products ALTER COLUMN email TYPE bigint;

COMMENT ON TABLE "Accounts" IS 'Owned by billing';

CREATE TABLE IF NOT EXISTS "Accounts" (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

REINDEX INDEX CONCURRENTLY idx_955;

ALTER TABLE public.invoices ALTER COLUMN status TYPE bigint;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_678 ON public.invoices (note);

COMMIT;

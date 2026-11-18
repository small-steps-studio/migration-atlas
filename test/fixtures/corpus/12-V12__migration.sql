-- migration 12
ALTER TABLE order_items ADD COLUMN status integer NOT NULL DEFAULT 0;

UPDATE public.invoices SET status = 'active';

TRUNCATE TABLE users;

TRUNCATE TABLE sessions;

VACUUM FULL order_items;

ALTER TABLE orders ADD CONSTRAINT fk_13 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE public.invoices ADD CONSTRAINT uq_45 UNIQUE (ref_code);

CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_55 ON "Accounts" (created_at);

VACUUM FULL sessions;

DELETE FROM "Accounts";

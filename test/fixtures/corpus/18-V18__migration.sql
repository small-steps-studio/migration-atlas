-- migration 18
ALTER TABLE order_items DROP COLUMN IF EXISTS "DisplayName";

ALTER TABLE sessions ADD CONSTRAINT fk_58 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

VACUUM FULL orders;

UPDATE public.invoices SET status = 'active' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ALTER COLUMN total_cents TYPE bigint;

ALTER TABLE "Accounts" ADD CONSTRAINT fk_30 FOREIGN KEY (user_id) REFERENCES users (id);

CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

UPDATE order_items SET status = 'active';

REINDEX TABLE order_items;

ALTER TABLE audit_log ADD CONSTRAINT uq_87 UNIQUE (total_cents);

UPDATE order_items SET status = 'active';

CREATE INDEX idx_801 ON orders (ref_code);

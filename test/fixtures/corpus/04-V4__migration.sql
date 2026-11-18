-- migration 4
BEGIN;

DELETE FROM products WHERE created_at < now() - interval '90 days';

CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ADD COLUMN created_at text;

ALTER TABLE order_items ADD CONSTRAINT fk_79 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE public.invoices ADD CONSTRAINT fk_90 FOREIGN KEY (user_id) REFERENCES users (id);

VACUUM FULL products;

REINDEX INDEX CONCURRENTLY idx_983;

DROP TABLE IF EXISTS sessions;

COMMIT;

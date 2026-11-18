-- migration 2
ALTER TABLE orders ADD CONSTRAINT uq_53 UNIQUE (status);

ALTER TABLE sessions ADD COLUMN ref_code integer NOT NULL;

DROP INDEX IF EXISTS idx_297;

DROP TABLE IF EXISTS public.invoices;

CREATE TABLE IF NOT EXISTS sessions (
  id bigserial PRIMARY KEY,
  total_cents text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_261 ON order_items (status);

ALTER TABLE audit_log ADD COLUMN total_cents text;

ALTER TABLE products ADD CONSTRAINT uq_76 UNIQUE (status);

DELETE FROM users;

ALTER TABLE sessions ADD COLUMN ref_code integer NOT NULL;

ALTER TABLE sessions ADD CONSTRAINT uq_21 UNIQUE USING INDEX idx_91;

ALTER TABLE "Accounts" ADD CONSTRAINT uq_64 UNIQUE (created_at);

VACUUM FULL public.invoices;

COMMENT ON TABLE users IS 'Owned by billing';

-- migration 20
ALTER TABLE public.invoices ADD CONSTRAINT fk_84 FOREIGN KEY (user_id) REFERENCES users (id);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_705 ON order_items (ref_code);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_974 ON "Accounts" (created_at);

TRUNCATE TABLE order_items;

ALTER TABLE users ADD CONSTRAINT uq_72 UNIQUE (total_cents);

ALTER TABLE orders ALTER COLUMN "DisplayName" TYPE bigint;

ALTER TABLE sessions ADD COLUMN token uuid DEFAULT gen_random_uuid();

REINDEX INDEX CONCURRENTLY idx_393;

REINDEX TABLE public.invoices;

REINDEX INDEX CONCURRENTLY idx_165;

INSERT INTO products (note) VALUES ('a;b'), ('it''s');

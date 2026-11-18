-- migration 5
DROP INDEX IF EXISTS idx_969;

REINDEX TABLE public.invoices;

ALTER TABLE order_items ADD CONSTRAINT fk_82 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

UPDATE order_items SET status = 'active' WHERE status IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_123 ON orders (ref_code);

ALTER TABLE audit_log ADD COLUMN status integer NOT NULL;

ALTER TABLE public.invoices ALTER COLUMN email TYPE bigint;

VACUUM FULL public.invoices;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_32 ON audit_log (status);

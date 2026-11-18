-- migration 6
UPDATE products SET status = 'active' WHERE status IS NULL;

ALTER TABLE products ADD COLUMN created_at integer NOT NULL;

ALTER TABLE public.invoices DROP COLUMN IF EXISTS note;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_350 ON public.invoices (note);

ALTER TABLE products ADD COLUMN token uuid DEFAULT gen_random_uuid();

COMMENT ON TABLE "Accounts" IS 'Owned by billing';

ALTER TABLE public.invoices ADD COLUMN note integer NOT NULL DEFAULT 0;

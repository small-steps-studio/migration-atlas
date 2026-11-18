-- migration 23
ALTER TABLE products RENAME COLUMN created_at TO created_at_old;

UPDATE public.invoices SET status = 'active';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_449 ON public.invoices (email);

INSERT INTO orders (email) VALUES ('a;b'), ('it''s');

ALTER TABLE "Accounts" RENAME COLUMN "DisplayName" TO DisplayName_old;

DROP INDEX IF EXISTS idx_331;

DELETE FROM products;

CREATE INDEX idx_504 ON products (total_cents);

CREATE INDEX idx_182 ON order_items (status);

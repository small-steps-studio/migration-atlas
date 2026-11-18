-- migration 22
BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

DELETE FROM products;

ALTER TABLE users ADD COLUMN token uuid DEFAULT gen_random_uuid();

ALTER TABLE "Accounts" ALTER COLUMN "DisplayName" SET NOT NULL;

ALTER TABLE order_items ADD CONSTRAINT fk_82 FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE public.invoices RENAME COLUMN created_at TO created_at_old;

COMMIT;

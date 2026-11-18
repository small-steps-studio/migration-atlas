-- migration 14
CREATE TABLE IF NOT EXISTS "Accounts" (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products RENAME COLUMN "DisplayName" TO DisplayName_old;

ALTER TABLE order_items RENAME COLUMN status TO status_old;

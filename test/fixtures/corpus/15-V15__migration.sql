-- migration 15
ALTER TABLE "Accounts" ALTER COLUMN note TYPE bigint;

CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ADD CONSTRAINT fk_53 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

VACUUM FULL order_items;

ALTER TABLE products ADD CONSTRAINT fk_25 FOREIGN KEY (user_id) REFERENCES users (id);

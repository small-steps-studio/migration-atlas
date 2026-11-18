-- migration 9
ALTER TABLE "Accounts" ALTER COLUMN created_at TYPE bigint;

ALTER TABLE order_items ADD CONSTRAINT fk_35 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE users ADD COLUMN total_cents integer NOT NULL DEFAULT 0;

VACUUM FULL sessions;

CREATE TABLE IF NOT EXISTS sessions (
  id bigserial PRIMARY KEY,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- migration 10
BEGIN;

ALTER TABLE sessions ADD CONSTRAINT uq_25 UNIQUE USING INDEX idx_36;

ALTER TABLE audit_log ALTER COLUMN total_cents TYPE bigint;

TRUNCATE TABLE audit_log;

CREATE TABLE IF NOT EXISTS sessions (
  id bigserial PRIMARY KEY,
  total_cents text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ALTER COLUMN email SET NOT NULL;

ALTER TABLE sessions ADD CONSTRAINT fk_2 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

DELETE FROM users WHERE created_at < now() - interval '90 days';

INSERT INTO orders ("DisplayName") VALUES ('a;b'), ('it''s');

DELETE FROM public.invoices WHERE created_at < now() - interval '90 days';

ALTER TABLE orders ALTER COLUMN total_cents SET NOT NULL;

COMMIT;

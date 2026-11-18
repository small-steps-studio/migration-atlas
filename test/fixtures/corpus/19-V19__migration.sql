-- migration 19
BEGIN;

REINDEX TABLE audit_log;

INSERT INTO "Accounts" (note) VALUES ('a;b'), ('it''s');

ALTER TABLE sessions ADD COLUMN token uuid DEFAULT gen_random_uuid();

INSERT INTO audit_log ("DisplayName") VALUES ('a;b'), ('it''s');

CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  total_cents text NOT NULL,
  created_at timestamptz DEFAULT now()
);

DELETE FROM audit_log WHERE created_at < now() - interval '90 days';

COMMIT;

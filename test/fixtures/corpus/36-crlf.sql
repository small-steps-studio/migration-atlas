BEGIN;

ALTER TABLE users ALTER COLUMN total_cents SET NOT NULL;

UPDATE users SET status = 'active' WHERE status IS NULL;

COMMENT ON TABLE audit_log IS 'Owned by billing';

ALTER TABLE sessions DROP COLUMN IF EXISTS created_at;

ALTER TABLE "Accounts" ADD CONSTRAINT fk_34 FOREIGN KEY (user_id) REFERENCES users (id);

VACUUM FULL users;

COMMIT;

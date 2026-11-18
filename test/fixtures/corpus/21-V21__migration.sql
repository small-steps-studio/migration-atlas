-- migration 21
ALTER TABLE orders ADD COLUMN "DisplayName" text;

UPDATE audit_log SET status = 'active' WHERE status IS NULL;

TRUNCATE TABLE sessions;

ALTER TABLE sessions ADD COLUMN note integer NOT NULL DEFAULT 0;

ALTER TABLE "Accounts" ADD CONSTRAINT fk_33 FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE audit_log ALTER COLUMN email TYPE bigint;

VACUUM FULL users;

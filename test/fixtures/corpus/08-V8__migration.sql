-- migration 8
DROP INDEX IF EXISTS idx_454;

UPDATE orders SET status = 'active' WHERE status IS NULL;

TRUNCATE TABLE orders;

ALTER TABLE orders ADD CONSTRAINT uq_36 UNIQUE USING INDEX idx_36;

ALTER TABLE audit_log DROP COLUMN IF EXISTS status;

ALTER TABLE sessions ADD COLUMN token uuid DEFAULT gen_random_uuid();

DELETE FROM users WHERE created_at < now() - interval '90 days';

CREATE INDEX idx_184 ON order_items (email);

ALTER TABLE orders ADD COLUMN note text;

ALTER TABLE orders ADD COLUMN email integer NOT NULL;

INSERT INTO sessions (note) VALUES ('a;b'), ('it''s');

DROP TABLE IF EXISTS audit_log;

-- migration 17
UPDATE public.invoices SET status = 'active' WHERE status IS NULL;

UPDATE users SET status = 'active';

ALTER TABLE audit_log ADD COLUMN status integer NOT NULL DEFAULT 0;

ALTER TABLE products ADD COLUMN token uuid DEFAULT gen_random_uuid();

ALTER TABLE order_items ALTER COLUMN note SET NOT NULL;

INSERT INTO orders (created_at) VALUES ('a;b'), ('it''s');

ALTER TABLE users ADD CONSTRAINT fk_60 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE sessions ADD COLUMN status integer NOT NULL DEFAULT 0;

ALTER TABLE order_items ADD COLUMN created_at integer NOT NULL DEFAULT 0;

ALTER TABLE users ADD CONSTRAINT uq_57 UNIQUE USING INDEX idx_53;

CREATE INDEX idx_290 ON products (email);

DELETE FROM audit_log;

-- migration 25
BEGIN;

ALTER TABLE order_items ADD COLUMN token uuid DEFAULT gen_random_uuid();

UPDATE orders SET status = 'active';

TRUNCATE TABLE sessions;

COMMENT ON TABLE order_items IS 'Owned by billing';

REINDEX INDEX CONCURRENTLY idx_835;

COMMIT;

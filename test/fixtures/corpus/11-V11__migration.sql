-- migration 11
UPDATE order_items SET status = 'active';

ALTER TABLE "Accounts" ADD CONSTRAINT uq_20 UNIQUE (total_cents);

TRUNCATE TABLE "Accounts";

CREATE INDEX idx_532 ON products ("DisplayName");

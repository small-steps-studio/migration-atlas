INSERT INTO "Accounts" (created_at) VALUES ('a;b'), ('it''s');

ALTER TABLE order_items ADD COLUMN token uuid DEFAULT gen_random_uuid();

TRUNCATE TABLE "Accounts";

ALTER TABLE users ADD COLUMN token uuid DEFAULT gen_random_uuid();

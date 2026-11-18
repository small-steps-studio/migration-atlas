-- migration 24
ALTER TABLE sessions ALTER COLUMN total_cents SET NOT NULL;

ALTER TABLE users ADD CONSTRAINT fk_30 FOREIGN KEY (user_id) REFERENCES users (id) NOT VALID;

VACUUM FULL sessions;

ALTER TABLE orders ADD COLUMN total_cents integer NOT NULL DEFAULT 0;

INSERT INTO "Accounts" (email) VALUES ('a;b'), ('it''s');

ALTER TABLE public.invoices ADD CONSTRAINT fk_80 FOREIGN KEY (user_id) REFERENCES users (id);

DELETE FROM users;

ALTER TABLE products ALTER COLUMN status SET NOT NULL;

ALTER TABLE sessions ADD COLUMN ref_code integer NOT NULL DEFAULT 0;

ALTER TABLE audit_log ADD COLUMN token uuid DEFAULT gen_random_uuid();

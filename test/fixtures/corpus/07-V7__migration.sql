-- migration 7
BEGIN;

ALTER TABLE public.invoices ADD COLUMN email integer NOT NULL;

ALTER TABLE sessions ADD CONSTRAINT uq_37 UNIQUE USING INDEX idx_22;

ALTER TABLE users ALTER COLUMN created_at TYPE bigint;

ALTER TABLE products ADD COLUMN ref_code integer NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN note text;

ALTER TABLE orders ADD CONSTRAINT uq_6 UNIQUE (note);

ALTER TABLE orders ADD CONSTRAINT uq_43 UNIQUE (email);

COMMIT;

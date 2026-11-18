-- migration 1
BEGIN;

COMMENT ON TABLE "Accounts" IS 'Owned by billing';

ALTER TABLE sessions DROP COLUMN IF EXISTS "DisplayName";

DROP INDEX IF EXISTS idx_802;

COMMIT;

DO $body$
BEGIN
  PERFORM 1; -- ; inside
END
$body$;
ALTER TABLE orders ADD COLUMN note text;

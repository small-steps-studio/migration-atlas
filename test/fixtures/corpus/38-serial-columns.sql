ALTER TABLE orders ADD COLUMN seq SERIAL;
ALTER TABLE orders ADD COLUMN big BIGSERIAL;
ALTER TABLE orders ADD COLUMN n bigint DEFAULT nextval('s');
ALTER TABLE orders ADD COLUMN at timestamptz DEFAULT clock_timestamp();

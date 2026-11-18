'use strict';
// Contract tests: written from the specification examples. Do not edit; fix src/core.js instead.
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core');

const plain = (v) => JSON.parse(JSON.stringify(v === undefined ? null : v));

test('core exports every specified function', () => {
  for (const n of ["splitStatements", "statementType", "tableOf", "alterActions", "reportStatements", "reportDestructive", "reportTables", "reportLockRisk", "reportRollback"]) assert.equal(typeof core[n], 'function', n);
});

test("splitStatements example 1", () => {
  assert.deepStrictEqual(plain(core.splitStatements("-- head\nCREATE TABLE t (\n  a text DEFAULT 'x; y' -- c\n);\n/* note */ INSERT INTO t VALUES ('it''s');\nSELECT $$a;b$$")), [{"sql": "CREATE TABLE t ( a text DEFAULT 'x; y' )", "line": 2}, {"sql": "INSERT INTO t VALUES ('it''s')", "line": 5}, {"sql": "SELECT $$a;b$$", "line": 6}]);
});

test("splitStatements example 2", () => {
  assert.deepStrictEqual(plain(core.splitStatements("  \n-- only a comment\n")), []);
});

test("statementType example 1", () => {
  assert.deepStrictEqual(plain(core.statementType("create unique index i on t (a)")), "CREATE INDEX");
});

test("statementType example 2", () => {
  assert.deepStrictEqual(plain(core.statementType("START TRANSACTION")), "BEGIN");
});

test("statementType example 3", () => {
  assert.deepStrictEqual(plain(core.statementType("drop view if exists v")), "DROP VIEW");
});

test("statementType example 4", () => {
  assert.deepStrictEqual(plain(core.statementType("GRANT SELECT ON t TO r")), "GRANT");
});

test("tableOf example 1", () => {
  assert.deepStrictEqual(plain(core.tableOf("ALTER TABLE IF EXISTS ONLY \"Public\".\"Users\" ADD COLUMN a int")), "Public.Users");
});

test("tableOf example 2", () => {
  assert.deepStrictEqual(plain(core.tableOf("CREATE INDEX CONCURRENTLY IF NOT EXISTS i ON orders (a)")), "orders");
});

test("tableOf example 3", () => {
  assert.deepStrictEqual(plain(core.tableOf("CREATE INDEX ON orders (a)")), "orders");
});

test("tableOf example 4", () => {
  assert.deepStrictEqual(plain(core.tableOf("SELECT 1")), "");
});

test("tableOf example 5", () => {
  assert.deepStrictEqual(plain(core.tableOf("ALTER TABLE `shop`.`orders` ADD COLUMN note TEXT")), "shop.orders");
});

test("alterActions example 1", () => {
  assert.deepStrictEqual(plain(core.alterActions("ALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname")), ["ADD COLUMN age int", "DROP COLUMN nickname"]);
});

test("alterActions example 2", () => {
  assert.deepStrictEqual(plain(core.alterActions("ALTER TABLE t ADD CONSTRAINT c CHECK (a IN (1, 2)), ALTER COLUMN b SET NOT NULL")), ["ADD CONSTRAINT c CHECK (a IN (1, 2))", "ALTER COLUMN b SET NOT NULL"]);
});

test("alterActions example 3", () => {
  assert.deepStrictEqual(plain(core.alterActions("DROP TABLE t")), []);
});

test("reportStatements example 1", () => {
  const md = core.reportStatements("-- V3__orders.sql\nBEGIN;\nCREATE TABLE orders (\n  id bigserial PRIMARY KEY,\n  user_id bigint NOT NULL,\n  note text DEFAULT 'a; b'\n);\nALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname;\nCREATE INDEX idx_orders_user ON orders (user_id);\nALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);\nUPDATE users SET age = 0;\nDELETE FROM sessions WHERE expires_at < now();\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\nALTER TABLE users RENAME COLUMN name TO full_name;\nDROP TABLE legacy_users;\nCREATE INDEX CONCURRENTLY idx_users_email ON users (email);\nCOMMIT;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Migration Summary", "12 statements touching 4 tables.", "Runs inside a transaction (BEGIN on line 2, COMMIT on line 17).", "| ALTER TABLE | 4 |", "| CREATE INDEX | 2 |", "| BEGIN | 1 |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportStatements example 2", () => {
  const md = core.reportStatements("-- nothing here\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Migration Summary", "The file contains no SQL statements."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportDestructive example 1", () => {
  const md = core.reportDestructive("-- V3__orders.sql\nBEGIN;\nCREATE TABLE orders (\n  id bigserial PRIMARY KEY,\n  user_id bigint NOT NULL,\n  note text DEFAULT 'a; b'\n);\nALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname;\nCREATE INDEX idx_orders_user ON orders (user_id);\nALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);\nUPDATE users SET age = 0;\nDELETE FROM sessions WHERE expires_at < now();\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\nALTER TABLE users RENAME COLUMN name TO full_name;\nDROP TABLE legacy_users;\nCREATE INDEX CONCURRENTLY idx_users_email ON users (email);\nCOMMIT;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Destructive Operations", "3 destructive operations.", "| 8 | DROP COLUMN | users.nickname |", "| 11 | UPDATE without WHERE | users |", "| 15 | DROP TABLE | legacy\\_users |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportDestructive example 2", () => {
  const md = core.reportDestructive("-- nothing here\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Destructive Operations", "The file contains no SQL statements."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportTables example 1", () => {
  const md = core.reportTables("-- V3__orders.sql\nBEGIN;\nCREATE TABLE orders (\n  id bigserial PRIMARY KEY,\n  user_id bigint NOT NULL,\n  note text DEFAULT 'a; b'\n);\nALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname;\nCREATE INDEX idx_orders_user ON orders (user_id);\nALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);\nUPDATE users SET age = 0;\nDELETE FROM sessions WHERE expires_at < now();\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\nALTER TABLE users RENAME COLUMN name TO full_name;\nDROP TABLE legacy_users;\nCREATE INDEX CONCURRENTLY idx_users_email ON users (email);\nCOMMIT;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Tables", "| users | 5 | 8, 11, 13, 14, 16 |", "| orders | 3 | 3, 9, 10 |", "| legacy\\_users | 1 | 15 |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportTables example 2", () => {
  const md = core.reportTables("-- nothing here\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Tables", "The file contains no SQL statements."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportLockRisk example 1", () => {
  const md = core.reportLockRisk("-- V3__orders.sql\nBEGIN;\nCREATE TABLE orders (\n  id bigserial PRIMARY KEY,\n  user_id bigint NOT NULL,\n  note text DEFAULT 'a; b'\n);\nALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname;\nCREATE INDEX idx_orders_user ON orders (user_id);\nALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);\nUPDATE users SET age = 0;\nDELETE FROM sessions WHERE expires_at < now();\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\nALTER TABLE users RENAME COLUMN name TO full_name;\nDROP TABLE legacy_users;\nCREATE INDEX CONCURRENTLY idx_users_email ON users (email);\nCOMMIT;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# PostgreSQL Lock Risks", "3 findings.", "| 13 | users | not_null | SET NOT NULL scans the table under an ACCESS EXCLUSIVE lock |", "| 14 | users | rename | rename breaks code that still uses the old name |", "| 16 | users | concurrently | CONCURRENTLY cannot run inside a transaction block |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportLockRisk example 2", () => {
  const md = core.reportLockRisk("CREATE INDEX i ON accounts (email);\nALTER TABLE accounts ADD COLUMN plan text NOT NULL, ALTER COLUMN id TYPE bigint;");
  assert.equal(typeof md, 'string');
  for (const s of ["3 findings.", "| 1 | accounts | index | index build blocks writes; use CREATE INDEX CONCURRENTLY |", "| 2 | accounts | add_not_null | NOT NULL column without DEFAULT fails on a non-empty table |", "| 2 | accounts | type | type change rewrites the table under an ACCESS EXCLUSIVE lock |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportLockRisk example 3", () => {
  const md = core.reportLockRisk("-- nothing here\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# PostgreSQL Lock Risks", "The file contains no SQL statements."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportLockRisk example 4", () => {
  const md = core.reportLockRisk("ALTER TABLE accounts ADD CONSTRAINT accounts_email_key UNIQUE (email);\nALTER TABLE accounts ADD COLUMN token uuid DEFAULT gen_random_uuid();\nALTER TABLE accounts ADD COLUMN seq BIGSERIAL;\nVACUUM FULL accounts;\nREINDEX TABLE accounts;\nALTER TABLE accounts ADD COLUMN created_at timestamptz DEFAULT now() NOT NULL;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["5 findings.", "| 1 | accounts | unique_constraint |", "| 2 | accounts | volatile_default |", "| 3 | accounts | volatile_default |", "| 4 | accounts | rewrite | VACUUM FULL rewrites the table under an ACCESS EXCLUSIVE lock |", "| 5 | accounts | rewrite | REINDEX without CONCURRENTLY blocks writes; use REINDEX CONCURRENTLY (PostgreSQL 12 and later) |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportRollback example 1", () => {
  const md = core.reportRollback("-- V3__orders.sql\nBEGIN;\nCREATE TABLE orders (\n  id bigserial PRIMARY KEY,\n  user_id bigint NOT NULL,\n  note text DEFAULT 'a; b'\n);\nALTER TABLE users ADD COLUMN age int, DROP COLUMN nickname;\nCREATE INDEX idx_orders_user ON orders (user_id);\nALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);\nUPDATE users SET age = 0;\nDELETE FROM sessions WHERE expires_at < now();\nALTER TABLE users ALTER COLUMN email SET NOT NULL;\nALTER TABLE users RENAME COLUMN name TO full_name;\nDROP TABLE legacy_users;\nCREATE INDEX CONCURRENTLY idx_users_email ON users (email);\nCOMMIT;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Rollback Plan", "## Down migration", "```sql\nDROP INDEX idx_users_email;\nALTER TABLE users RENAME COLUMN full_name TO name;\nALTER TABLE users ALTER COLUMN email DROP NOT NULL;\nALTER TABLE orders DROP CONSTRAINT fk_user;\nDROP INDEX idx_orders_user;\nALTER TABLE users DROP COLUMN age;\nDROP TABLE orders;\n```", "## Not reversible", "| 15 | DROP TABLE legacy\\_users | objects or data are removed; restore from a backup |", "| 11 | UPDATE users | data change cannot be reversed automatically |", "| 8 | DROP COLUMN users.nickname | objects or data are removed; restore from a backup |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportRollback example 2", () => {
  const md = core.reportRollback("-- nothing here\n");
  assert.equal(typeof md, 'string');
  for (const s of ["# Rollback Plan", "The file contains no SQL statements."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportRollback example 3", () => {
  const md = core.reportRollback("ALTER TABLE \"Accounts\" RENAME COLUMN \"DisplayName\" TO \"Name\";\nALTER TABLE public.users RENAME TO members;\n");
  assert.equal(typeof md, 'string');
  for (const s of ["ALTER TABLE public.members RENAME TO users;", "ALTER TABLE \"Accounts\" RENAME COLUMN \"Name\" TO \"DisplayName\";"]) assert.ok(md.includes(s), 'missing: ' + s);
});

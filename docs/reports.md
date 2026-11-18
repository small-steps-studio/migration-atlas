# Reports

Every report reads the text of the active editor and opens its result as a new Markdown document. Your file is never changed and nothing is sent anywhere. The examples below come from the sample file (Open Sample File).

## Show Summary

Command: **Migration Atlas: Show Summary**

Counts the statements of the file by kind (CREATE TABLE, ALTER TABLE, CREATE INDEX, INSERT, UPDATE and so on) and the distinct tables they touch, and says whether the migration runs inside a transaction, with the lines of BEGIN and COMMIT.

Example (sample file):

> # Migration Summary
>
> 14 statements touching 5 tables.
>
> Runs inside a transaction (BEGIN on line 2, COMMIT on line 27).
>
> | Statement | Count |
> | --- | ---: |
> | ALTER TABLE | 6 |
> | CREATE INDEX | 2 |
> | BEGIN | 1 |
> | COMMIT | 1 |
> | CREATE TABLE | 1 |
> | DELETE | 1 |
> | DROP TABLE | 1 |
> | UPDATE | 1 |

## Show Destructive Operations

Command: **Migration Atlas: Show Destructive Operations**

Lists every operation that removes objects or data: DROP statements, TRUNCATE, DELETE and UPDATE without a WHERE clause, and the DROP COLUMN and DROP CONSTRAINT actions of ALTER TABLE, each with its line and target.

Example (sample file):

> # Destructive Operations
>
> 2 destructive operations.
>
> | Line | Operation | Target |
> | ---: | --- | --- |
> | 23 | UPDATE without WHERE | orders |
> | 25 | DROP TABLE | legacy\_coupons |

## Show Tables

Command: **Migration Atlas: Show Tables**

Lists every table the statements touch, with how many statements touch it and on which lines, the busiest tables first. Schema-qualified names are kept whole.

Example (sample file):

> # Tables
>
> | Table | Statements | Lines |
> | --- | ---: | --- |
> | orders | 5 | 13, 14, 15, 21, 23 |
> | accounts | 3 | 17, 18, 19 |
> | order\_notes | 2 | 4, 11 |
> | legacy\_coupons | 1 | 25 |
> | sessions | 1 | 24 |

## Show PostgreSQL Lock Risks (Pro)

Command: **Migration Atlas: Show PostgreSQL Lock Risks** (Pro; part of the 14-day trial)

Checks each statement against PostgreSQL locking rules and lists the risky ones with their line, table, rule and the safer alternative: indexes built without CONCURRENTLY, CONCURRENTLY inside a transaction, constraints validated under lock, unique and primary key constraints that build their index under lock, SET NOT NULL, type changes, volatile defaults and serial columns, NOT NULL columns without a default, renames, and VACUUM FULL, CLUSTER and REINDEX without CONCURRENTLY. Tables created earlier in the same file are skipped, because they are still empty.

Example (sample file):

> # PostgreSQL Lock Risks
>
> 6 findings.
>
> | Line | Table | Rule | Risk |
> | ---: | --- | --- | --- |
> | 14 | orders | add_not_null | NOT NULL column without DEFAULT fails on a non-empty table |
> | 15 | orders | type | type change rewrites the table under an ACCESS EXCLUSIVE lock |
> | 17 | accounts | unique_constraint | building the index for this constraint blocks reads and writes; create a unique index CONCURRENTLY and add the constraint USING INDEX |
> | 18 | accounts | constraint | constraint is validated under lock; add it NOT VALID and VALIDATE it separately |
> | 19 | accounts | rename | rename breaks code that still uses the old name |
> | 21 | orders | index | index build blocks writes; use CREATE INDEX CONCURRENTLY |

## Show Rollback Plan (Pro)

Command: **Migration Atlas: Show Rollback Plan** (Pro; part of the 14-day trial)

Walks the migration backwards and writes a down migration in PostgreSQL syntax for every statement that can be reversed automatically (created tables, indexes, columns and constraints, renames, SET NOT NULL), with names quoted where PostgreSQL needs it. Statements that cannot be reversed, such as dropped tables, deleted rows or data updates, are listed with the reason.

Example (sample file):

> # Rollback Plan
>
> ## Down migration
>
> ```sql
> DROP INDEX idx_orders_status;
> ALTER TABLE accounts RENAME COLUMN display_name TO name;
> ALTER TABLE accounts DROP CONSTRAINT accounts_plan_fk;
> ALTER TABLE accounts DROP CONSTRAINT accounts_email_key;
> ALTER TABLE orders DROP COLUMN priority;
> ALTER TABLE orders DROP COLUMN gift_message;
> DROP INDEX idx_order_notes_order;
> DROP TABLE order_notes;
> ```
>
> ## Not reversible
>
> | Line | Statement | Reason |
> | ---: | --- | --- |
> | 25 | DROP TABLE legacy\_coupons | objects or data are removed; restore from a backup |
> | 24 | DELETE FROM sessions | objects or data are removed; restore from a backup |
> | 23 | UPDATE orders | data change cannot be reversed automatically |
> | 15 | ALTER TABLE orders | no automatic reverse |

ALTER TABLE users RENAME TO members;
ALTER TABLE members RENAME COLUMN name TO full_name;
ALTER TABLE "Accounts" RENAME COLUMN "DisplayName" TO "Name";

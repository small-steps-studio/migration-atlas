'use strict';
// Hostile and odd SQL for the adversarial test (invented; the payloads must come out as plain escaped text).
const PAY = ['x|y', '<b>y</b>', '[link](https://evil.test)', '![t](https://evil.test/p.png)', '<img src=https://evil.test/i.png>', '*b*', '_i_', '<script>alert(1)</script>', '$x$', 'www.evil.test', '# h'];
const cases = [];
PAY.forEach((p, i) => {
  const q = '"' + p.replace(/"/g, '') + '"';
  cases.push({ name: 'payload ' + i, text: 'CREATE TABLE ' + q + ' (id int);\nALTER TABLE ' + q + ' ADD COLUMN ' + q + ' int NOT NULL, DROP COLUMN ' + q + ', RENAME COLUMN ' + q + ' TO ' + q + ';\nDROP TABLE ' + q + ';\nDELETE FROM ' + q + ';\nCREATE INDEX ' + q + ' ON ' + q + ' (a);\nVACUUM FULL ' + q + ';\n' + p + ';\n' });
});
cases.push({ name: 'prototype names', text: 'CREATE TABLE constructor (id int);\nALTER TABLE __proto__ ADD COLUMN toString int;\nDROP TABLE hasOwnProperty;\nUPDATE valueOf SET a = 1;\n' });
cases.push({ name: 'unclosed quote', text: "INSERT INTO t VALUES ('never closed;\nDROP TABLE x;\n" });
cases.push({ name: 'unclosed dollar', text: 'DO $$ BEGIN PERFORM 1;\nDROP TABLE y;\n' });
cases.push({ name: 'unclosed comment', text: 'ALTER TABLE t ADD COLUMN a int; /* never closed\nDROP TABLE z;' });
cases.push({ name: 'deep parentheses', text: 'ALTER TABLE t ADD CONSTRAINT c CHECK ' + '('.repeat(20000) + 'a > 0' + ')'.repeat(20000) + ';' });
cases.push({ name: 'huge statement', text: 'INSERT INTO t VALUES ' + Array.from({ length: 50000 }, (_, i) => '(' + i + ')').join(',') + ';' });
cases.push({ name: 'only semicolons', text: ';'.repeat(100000) });
module.exports = { cases };

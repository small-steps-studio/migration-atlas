'use strict';
// Migration Atlas core: statement splitting, statement kinds and tables, destructive operations, PostgreSQL lock risks and the rollback plan.
function isWs(c) { const k = c.charCodeAt(0); return k === 32 || (k >= 9 && k <= 13) || k === 160 || k === 0xfeff || (k >= 0x2000 && k <= 0x200a) || k === 0x2028 || k === 0x2029 || k === 0x202f || k === 0x205f || k === 0x3000 || k === 0x1680; }
function splitStatements(text) {
  const s = String(text || ''); const out = []; let cur = '', line = 1, startLine = 0, i = 0;
  const add = (ch) => { if (!startLine && !isWs(ch)) startLine = line; cur += ch; };
  const flush = () => { const t = norm(cur); if (t) out.push({ sql: t, line: startLine }); cur = ''; startLine = 0; };
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === '\n') { line++; cur += ' '; i++; continue; }
    if (c === '-' && n === '-') { while (i < s.length && s[i] !== '\n') i++; cur += ' '; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') line++; i++; } i += 2; cur += ' '; continue; }
    if (c === "'" || c === '"') { add(c); i++; while (i < s.length) { if (s[i] === '\n') line++; cur += s[i]; if (s[i] === c) { if (s[i + 1] === c) { cur += c; i += 2; continue; } i++; break; } i++; } continue; }
    if (c === '$') { const m = /^\$([A-Za-z_]\w*)?\$/.exec(s.slice(i)); if (m) { const tag = m[0]; add('$'); cur += tag.slice(1); i += tag.length; const e = s.indexOf(tag, i); const end = e < 0 ? s.length : e + tag.length; for (let k = i; k < end; k++) { if (s[k] === '\n') line++; cur += s[k]; } i = end; continue; } }
    if (c === ';') { flush(); i++; continue; }
    add(c); i++;
  }
  flush(); return out;
}
function norm(t) { // collapse whitespace outside quotes
  let o = '', q = null;
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { o += c; if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; o += c; continue; } if (isWs(c)) { if (o && o[o.length - 1] !== ' ') o += ' '; continue; } o += c; }
  return o.trim();
}
function statementType(sql) {
  const u = String(sql || '').toUpperCase().trim(); let m;
  if (/^CREATE\s+(GLOBAL\s+|LOCAL\s+)?(TEMP(ORARY)?\s+|UNLOGGED\s+)?TABLE\b/.test(u)) return 'CREATE TABLE';
  if (/^CREATE\s+(UNIQUE\s+)?INDEX\b/.test(u)) return 'CREATE INDEX';
  if (/^CREATE\s+(OR\s+REPLACE\s+)?(MATERIALIZED\s+)?VIEW\b/.test(u)) return 'CREATE VIEW';
  if (/^ALTER\s+TABLE\b/.test(u)) return 'ALTER TABLE';
  if ((m = /^DROP\s+(TABLE|VIEW|INDEX|SCHEMA|SEQUENCE|TYPE|FUNCTION)\b/.exec(u))) return 'DROP ' + m[1];
  if (/^START\s+TRANSACTION\b/.test(u) || /^BEGIN\b/.test(u)) return 'BEGIN';
  for (const k of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'COMMIT', 'ROLLBACK']) if (new RegExp('^' + k + '\\b').test(u)) return k;
  return (u.split(/\s+/)[0] || '');
}
const unq = (n) => String(n || '').replace(/["`]/g, '').replace(/[(,;]$/, '');
const ID = '((?:"[^"]+"|`[^`]+`|[\\w$]+)(?:\\.(?:"[^"]+"|`[^`]+`|[\\w$]+))?)';
// Compiled once (tableOf runs for every statement of the file).
const TABLE_PATS = [
  'CREATE\\s+(?:GLOBAL\\s+|LOCAL\\s+)?(?:TEMP(?:ORARY)?\\s+|UNLOGGED\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?' + ID, 'ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?' + ID,
  'DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?' + ID, 'INSERT\\s+INTO\\s+' + ID, 'UPDATE\\s+(?:ONLY\\s+)?' + ID, 'DELETE\\s+FROM\\s+(?:ONLY\\s+)?' + ID,
  'TRUNCATE\\s+(?:TABLE\\s+)?(?:ONLY\\s+)?' + ID, 'CREATE\\s+(?:UNIQUE\\s+)?INDEX\\b.*?\\bON\\s+(?:ONLY\\s+)?' + ID].map((p) => new RegExp('^\\s*' + p, 'i'));
function tableOf(sql) {
  const s = String(sql || '');
  for (const re of TABLE_PATS) { const m = re.exec(s); if (m) return unq(m[1]); }
  return '';
}
function alterActions(sql) {
  if (statementType(sql) !== 'ALTER TABLE') return [];
  const m = new RegExp('^\\s*ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?' + ID + '\\s*', 'i').exec(sql); if (!m) return [];
  const rest = sql.slice(m[0].length); const out = []; let d = 0, q = null, cur = '';
  for (const c of rest) { if (q) { cur += c; if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; cur += c; continue; } if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; continue; } cur += c; }
  if (cur.trim()) out.push(cur.trim()); return out;
}
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const cell = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]()#+!|<>~&$])/g, '\\$1')
  .split('://').join('\\:\\/\\/').replace(/(^|[^A-Za-z0-9])www\./gi, (m, pre) => pre + m.slice(pre.length, pre.length + 3) + '\\.');
const none = (t) => '# ' + t + '\n\nThe file contains no SQL statements.';
function load(text) { return splitStatements(text).map((x) => Object.assign(x, { type: statementType(x.sql), table: tableOf(x.sql) })); }
function reportStatements(text) {
  const st = load(text); if (!st.length) return none('Migration Summary');
  const tables = new Set(st.map((x) => x.table).filter(Boolean)); const c = {}; st.forEach((x) => { c[x.type] = (c[x.type] || 0) + 1; });
  const b = st.find((x) => x.type === 'BEGIN'); const cm = b && st.find((x) => x.type === 'COMMIT' && x.line > b.line);
  return '# Migration Summary\n\n' + pl(st.length, 'statement') + ' touching ' + pl(tables.size, 'table') + '.\n\n' + (b && cm ? 'Runs inside a transaction (BEGIN on line ' + b.line + ', COMMIT on line ' + cm.line + ').\n\n' : '') +
    '| Statement | Count |\n| --- | ---: |\n' + Object.entries(c).sort((a, b2) => b2[1] - a[1] || (a[0] < b2[0] ? -1 : 1)).map(([k, v]) => '| ' + cell(k) + ' | ' + v + ' |').join('\n');
}
const dropName = (sql) => { const m = new RegExp('^\\s*DROP\\s+\\w+\\s+(?:CONCURRENTLY\\s+)?(?:IF\\s+EXISTS\\s+)?' + ID, 'i').exec(sql); return m ? unq(m[1]) : ''; };
const actCol = (a, re) => { const m = new RegExp(re + '\\s+' + ID, 'i').exec(a); return m ? unq(m[1]) : ''; };
function destructive(st) {
  const ops = [];
  st.forEach((x) => {
    if (/^DROP /.test(x.type)) ops.push([x.line, x.type, dropName(x.sql)]);
    else if (x.type === 'TRUNCATE') ops.push([x.line, 'TRUNCATE', x.table]);
    else if (x.type === 'DELETE' && !/\bWHERE\b/i.test(x.sql)) ops.push([x.line, 'DELETE without WHERE', x.table]);
    else if (x.type === 'UPDATE' && !/\bWHERE\b/i.test(x.sql)) ops.push([x.line, 'UPDATE without WHERE', x.table]);
    else if (x.type === 'ALTER TABLE') alterActions(x.sql).forEach((a) => {
      if (/^DROP\s+CONSTRAINT\b/i.test(a)) ops.push([x.line, 'DROP CONSTRAINT', x.table + '.' + actCol(a, '^DROP\\s+CONSTRAINT(?:\\s+IF\\s+EXISTS)?')]);
      else if (/^DROP\b/i.test(a)) ops.push([x.line, 'DROP COLUMN', x.table + '.' + actCol(a, '^DROP(?:\\s+COLUMN)?(?:\\s+IF\\s+EXISTS)?')]);
    });
  });
  return ops;
}
function reportDestructive(text) {
  const st = load(text); if (!st.length) return none('Destructive Operations'); const ops = destructive(st);
  if (!ops.length) return '# Destructive Operations\n\nNo destructive operations.';
  return '# Destructive Operations\n\n' + pl(ops.length, 'destructive operation') + '.\n\n| Line | Operation | Target |\n| ---: | --- | --- |\n' + ops.map((o) => '| ' + o[0] + ' | ' + o[1] + ' | ' + cell(o[2]) + ' |').join('\n');
}
function reportTables(text) {
  const st = load(text); if (!st.length) return none('Tables'); const m = new Map();   // a Map: table names such as __proto__ are plain keys
  st.filter((x) => x.table).forEach((x) => { if (!m.has(x.table)) m.set(x.table, []); m.get(x.table).push(x.line); });
  const rows = [...m.entries()].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));
  return '# Tables\n\n' + (rows.length ? '| Table | Statements | Lines |\n| --- | ---: | --- |\n' + rows.map(([k, v]) => '| ' + cell(k) + ' | ' + v.length + ' | ' + v.join(', ') + ' |').join('\n') : 'No tables are touched.');
}
function reportLockRisk(text) {
  const st = load(text); if (!st.length) return none('PostgreSQL Lock Risks'); const f = []; const created = new Set(); let inTx = false;
  st.forEach((x) => {
    if (x.type === 'BEGIN') inTx = true; if (x.type === 'COMMIT' || x.type === 'ROLLBACK') inTx = false;
    const existing = x.table && !created.has(x.table);
    const conc = /\bINDEX\s+CONCURRENTLY\b/i.test(x.sql);
    if ((x.type === 'CREATE INDEX' || x.type === 'DROP INDEX') && conc && inTx) f.push([x.line, x.table || dropName(x.sql), 'concurrently', 'CONCURRENTLY cannot run inside a transaction block']);
    if (x.type === 'CREATE INDEX' && !conc && existing) f.push([x.line, x.table, 'index', 'index build blocks writes; use CREATE INDEX CONCURRENTLY']);
    let rw;                                                    // rule rewrite: VACUUM FULL / CLUSTER / REINDEX without CONCURRENTLY, any table
    if ((rw = /^VACUUM\s+(?:\(\s*)?FULL\b\s*\)?\s*((?:"[^"]+"|`[^`]+`|[\w$.]+))?/i.exec(x.sql))) f.push([x.line, unq(rw[1]), 'rewrite', 'VACUUM FULL rewrites the table under an ACCESS EXCLUSIVE lock']);
    else if ((rw = /^CLUSTER\b(?:\s+VERBOSE)?\s*((?:"[^"]+"|`[^`]+`|[\w$.]+))?/i.exec(x.sql))) f.push([x.line, unq(rw[1]), 'rewrite', 'CLUSTER rewrites the table under an ACCESS EXCLUSIVE lock']);
    else if ((rw = /^REINDEX\s+(?:\([^)]*\)\s*)?(INDEX|TABLE|SCHEMA|DATABASE|SYSTEM)\s+(CONCURRENTLY\s+)?((?:"[^"]+"|`[^`]+`|[\w$.]+))?/i.exec(x.sql)) && !rw[2])
      f.push([x.line, unq(rw[3]), 'rewrite', 'REINDEX without CONCURRENTLY blocks writes; use REINDEX CONCURRENTLY (PostgreSQL 12 and later)']);
    if (x.type === 'ALTER TABLE' && existing) alterActions(x.sql).forEach((a) => {
      if (/^ADD\s+CONSTRAINT\b/i.test(a) && /\b(FOREIGN\s+KEY|CHECK)\b/i.test(a) && !/\bNOT\s+VALID\b/i.test(a)) f.push([x.line, x.table, 'constraint', 'constraint is validated under lock; add it NOT VALID and VALIDATE it separately']);
      else if (/^ADD\s+(?:CONSTRAINT\s+(?:"[^"]+"|`[^`]+`|[\w$]+)\s+)?(?:PRIMARY\s+KEY|UNIQUE)\b/i.test(a) && !/\bUSING\s+INDEX\b/i.test(a))
        f.push([x.line, x.table, 'unique_constraint', 'building the index for this constraint blocks reads and writes; create a unique index CONCURRENTLY and add the constraint USING INDEX']);
      else if (/^ALTER\s+(COLUMN\s+)?\S+\s+SET\s+NOT\s+NULL\b/i.test(a)) f.push([x.line, x.table, 'not_null', 'SET NOT NULL scans the table under an ACCESS EXCLUSIVE lock']);
      else if (/^ALTER\s+(COLUMN\s+)?\S+\s+(SET\s+DATA\s+)?TYPE\b/i.test(a)) f.push([x.line, x.table, 'type', 'type change rewrites the table under an ACCESS EXCLUSIVE lock']);
      else if (/^ADD\b/i.test(a) && !/^ADD\s+CONSTRAINT\b/i.test(a) && (/\bDEFAULT\b[^,]*?\b(gen_random_uuid|uuid_generate_v4|random|clock_timestamp|timeofday|nextval)\s*\(/i.test(a) || /^ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(?:"[^"]+"|`[^`]+`|[\w$]+)\s+(SMALLSERIAL|SERIAL|BIGSERIAL)\b/i.test(a)))
        f.push([x.line, x.table, 'volatile_default', 'a volatile default rewrites the table under an ACCESS EXCLUSIVE lock']);
      else if (/^ADD\b/i.test(a) && !/^ADD\s+CONSTRAINT\b/i.test(a) && /\bNOT\s+NULL\b/i.test(a) && !/\bDEFAULT\b/i.test(a)) f.push([x.line, x.table, 'add_not_null', 'NOT NULL column without DEFAULT fails on a non-empty table']);
      else if (/^RENAME\b/i.test(a)) f.push([x.line, x.table, 'rename', 'rename breaks code that still uses the old name']);
    });
    if (x.type === 'CREATE TABLE') created.add(x.table);
  });
  if (!f.length) return '# PostgreSQL Lock Risks\n\nNo lock risks found.';
  f.sort((a, b) => a[0] - b[0]);
  return '# PostgreSQL Lock Risks\n\n' + pl(f.length, 'finding') + '.\n\n| Line | Table | Rule | Risk |\n| ---: | --- | --- | --- |\n' + f.map((r) => '| ' + r[0] + ' | ' + cell(r[1]) + ' | ' + r[2] + ' | ' + r[3] + ' |').join('\n');
}
// A name as a PostgreSQL identifier in the down migration: each dotted part that is not all lower-case letters, digits, _ and $
// (starting with a letter or _) is written in double quotes, so "DisplayName" stays DisplayName and is not folded to displayname.
const qi = (name) => String(name).split('.').map((p) => (/^[a-z_][a-z0-9_$]*$/.test(p) ? p : '"' + p.replace(/"/g, '""') + '"')).join('.');
// A code fence longer than any run of backticks in the SQL, so a name can never close the block early.
function fence(sql) { let n = 3; for (const m of sql.match(/`+/g) || []) n = Math.max(n, m.length + 1); const f = '`'.repeat(n); return f + 'sql\n' + sql + '\n' + f; }
function reportRollback(text) {
  const st = load(text); if (!st.length) return none('Rollback Plan'); const down = [], nr = [];
  const RM = 'objects or data are removed; restore from a backup', DC = 'data change cannot be reversed automatically';
  st.slice().reverse().forEach((x) => {
    const t = x.table;
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(x.type)) return;
    if (x.type === 'CREATE TABLE') return down.push('DROP TABLE ' + qi(t) + ';');
    if (x.type === 'CREATE INDEX') { const m = new RegExp('^\\s*CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+(?:CONCURRENTLY\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?' + ID + '\\s+ON\\b', 'i').exec(x.sql);
      return m ? down.push('DROP INDEX ' + qi(unq(m[1])) + ';') : nr.push([x.line, 'CREATE INDEX ' + t, 'no automatic reverse']); }
    if (/^DROP /.test(x.type)) return nr.push([x.line, x.type + ' ' + dropName(x.sql), RM]);
    if (x.type === 'TRUNCATE') return nr.push([x.line, 'TRUNCATE ' + t, RM]);
    if (x.type === 'DELETE') return nr.push([x.line, 'DELETE FROM ' + t, RM]);
    if (x.type === 'UPDATE') return nr.push([x.line, 'UPDATE ' + t, DC]);
    if (x.type === 'INSERT') return nr.push([x.line, 'INSERT INTO ' + t, DC]);
    if (x.type === 'ALTER TABLE') return alterActions(x.sql).reverse().forEach((a) => { let m;
      if ((m = /^RENAME\s+(?:COLUMN\s+)?("[^"]+"|[\w$]+)\s+TO\s+("[^"]+"|[\w$]+)$/i.exec(a)) && !/^RENAME\s+TO\b/i.test(a)) down.push('ALTER TABLE ' + qi(t) + ' RENAME COLUMN ' + qi(unq(m[2])) + ' TO ' + qi(unq(m[1])) + ';');
      else if ((m = /^RENAME\s+TO\s+(\S+)/i.exec(a))) { const sch = t.includes('.') ? t.slice(0, t.lastIndexOf('.') + 1) : ''; down.push('ALTER TABLE ' + qi(sch + unq(m[1])) + ' RENAME TO ' + qi(t.slice(sch.length)) + ';'); }
      else if ((m = /^ADD\s+CONSTRAINT\s+("[^"]+"|[\w$]+)/i.exec(a))) down.push('ALTER TABLE ' + qi(t) + ' DROP CONSTRAINT ' + qi(unq(m[1])) + ';');
      else if ((m = /^ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?("[^"]+"|[\w$]+)/i.exec(a))) down.push('ALTER TABLE ' + qi(t) + ' DROP COLUMN ' + qi(unq(m[1])) + ';');
      else if ((m = /^ALTER\s+(?:COLUMN\s+)?("[^"]+"|[\w$]+)\s+SET\s+NOT\s+NULL$/i.exec(a))) down.push('ALTER TABLE ' + qi(t) + ' ALTER COLUMN ' + qi(unq(m[1])) + ' DROP NOT NULL;');
      else if (/^DROP\s+CONSTRAINT\b/i.test(a)) nr.push([x.line, 'DROP CONSTRAINT ' + t + '.' + actCol(a, '^DROP\\s+CONSTRAINT(?:\\s+IF\\s+EXISTS)?'), RM]);
      else if (/^DROP\b/i.test(a)) nr.push([x.line, 'DROP COLUMN ' + t + '.' + actCol(a, '^DROP(?:\\s+COLUMN)?(?:\\s+IF\\s+EXISTS)?'), RM]);
      else nr.push([x.line, 'ALTER TABLE ' + t, 'no automatic reverse']); });
    nr.push([x.line, x.type + (t ? ' ' + t : ''), 'no automatic reverse']);
  });
  return '# Rollback Plan\n\n## Down migration\n\n' + (down.length ? fence(down.join('\n')) :'Nothing to reverse.') + '\n\n## Not reversible\n\n' +
    (nr.length ? '| Line | Statement | Reason |\n| ---: | --- | --- |\n' + nr.map((r) => '| ' + r[0] + ' | ' + cell(r[1]) + ' | ' + r[2] + ' |').join('\n') : 'Everything can be reversed.');
}
module.exports = { splitStatements, statementType, tableOf, alterActions, reportStatements, reportDestructive, reportTables, reportLockRisk, reportRollback };

// Caps every Markdown table of a report at 500 rows and says how many there were (a 50 MB file would otherwise give a report
// too large to open). Applied to every exported report.
function capTables(md) {
  if (typeof md !== 'string') return md;
  const lines = md.split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    if (lines[i].startsWith('|') && /^\|[ :-]+\|/.test(lines[i + 1] || '')) {
      out.push(lines[++i]);
      let n = 0;
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) { i++; n++; if (n <= 500) out.push(lines[i]); }
      if (n > 500) { out.push(''); out.push('Showing the first 500 of ' + n + ' rows.'); }
    }
  }
  return out.join('\n');
}
for (const k of Object.keys(module.exports)) {
  if (k.startsWith('report')) { const f = module.exports[k]; module.exports[k] = function (text) { return capTables(f(text)); }; }
}

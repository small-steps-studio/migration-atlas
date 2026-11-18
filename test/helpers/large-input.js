'use strict';
// Builds a SQL migration text of about `bytes` characters for the large-file test (invented statements).
function make(bytes) {
  const parts = ['BEGIN;\n']; let size = parts[0].length, i = 0;
  while (size < bytes) {
    const s = 'ALTER TABLE t' + (i % 300) + ' ADD COLUMN c' + i + " text DEFAULT 'x';\nINSERT INTO t" + (i % 300) + " (c) VALUES ('" + 'y'.repeat(100) + "');\nCREATE INDEX idx" + i + ' ON t' + (i % 300) + ' (c' + i + ');\n';
    parts.push(s); size += s.length; i++;
  }
  parts.push('COMMIT;\n');
  return parts.join('');
}
module.exports = { make };

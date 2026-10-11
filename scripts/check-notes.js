// Lists 2026 entries that still contain TODO. Run: npm run check:notes
const fs = require('fs');
const lines = fs.readFileSync('src/presents2026.ts', 'utf8').split('\n');
let key = null;
const todo = new Set();
for (const line of lines) {
  const m = /^\s*([A-Z]+\d{6}):\s*\{/.exec(line);
  if (m) key = m[1];
  if (key && line.includes('TODO')) todo.add(key);
}
const all = lines.filter((l) => /^\s*[A-Z]+\d{6}:\s*\{/.test(l)).length;
if (todo.size === 0) {
  console.log(`All ${all} entries are done.`);
} else {
  console.log(`${todo.size} of ${all} entries still have TODO:`);
  console.log([...todo].join('\n'));
  process.exitCode = 1;
}

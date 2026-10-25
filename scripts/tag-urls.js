// Writes tags.csv: one NFC tag URL per candle. Run: npm run tags
const fs = require('fs');
const BASE = process.env.BASE_URL || 'https://withcheesepls.com/advent-calendar/';
const rows = ['day,date,url'];
for (let n = 1; n <= 30; n++) {
  const d = new Date(2026, 10, 1 + n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  rows.push(`${n},${d.getFullYear()}-${mm}-${dd},${BASE}#${mm}.${dd}.${d.getFullYear()}`);
}
rows.push(`finale,2026-12-02,${BASE}#12.02.2026`);
fs.writeFileSync('tags.csv', rows.join('\n') + '\n');
console.log('Wrote tags.csv (' + (rows.length - 1) + ' rows) using ' + BASE);

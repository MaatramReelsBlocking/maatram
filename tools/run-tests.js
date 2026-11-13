/* Runs every test-*.js suite, prints a summary, and exits non-zero if any suite fails.
   Usage: npm test   (needs jsdom: npm install) */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const suites = fs.readdirSync(root).filter(f => /^test-.*\.js$/.test(f)).sort();
const failed = [];
for (const s of suites) {
  const r = spawnSync(process.execPath, [path.join(root, s)], { cwd: root, encoding: 'utf8', timeout: 300000 });
  const ok = r.status === 0;
  const last = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).pop() || '';
  console.log((ok ? 'PASS  ' : 'FAIL  ') + s.padEnd(24) + last.slice(0, 90));
  if (!ok) failed.push(s);
}
console.log('\n' + (suites.length - failed.length) + '/' + suites.length + ' suites passed' +
  (failed.length ? ' — FAILED: ' + failed.join(', ') : ''));
process.exit(failed.length ? 1 : 0);

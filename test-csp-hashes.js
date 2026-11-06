/* Checks that every inline <style> block in the shipped HTML is allowed by
   style-src-elem in vercel.json, and that no stale hash is left behind.
   Usage: node test-csp-hashes.js [rootDir]   (exit 1 on mismatch)
   Also reports remaining style="" attributes (follow-up: move to classes). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = process.argv[2] || '.';
const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
  .headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
const elem = csp.split(';').map(s => s.trim())
  .find(s => s.startsWith('style-src-elem ')).split(/\s+/).slice(1);
const allowed = new Set(elem.filter(s => s.startsWith("'sha256-"))
  .map(s => s.slice(8, -1)));

const files = [];
for (const dir of ['.', ...fs.readdirSync(root).filter(d =>
  fs.statSync(path.join(root, d)).isDirectory() && !d.startsWith('.') && d !== 'node_modules')]) {
  for (const f of fs.readdirSync(path.join(root, dir))) {
    if (f.endsWith('.html')) files.push(path.join(dir, f).replace(/^\.\//, ''));
  }
}

const used = new Set(); let bad = 0, blocks = 0, styleAttrs = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  styleAttrs += (src.match(/\sstyle="/g) || []).length;
  for (const m of src.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)) {
    blocks++;
    const h = crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
    used.add(h);
    if (!allowed.has(h)) { bad++; console.log('BLOCKED  inline <style> changed or new: ' + f); }
  }
}
for (const h of allowed) if (!used.has(h)) { bad++; console.log('STALE    hash not used by any page: ' + h); }

console.log(`\n${blocks} inline <style> blocks checked, ${allowed.size} hashes listed, ${bad} problem(s)`);
console.log(`follow-up: ${styleAttrs} style="" attributes still need 'unsafe-inline' in style-src-attr`);
process.exit(bad ? 1 : 0);

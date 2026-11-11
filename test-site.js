/* Maatram · site structure checks — node test-site.js
   No dependencies. Checks the shipped files, not the browser:
   required pages exist, each has a title and description, the sitemap
   only points at real files, and the config files parse. */
const fs = require('fs'), path = require('path');
let pass = 0, fail = 0;
const ok = (n, c) => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n)); };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const exists = f => fs.existsSync(path.join(__dirname, f));

const REQUIRED = ['index.html', 'timers.html', 'app-gate.html', 'study-room.html', 'stats.html',
  'leaderboard.html', 'login.html', 'socials.html', 'download.html', 'sports.html', 'ratings.html',
  'survey.html', 'privacy.html', 'terms.html', 'about.html', 'blog.html', 'hall-of-fame.html', '404.html'];

console.log('== required pages');
REQUIRED.forEach(f => ok(f + ' exists', exists(f)));

console.log('\n== head metadata');
REQUIRED.filter(exists).forEach(f => {
  const h = read(f);
  ok(f + ' has <title>', /<title>[^<]+<\/title>/i.test(h));
  ok(f + ' has meta description', /<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(h));
});

console.log('\n== sitemap');
const sm = read('sitemap.xml');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
ok('sitemap lists pages', locs.length > 0);
locs.forEach(u => {
  const p = u.replace(/^https?:\/\/[^/]+\/?/, '');
  const file = p === '' ? 'index.html' : p.replace(/\/$/, '/index.html');
  ok('sitemap entry resolves: ' + u, p === '' || exists(file) || exists(p));
});

console.log('\n== config files');
['vercel.json', 'firestore.rules'].forEach(f => ok(f + ' exists', exists(f)));
try { JSON.parse(read('vercel.json')); ok('vercel.json parses as JSON', true); }
catch (e) { ok('vercel.json parses as JSON', false); }
ok('robots.txt exists', exists('robots.txt'));
ok('robots.txt points at the sitemap', /Sitemap:/i.test(read('robots.txt')));

console.log('\n' + pass + '/' + (pass + fail) + ' checks pass' + (fail ? '  — ' + fail + ' FAILED' : ''));
process.exit(fail ? 1 : 0);

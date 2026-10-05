/* Maatram Module 6 checks — Sports Corner + monthly leaderboard cycle.
   run:  node test-sports.js          (needs jsdom) */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL  ' + name)); };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const PAGES = ['index.html','timers.html','app-gate.html','study-room.html','stats.html',
               'leaderboard.html','sports.html','socials.html','download.html','login.html'];

/* ── 1. file exists, parses, no duplicate ids ── */
const sports = read('sports.html');
const dom = new JSDOM(sports, { runScripts: 'outside-only' });
const D = dom.window.document;

ok('sports.html parses', !!D.querySelector('body'));
const ids = [...D.querySelectorAll('[id]')].map(e => e.id);
ok('no duplicate ids', new Set(ids).size === ids.length);
ok('single h1', D.querySelectorAll('h1').length === 1);
ok('canonical set', /canonical" href="https:\/\/maatram\.co\.in\/sports\.html/.test(sports));
ok('og:url set', /og:url" content="https:\/\/maatram\.co\.in\/sports\.html/.test(sports));
ok('title present', (D.title || '').includes('Sports'));
ok('meta description present', !!D.querySelector('meta[name="description"]'));

/* ── 2. shared shell ── */
ok('loads theme.js', /<script (defer )?src="theme\.js(\?v=\d+)?"><\/script>/.test(sports));
ok('loads gate.js (page is gated)', /<script src="gate\.js"><\/script>/.test(sports));
ok('gate.js comes after theme.js',
   sports.indexOf('src="gate.js"') > sports.indexOf('src="theme.js"'));
ok('has #mnav', !!D.getElementById('mnav'));
ok('nav marks Sports active', !!D.querySelector('#mnav a.mn-link.active[href="sports.html"]'));
ok('has perf toggle', !!D.getElementById('perfBtn'));
ok('has perf head script', /window\.MAATRAM_PERF/.test(sports));
ok('has skip link', !!D.querySelector('a.skip-link[href="#main"]'));
ok('main landmark', !!D.querySelector('#main[role="main"]'));
ok('reduced-motion path', /prefers-reduced-motion/.test(sports));
ok('overflow-x clip (Android WebView scroll fix)', /overflow-x:clip/.test(sports));

/* ── 3. every page links to Sports exactly once in the nav ── */
PAGES.forEach(f => {
  const d = new JSDOM(read(f)).window.document;
  const links = d.querySelectorAll('#mnav a[href="sports.html"]');
  ok('nav link on ' + f, links.length === 1);
});

/* ── 4. filters / selector ── */
['fCity','fSport','fWhen','fQ','locBtn','grid','empty','count'].forEach(id =>
  ok('#' + id + ' exists', !!D.getElementById(id)));
ok('city select is native', D.getElementById('fCity').tagName === 'SELECT');
ok('date filter is native select', D.getElementById('fWhen').tagName === 'SELECT');
ok('search is text input', D.getElementById('fQ').getAttribute('type') === 'text');
ok('no geocoding API call', !/geocod|mapbox|googleapis\.com\/maps|opencage|nominatim/i.test(sports));
ok('uses browser geolocation', /navigator\.geolocation/.test(sports));
ok('nearest-city table present', /const CITIES=\[/.test(sports));
ok('Coimbatore in city table', /'Coimbatore',11\.0168/.test(sports));
ok('sport list present', /const SPORTS=\[/.test(sports));

/* ── 5. register goes OUT to the organiser, never in-platform ── */
ok('register link is external anchor', /target="_blank" rel="noopener noreferrer nofollow"/.test(sports));
ok('register label names the organiser', /Register on organiser site/.test(sports));
ok('http(s) scheme validated before rendering a link', /\^https:\\\/\\\/\|\^http:\\\/\\\//.test(sports));
ok('no in-platform registration write', !/addDoc\([^)]*'registrations'|attendees/.test(sports));
ok('no points awarded on this page', !/maatramAddPoints|maatramAward|increment\(/.test(sports));
ok('no-link fallback state', /No official link given/.test(sports));

/* ── 6. add-event form ── */
['aTitle','aSport','aCity','aDate','aVenue','aOrg','aUrl','aBtn','addMsg'].forEach(id =>
  ok('#' + id + ' exists', !!D.getElementById(id)));
ok('url field typed url', D.getElementById('aUrl').getAttribute('type') === 'url');
ok('date field typed date', D.getElementById('aDate').getAttribute('type') === 'date');
ok('writes to events collection', /collection\(db,'events'\)/.test(sports));
ok('stamps author uid', /ev\.by=me\.uid/.test(sports));
ok('rejects non-http link', /The link must start with https/.test(sports));
ok('requires sign-in to publish', /Sign in first, then publish/.test(sports));

/* ── 7. no invented content (website-strict) ── */
ok('no seeded fake events', !/SEED|dummyEvents|sampleEvents/.test(sports));
ok('empty state instead of filler', /Nothing listed here yet/.test(sports));

/* ── 8. gate.js monthly roll ── */
const gate = read('gate.js');
ok('gate has cycleId', /function cycleId\(/.test(gate));
ok('gate has roll()', /async function roll\(/.test(gate));
ok('roll archives to m_<cycle>', /patch\['m_'\+d\.cycle\] = pts/.test(gate));
ok('roll zeroes points', /patch\.points\s*=\s*0/.test(gate));
ok('roll accumulates lifetime', /patch\.lifetime = life\+pts/.test(gate));
ok('first run adopts instead of wiping', /first ever run: adopt/.test(gate));
ok('first run never copies points into lifetime', !/patch\.lifetime = life>pts/.test(gate) && /if\(d\.lifetime===undefined\) patch\.lifetime = 0;/.test(gate));
ok('roll skipped when cycle current', /if\(d\.cycle===now\) return;/.test(gate));
ok('roll never blocks the page', /catch\(e\)\{ \}\s*\/\* never block/.test(gate));
ok('no cron / no server key in gate', !/firebase-admin|serviceAccount/i.test(gate));

/* behavioural test of the roll logic, lifted out of gate.js */
(function () {
  const cycleId = dt => dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2);
  function rollCalc(d, now) {
    if (d.cycle === now) return null;
    const pts = d.points || 0, life = d.lifetime || 0, patch = { cycle: now };
    if (!d.cycle) { if (d.lifetime === undefined) patch.lifetime = 0; }
    else { patch.lifetime = life + pts; patch.points = 0; patch['m_' + d.cycle] = pts; }
    return patch;
  }
  ok('cycleId formats YYYY-MM', cycleId(new Date(2026, 7, 7)) === '2026-08');
  ok('cycleId pads month', cycleId(new Date(2026, 0, 1)) === '2026-01');

  const same = rollCalc({ cycle: '2026-08', points: 40 }, '2026-08');
  ok('same month = no write', same === null);

  const first = rollCalc({ points: 120 }, '2026-08');
  ok('migration keeps points', first.points === undefined);
  ok('migration leaves lifetime at archived months only (0)', first.lifetime === 0);
  ok('migration sets cycle', first.cycle === '2026-08');
  const firstL = rollCalc({ points: 120, lifetime: 40 }, '2026-08');
  ok('migration never rewrites an existing lifetime', !('lifetime' in firstL));

  /* all time = lifetime + points must not change across first run + a month roll */
  const allTime = d => (d.lifetime || 0) + (d.points || 0);
  let u = { points: 120, lifetime: 40 }; const before = allTime(u);
  u = { ...u, ...rollCalc(u, '2026-09') };
  ok('first run: all-time total unchanged (no double count)', allTime(u) === before);
  u = { ...u, ...rollCalc(u, '2026-10') };
  ok('next roll: all-time total still unchanged', allTime(u) === before && u.points === 0 && u['m_2026-09'] === 120);

  const rolled = rollCalc({ cycle: '2026-07', points: 90, lifetime: 300 }, '2026-08');
  ok('new month zeroes points', rolled.points === 0);
  ok('new month adds to lifetime', rolled.lifetime === 390);
  ok('new month archives old total', rolled['m_2026-07'] === 90);

  const zero = rollCalc({ cycle: '2026-07', points: 0, lifetime: 10 }, '2026-08');
  ok('zero-point month still rolls', zero.cycle === '2026-08' && zero.lifetime === 10);
})();

/* ── 9. leaderboard tabs ── */
const lb = read('leaderboard.html');
const L = new JSDOM(lb).window.document;
ok('tabMonth exists', !!L.getElementById('tabMonth'));
ok('tabLife exists', !!L.getElementById('tabLife'));
ok('cycleNote exists', !!L.getElementById('cycleNote'));
ok('tablist role', !!L.querySelector('.tabs[role="tablist"]'));
ok('month tab selected by default', L.getElementById('tabMonth').getAttribute('aria-selected') === 'true');
ok('tabs are 44px+ targets', /\.tabs button\{min-height:44px/.test(lb));
ok('boards read with single-field orders (no composite index)',
   /orderBy\(field,'desc'\),limit\(100\)/.test(lb) && /listen\('points',byPoints\)/.test(lb) && /listen\('lifetime',byLife\)/.test(lb)
   && !/where\(/.test(lb));
ok('all time = lifetime + this month', /lifetime\|\|0\)\+\(v\.points\|\|0\)/.test(lb));
ok('month board counts points only for the current cycle', /points:v\.cycle===cur\?\(v\.points\|\|0\):0/.test(lb));
/* behavioural: lift rebuild() out of the page and feed it docs */
(function () {
  const m = lb.match(/function rebuild\(\)\{[\s\S]*?\n    \}/);
  ok('rebuild() found', !!m);
  if (!m) return;
  const run = new Function('cycleId', 'competes', 'byPoints', 'byLife', m[0] +
    '; let cloudUsers=[],cloudLife=[]; function render(){}; rebuild(); return {cloudUsers,cloudLife};');
  const cid = () => '2026-10';
  const comp = v => !!v && v.banned !== true;
  const bp = new Map([['a', { name: 'A', points: 300, cycle: '2026-09', lifetime: 500 }],   // not back since the 1st
                      ['b', { name: 'B', points: 40, cycle: '2026-10', lifetime: 100 }],
                      ['x', { name: 'X', points: 999, cycle: '2026-10', banned: true }]]);
  const bl = new Map([['c', { name: 'C', points: 0, cycle: '2026-10', lifetime: 900 }], ['a', bp.get('a')]]);
  const r = run(cid, comp, bp, bl);
  const mon = Object.fromEntries(r.cloudUsers.map(u => [u.id, u.points]));
  const life = Object.fromEntries(r.cloudLife.map(u => [u.id, u.points]));
  ok('stale month points count 0 on the monthly board', mon.a === 0 && mon.b === 40 && r.cloudUsers[0].id === 'b');
  ok('stale points still count once on all time', life.a === 800 && life.b === 140 && life.c === 900);
  ok('union of both reads, banned dropped', !('x' in life) && Object.keys(life).length === 3);
})();
ok('only Google photo URLs render', /PHOTO_RE=\/\^https:\\\/\\\/\[a-z0-9\.-\]\+\\\.googleusercontent\\\.com\\\//.test(lb)
   && (lb.match(/photoOk\(u\.photo\)\?/g) || []).length === 2);
ok('board listens only while signed in', /unsubs\.forEach\(f=>f\(\)\)/.test(lb) && /Sign in to view/.test(lb));
ok('signed-out empty state links to login', /<a href="login\.html">Sign in<\/a> to see who is on top/.test(lb));
ok('rows animate once, live updates keep them visible', /const shown=new Set\(\)/.test(lb) && /if\(seen\('r'\+u\.id\)\) r\.classList\.add\('in'\)/.test(lb));
ok('dead leaderboard code removed', !/fbUser|fbApi|updateDoc|increment|maatramAddPoints|mePill|signInLink/.test(lb));
ok('both boards sorted client-side', /cloudUsers\.sort\(/.test(lb) && /cloudLife\s*\.sort\(/.test(lb));
ok('render picks source by tab', /TAB==='month'\?cloudUsers:cloudLife/.test(lb));
ok('setTab wired to buttons', /\$\('tabLife'\)\.onclick=\(\)=>setTab\('life'\)/.test(lb));
ok('reset date shown to users', /scores archive and reset on/.test(lb));
ok('leaderboard nav still marks itself active', !!L.querySelector('#mnav a.mn-link.active[href="leaderboard.html"]'));

/* ── 10. firestore rules ── */
const rules = read('firestore.rules');
ok('events block present', /match \/events\/\{id\}/.test(rules));
ok('events readable when signed in', /allow read:\s+if request\.auth != null;/.test(rules));
ok('events created only by author', /request\.resource\.data\.by == request\.auth\.uid/.test(rules));
ok('events edited only by author', /resource\.data\.by == request\.auth\.uid/.test(rules));
ok('event title length capped', /title\.size\(\) <= 80/.test(rules));
ok('reset branch allows zeroing', /neu\(\)\.points == 0/.test(rules));
ok('reset branch requires a cycle change', /neu\(\)\.cycle != old\(\)\.get\('cycle', ?''\)/.test(rules));
ok('normal caps still enforced', /old\(\)\.get\('points', ?0\) \+ 100/.test(rules));
ok('normal play cannot touch cycle or lifetime', /!touched\(\['lifetime', 'cycle'\]\)/.test(rules));
ok('a cycle is always YYYY-MM', /cycleOk\(v\) \{ return v is string && v\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}\$'\)/.test(rules)
   && (rules.match(/cycleOk\(neu\(\)\.cycle\)/g) || []).length === 3);
ok('first-ever roll only stamps the cycle', /changed\(\)\.hasOnly\(\['cycle', 'lifetime'\]\)[\s\S]{0,200}neu\(\)\.get\('lifetime', 0\) == old\(\)\.get\('lifetime', 0\)/.test(rules));
ok('archived month must equal the old points', /neu\(\)\.get\('m_' \+ old\(\)\.get\('cycle', 'x'\), -1\) == old\(\)\.get\('points', 0\)/.test(rules));
ok('photo pinned to Google avatars', /googleusercontent/.test(rules) && /v\.size\(\) <= 500/.test(rules));
ok('lastLogin must be a timestamp', (rules.match(/neu\(\)\.lastLogin is timestamp/g) || []).length === 2);
/* events: the allowlist must be exactly what sports.html writes */
(function () {
  const m = rules.match(/match \/events\/\{id\}[\s\S]*?keys\(\)\.hasOnly\(\[([^\]]*)\]\)/);
  ok('events have a key allowlist', !!m);
  const allowed = m ? m[1].split(',').map(x => x.trim().replace(/'/g, '')).sort() : [];
  const ev = (sports.match(/const ev=\{([\s\S]*?)\};/) || [, ''])[1];
  const written = [...ev.matchAll(/(\w+):\$\(/g)].map(x => x[1]);
  (sports.match(/ev\.by=me\.uid; ev\.createdAt=Date\.now\(\);/) ? ['by', 'createdAt'] : []).forEach(k => written.push(k));
  ok('event allowlist == keys the page writes', JSON.stringify(allowed) === JSON.stringify(written.sort()));
  ok('byName no longer written', !/byName/.test(sports) && !/byName/.test(rules));
})();
ok('event date must be YYYY-MM-DD', /date\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\)/.test(rules));
ok('page validates the same date shape', /if\(!\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(ev\.date\)\)/.test(sports));
ok('events read skips old listings', /F\.where\('date','>=',isoDay\(from\)\),F\.orderBy\('date'\),F\.limit\(200\)/.test(sports)
   && /from\.setDate\(from\.getDate\(\)-60\)/.test(sports));

/* ── 11. flat delivery (he uploads to the repo root) ── */
const files = fs.readdirSync(__dirname).filter(f => f !== 'node_modules' && f !== 'package.json' && f !== 'package-lock.json');
ok('no unexpected subfolders in package', files.every(f => ['wellness','docs','chrome-extension','api'].includes(f) || f.startsWith('.') || !fs.statSync(path.join(__dirname, f)).isDirectory()));

/* ── 12. coach's corner ── */
ok('coach section exists', !!D.getElementById('coach'));
ok('coach list exists', !!D.getElementById('coachList'));
ok('coach heading labelled', D.getElementById('coach').getAttribute('aria-labelledby') === 'coachH');
ok('COACH data present', /const COACH=\{/.test(sports));
ok('renderCoach called on load', /boot\(\);\nrender\(\);\nrenderCoach\(\);/.test(sports));
ok('sport filter refreshes notes', /if\(id==='fSport'\)\{renderCoach\(\);\}/.test(sports));
ok('no invented attributions', !/\u2014 [A-Z][a-z]+ [A-Z][a-z]+, (coach|player)/.test(sports));
ok('notes are inserted as text, not HTML', /li\.textContent=t/.test(sports));
(function () {
  const m = sports.match(/const COACH=\{[\s\S]*?\n\};/);
  ok('COACH block parses', !!m);
  const COACH = m ? new Function('return ' + m[0].replace(/^const COACH=/, '').replace(/;$/, ''))() : {};
  const sportList = (sports.match(/const SPORTS=\[([\s\S]*?)\];/) || [,''])[1]
    .split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
  ok('every sport has notes', sportList.every(s => Array.isArray(COACH[s])));
  ok('exactly five notes per sport', Object.values(COACH).every(v => v.length === 5));
  ok('no empty notes', Object.values(COACH).every(v => v.every(t => t.length > 20)));
  ok('Badminton covered', !!COACH['Badminton']);
  ok('Tennis covered', !!COACH['Tennis']);
  ok('fallback bucket covered', !!COACH['Other']);
})();

/* ── 13. board filters banned users ── */
ok('competes() helper exists', /function competes\(v\)/.test(lb));
ok('board read filters banned', /if\(!competes\(v\)\)return;[\s\S]{0,200}cloudUsers\.push/.test(lb));
ok('same filter covers the all-time board', /if\(!competes\(v\)\)return;[\s\S]{0,200}cloudLife\s*\.push/.test(lb));
ok('fetch window (top 100 per board) wider than the 50 shown', /limit\(100\)/.test(lb));
ok('still shows only 50', /cloudUsers=cloudUsers\.slice\(0,50\)/.test(lb) && /cloudLife\s*=cloudLife\s*\.slice\(0,50\)/.test(lb));
/* -- 14. author/admin removal + sticky filters (Aug 7 round) -- */
ok('remove button styled', /\.ev \.rm\{/.test(sports));
ok('author uid carried into the list', /by:v\.by\|\|''/.test(sports));
ok('board re-renders when auth resolves', /onAuthStateChanged\(U\.getAuth\(app\),u=>\{\s*me=u; authed=!!u;/.test(sports));
ok('listings listen only while signed in', /if\(unsub\)\{unsub\(\);unsub=null;\}/.test(sports) && /Sign in to view/.test(sports)
   && /<a href="login\.html">Sign in<\/a> to browse them/.test(sports));
ok('remove shown to the Maatram account and the author', /me&&db&&api&&\(\(me\.email\|\|''\)\.toLowerCase\(\)===ADMIN_EMAIL\|\|me\.uid===e\.by\)/.test(sports));
ok('add-event fields are labelled', ['aTitle','aSport','aCity','aDate','aVenue','aOrg','aUrl'].every(id => D.getElementById(id).getAttribute('aria-label')));
ok('nav auth wrapper balanced', !!D.querySelector('#mnav #mnavAuth #mnavChip'));
ok('admin address is the Maatram inbox', /ADMIN_EMAIL='maatram97@gmail\.com'/.test(sports));
ok('removal needs a second tap', /Tap again to remove/.test(sports));
ok('removal calls deleteDoc on the doc id', /api\.deleteDoc\(api\.doc\(db,'events',e\.id\)\)/.test(sports));
ok('failed removal is reported, not swallowed', /Could not remove: /.test(sports));
ok('geolocation no longer overwrites a touched add-form city', /if\(!addTouched\)\$\('aCity'\)\.value=city/.test(sports));
ok('add-form selects track their own edits', /\['aCity','aSport'\]\.forEach/.test(sports));
ok('sport filter remembered', /localStorage\.setItem\('maatram_sport'/.test(sports));
ok('when filter remembered', /localStorage\.setItem\('maatram_when'/.test(sports));
ok('saved filters restored on load', /maatram_sport'\);[\s\S]{0,120}getItem\('maatram_when'/.test(sports));
ok('publish snaps the filter onto the new event', /\$\('fSport'\)\.value=ev\.sport; \$\('fWhen'\)\.value='up'/.test(sports));
ok('publish message names where it went', /Filter moved to '\+ev\.sport/.test(sports));


console.log('\n' + pass + '/' + (pass + fail) + ' checks pass' + (fail ? '  — ' + fail + ' FAILED' : ''));
process.exit(fail ? 1 : 0);

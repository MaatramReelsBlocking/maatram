/* App Gate tiles must not navigate or cost points when tapped. jsdom, no network. */
const fs = require('fs'), { JSDOM } = require('jsdom');
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const html = fs.readFileSync(__dirname + '/app-gate.html', 'utf8');
const d = new JSDOM(html).window.document;
const tiles = [...d.querySelectorAll('#appGrid .app')];
ok('five built-in tiles', tiles.length === 5);
ok('no tile is a link', tiles.every(t => t.tagName === 'DIV' && !t.hasAttribute('href') && !t.hasAttribute('target')));
ok('no site links inside tiles', !d.querySelector('#appGrid a'));
ok('custom-site tiles are inert too', /createElement\('div'\); a\.className='app custom';/.test(html) && !/a\.href='https:\/\/'\+d/.test(html));
ok('tap no longer broadcasts or penalises', !/type:'social_open'/.test(html) && !/maatramAward\(-10,evt\.app/.test(html) && !/ROOM\.strike\(evt/.test(html));
ok('lock-screen shake feedback kept', /grid\.classList\.add\('deny'\)/.test(html));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);

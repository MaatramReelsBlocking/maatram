/* First-time onboarding: shows once, remembers skip and goal, replays with ?tour=1,
   and never reports Shield as verified unless the native bridge says it is running.
   node test-onboarding.js  (needs jsdom) */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n); };
const src = fs.readFileSync(path.join(__dirname, 'onboarding.js'), 'utf8');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function page(url, extra, seed) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  Object.assign(w, extra || {});
  if (seed) w.localStorage.setItem('maatram_onboard_v1', JSON.stringify(seed));
  w.eval(src);
  return w;
}
const open = w => !!w.document.getElementById('mob');

(async () => {
  console.log('== first visit');
  let w = page('https://maatram.co.in/timers.html');
  await wait(20);
  ok('opens on the first visit', open(w));
  ok('shows a Skip button on the welcome step', !!w.document.querySelector('[data-a="skip"]'));
  w.document.querySelector('[data-a="skip"]').click();
  await wait(10);
  const st = JSON.parse(w.localStorage.getItem('maatram_onboard_v1') || 'null');
  ok('skip is saved as skipped', st && st.state === 'skipped');
  ok('closes after skip', !open(w));

  console.log('\n== never repeats');
  w = page('https://maatram.co.in/stats.html', {}, { state: 'skipped' });
  await wait(20);
  ok('does not reopen after it was skipped', !open(w));

  console.log('\n== finish with a goal');
  w = page('https://maatram.co.in/leaderboard.html');
  await wait(20);
  for (let i = 0; i < 2; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  w.document.querySelector('[data-k="sleep"]').click();
  await wait(5);
  ok('goal option is selected', w.document.querySelector('[data-k="sleep"]').getAttribute('aria-checked') === 'true');
  for (let i = 0; i < 3; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  await wait(10);
  const done = JSON.parse(w.localStorage.getItem('maatram_onboard_v1') || 'null');
  ok('finish is saved as done with the chosen goal', done && done.state === 'done' && done.goal === 'sleep');
  ok('does not reopen after finishing', !open(page('https://maatram.co.in/leaderboard.html', {}, done)));

  console.log('\n== replay');
  w = page('https://maatram.co.in/timers.html?tour=1');
  await wait(20);
  ok('?tour=1 reopens the tour even after finishing', open(w));
  ok('?tour=1 is removed from the address bar', w.location.search === '');

  console.log('\n== Shield is never claimed without the native bridge');
  w = page('https://maatram.co.in/timers.html?tour=1');
  await wait(20);
  for (let i = 0; i < 3; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  await wait(30);
  const txt1 = (w.document.getElementById('mobShield') || {}).textContent || '';
  ok('web visitor is told Shield cannot be checked here', /only be checked inside the Maatram Android app/.test(txt1));
  ok('web visitor never sees "running"', !/is on and running/.test(txt1));

  w = page('https://maatram.co.in/timers.html?tour=1', {
    Capacitor: { Plugins: { AppBlocker: { getStatus: () => Promise.resolve({ running: false }) } } } });
  await wait(20);
  for (let i = 0; i < 3; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  await wait(30);
  const txt2 = (w.document.getElementById('mobShield') || {}).textContent || '';
  ok('native app with Shield stopped is NOT shown as running', !/is on and running/.test(txt2) && /not running/.test(txt2));

  w = page('https://maatram.co.in/timers.html?tour=1', {
    Capacitor: { Plugins: { AppBlocker: { getStatus: () => Promise.resolve({ running: true }) } } } });
  await wait(20);
  for (let i = 0; i < 3; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  await wait(30);
  const txt3 = (w.document.getElementById('mobShield') || {}).textContent || '';
  ok('native app with Shield running is shown as running', /is on and running/.test(txt3));

  w = page('https://maatram.co.in/timers.html?tour=1', {
    Capacitor: { Plugins: { AppBlocker: { getStatus: () => new Promise(() => {}) } } } });
  await wait(20);
  for (let i = 0; i < 3; i++) { w.document.querySelector('[data-a="next"]').click(); await wait(5); }
  await wait(3300);
  const txt4 = (w.document.getElementById('mobShield') || {}).textContent || '';
  ok('a check that never answers is reported as not verified', /did not answer/.test(txt4) && !/is on and running/.test(txt4));

  console.log('\n' + pass + '/' + (pass + fail) + ' checks pass' + (fail ? '  — ' + fail + ' FAILED' : ''));
  process.exit(fail ? 1 : 0);
})();

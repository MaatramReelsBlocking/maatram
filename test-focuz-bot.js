/* Focuz help bot checks: matcher accuracy + widget behaviour. Run: node test-focuz-bot.js */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const src = fs.readFileSync(__dirname + '/focuz-bot.js', 'utf8');
const kbSrc = fs.readFileSync(__dirname + '/focuz-kb.js', 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL', m)); };

(async () => {
function load(path) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url: 'https://maatram.co.in' + path, runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.matchMedia = () => ({ matches: true });
  dom.window.eval(src);
  dom.window.eval(kbSrc); // the extra topics file the bot lazy-loads on first open
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom.window;
}

// Matcher: question -> expected answer id (top hit)
const w = load('/');
const cases = [
  ['is it free?', 'free'], ['how much does it cost', 'free'], ['do i need an account', 'account'],
  ['how do i login', 'signin'], ['how to earn points', 'points'], ['my points are not saving', 'points-missing'],
  ['pomodoro', 'timers'], ['how does the pomodro timer work', 'timers'], ['deep work or pomodoro which is better', 'timer-which'],
  ['how does hard lock work', 'hardlock'], ['can i block instagram on my laptop', 'hardlock-pc'],
  ['chrome extension', 'extension'], ['how to join a study room with friends', 'room'], ['what happens after 3 strikes', 'strikes'],
  ['room not connecting', 'room-stuck'], ['how to log screen time', 'stats'], ['why cant it track automatically', 'stats-auto'],
  ['meal plan', 'wellness'], ['sports tournament near me', 'sports'], ['is there an android app', 'android'],
  ['app not installed error', 'not-installed'], ['play protect blocked it', 'playprotect'],
  ['hard lock not working on my phone', 'shield'], ['restricted setting greyed out', 'restricted'],
  ['samsung keeps killing it', 'samsung'], ['site is so laggy', 'lag'], ['how to change theme', 'theme'],
  ['i want to report a bug', 'contact'], ['who made this', 'who'], ['where is my data stored', 'data'],
  ['i keep procrastinating', 'tip-start'], ['i cant stop scrolling reels', 'tip-phone'],
  ['how to concentrate longer', 'tip-focus'], ['board exam revision tips', 'tip-exam'],
  ['leaderbord rank', 'leaderboard'], ['what is maatram', 'what'],
  // focuz-kb.js topics, typed the way students actually type
  ['heyy', 'hi'], ['r u a bot', 'ai'], ['tysm', 'thanks'], ['tell me a joke pls', 'joke'], ['i feel so lonely', 'lonely'],
  ['i want to kill myself', 'crisis'], ['someone is bullying me online', 'bully'], ['is red bull bad', 'energy'],
  ['exam tomorrow i didnt study anything', 'lastmin'], ['make me a timetable', 'timetable'], ['explain photosynthesis', 'photosynthesis'],
  ['pythagoras theorm', 'pythagoras'], ['why are reels so addictive', 'dopamine'], ['i cant stop playing free fire', 'gaming'],
  ['science or commerce after 10th', 'stream'], ['does maatram work on iphone', 'iphone'], ['what does maatram mean', 'meaning'],
];
for (const [q, id] of cases) {
  const r = w.__focuzMatch(q);
  ok(r.length && r[0].e.id === id, `"${q}" -> ${r[0] && r[0].e.id} (want ${id})`);
}
ok(w.__focuzMatch('the a is').length === 0, 'stopwords only -> no match');
ok(w.__focuzMatch('quantum banana').length === 0, 'nonsense -> no match');
ok(w.__focuzKB.length >= 188 && new Set(w.__focuzKB.map(e => e.id)).size === w.__focuzKB.length, 'core + 150 extra topics, unique ids');
ok(w.__focuzKB.every(e => e.q && e.k.length && [].concat(e.a).every(t => typeof t === 'string' && t.length > 5)), 'every topic has q, keywords and answers');

// Widget
const d = w.document;
const btn = d.getElementById('fz-btn');
ok(btn && btn.getAttribute('aria-label'), 'bubble exists with label');
ok(!d.getElementById('fz-panel'), 'panel lazy (not built before open)');
btn.click();
const panel = d.getElementById('fz-panel');
ok(panel && !panel.hidden, 'panel opens');
ok(panel.getAttribute('role') === 'dialog', 'dialog role');
ok(btn.querySelector('svg.fz-av .kat') && btn.querySelector('svg.fz-av .eye') && btn.querySelector('svg').getAttribute('aria-hidden') === 'true', 'bubble shows the Mini Ronin mascot');
ok(d.querySelector('#fz-head .fz-hav svg.fz-av'), 'panel header shows mascot');
ok(/Focuz/.test(d.querySelector('.fz-b').textContent), 'greeting shown');
ok(d.querySelectorAll('.fz-chip').length === 4, 'home chips shown');
d.getElementById('fz-in').value = 'how does hard lock work';
d.getElementById('fz-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
const last = [...d.querySelectorAll('.fz-b')].pop();
ok(/5 to 90 minutes/.test(last.textContent) && last.querySelector('a[href="/app-gate.html"]'), 'typed question answered with link');
d.getElementById('fz-in').value = 'quantum banana';
d.getElementById('fz-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
ok(/maatram97@gmail.com/.test([...d.querySelectorAll('.fz-b')].pop().textContent), 'fallback hands off to email');
d.querySelector('.fz-chip').click();
ok(d.querySelectorAll('.fz-u').length === 3, 'chip click asks question');
d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
ok(panel.hidden === false && !panel.classList.contains('open') && btn.getAttribute('aria-expanded') === 'false', 'Esc closes');
ok(!/[<]script/i.test([...d.querySelectorAll('.fz-u')].map(n => n.innerHTML).join('')), 'user text not parsed as HTML');

// Page-aware chips
const g = load('/study-room.html'); g.document.getElementById('fz-btn').click();
ok(/Study Rooms work/.test(g.document.querySelector('.fz-chip').textContent), 'study-room page chips');
const wl = load('/wellness/wellness.html'); wl.document.getElementById('fz-btn').click();
ok(/Wellness/.test(wl.document.querySelector('.fz-chip').textContent), 'wellness subfolder chips');

// Every page that loads theme.js also loads focuz-bot.js
const pages = fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).concat(['wellness/wellness.html']);
for (const p of pages) {
  const h = fs.readFileSync(__dirname + '/' + p, 'utf8');
  if (/theme\.js/.test(h)) ok(/<script defer src="\/focuz-bot\.js"><\/script>/.test(h), p + ' loads focuz-bot.js');
}
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
})();

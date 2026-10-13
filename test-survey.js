/* survey.js pop-up + share box, and ratings.html rendering from /api/ratings. Run: node test-survey.js */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const api = require('./api/ratings.js');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + m); };
const SURVEY = fs.readFileSync(path.join(__dirname, 'survey.js'), 'utf8');

function page(file, { seen = false, data } = {}) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, '');
  const dom = new JSDOM(html, { url: 'https://maatram.co.in/' + file, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  if (seen) w.localStorage.setItem('maatram_survey_seen', String(seen === 'old' ? Date.now() - 8 * 864e5 : Date.now()));
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
  w.fetch = async (u) => ({ ok: true, json: async () => data });
  return w;
}

(async () => {
  // API: snapshot summary
  const s = api.summarize([['Timestamp', 'Overall, how would you rate your experience with this app?', 'Any suggestions or feedback?', 'Which feature?'],
    ['1/1', 'Excellent', 'Love the hard lock', 'App blocking'], ['1/2', 'Fair', 'nil', 'Rewards']], true);
  ok(s.average === 4 && s.rated === 2 && s.dist[5] === 1 && s.dist[3] === 1, 'average + distribution');
  ok(s.reviews.length === 1 && s.reviews[0].stars === 5, 'empty-ish feedback hidden, stars attached');
  ok(s.questions.some((q) => q.q === 'Which feature?' && q.counts.Rewards === 1), 'per-question counts');

  // pop-up for a new visitor
  let w = page('socials.html');
  w.setTimeout = ((st) => (f, ms) => st(f, ms >= 8000 ? 0 : ms))(w.setTimeout);
  w.eval(SURVEY);
  ok(w.document.querySelector('[data-survey-share] .sv-box input').value === 'https://maatram.co.in/survey', 'socials share box filled');
  await new Promise((r) => setTimeout(r, 30));
  const pop = w.document.getElementById('svPop');
  ok(!!pop, 'pop-up shows for a new visitor');
  ok(pop && pop.querySelector('a[href*="mailto:"]') && pop.querySelector('a[href*="wa.me"]'), 'pop-up has mail + WhatsApp share');
  ok(pop && pop.querySelector('a.sv-main').getAttribute('href') === '/ratings.html#rate', 'pop-up leads to the star rating');
  ok(Date.now() - +w.localStorage.getItem('maatram_survey_seen') < 5000, 'shown time saved');
  pop.querySelector('[data-close]:not(.sv-main)').click();
  ok(!w.document.getElementById('svPop'), 'Maybe later closes it');

  // returning visitor: no pop-up
  w = page('socials.html', { seen: true });
  w.setTimeout = ((st) => (f, ms) => st(f, 0))(w.setTimeout);
  w.eval(SURVEY);
  await new Promise((r) => setTimeout(r, 30));
  ok(!w.document.getElementById('svPop'), 'no pop-up for a visitor who saw it this week');

  // a week later: shows again
  w = page('socials.html', { seen: 'old' });
  w.setTimeout = ((st) => (f, ms) => st(f, 0))(w.setTimeout);
  w.eval(SURVEY);
  await new Promise((r) => setTimeout(r, 30));
  ok(!!w.document.getElementById('svPop'), 'pop-up returns after 7 days');

  // ratings page
  const res = { setHeader() {}, status() { return this; }, json(o) { this.o = o; } };
  global.fetch = async () => ({ ok: false, status: 403, headers: { get: () => 'text/html' } });
  const warn = console.warn; console.warn = () => {};
  await api({}, res); console.warn = warn;
  w = page('ratings.html', { seen: true, data: res.o });
  const inline = [...w.document.querySelectorAll('script:not([src]):not([type])')].map((x) => x.textContent);
  inline.filter((c) => !c.includes('universal nav auth')).forEach((code) => { try { w.eval(code); } catch (_) {} });
  w.eval(SURVEY);
  await new Promise((r) => setTimeout(r, 50));
  const d = w.document;
  ok(d.getElementById('rtAvg').textContent === '5.0', 'average shown (' + d.getElementById('rtAvg').textContent + ')');
  ok(/Based on 6 ratings/.test(d.getElementById('rtN').textContent), 'rating count shown');
  ok(d.querySelectorAll('#rtDist .bar').length === 5, '5-star distribution bars');
  ok(!d.getElementById('rtNote').hidden, 'snapshot note shown when sheet is private');
  ok(d.querySelectorAll('#rtRev .rev').length === 3, 'feedback list rendered');
  ok(d.querySelectorAll('#rtQs .rt-card').length === 9, 'survey answer cards rendered');
  ok(d.querySelector('a.mn-link.active').getAttribute('href') === 'ratings.html', 'nav marks Ratings active');
  ok(!!d.querySelector('#rate .sv-box'), 'share box on ratings page');
  const st = d.querySelectorAll('.rv-stars button');
  st[3].click();
  ok(st.length === 5 && [...st].filter((b) => b.classList.contains('on')).length === 4, 'star picker selects 4 stars');

  console.log(`\n  ${pass} passed, ${fail} failed   (survey + ratings)`);
  process.exit(fail ? 1 : 0);
})();

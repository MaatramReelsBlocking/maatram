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
  await api({ headers: {} }, res); console.warn = warn;
  w = page('ratings.html', { seen: true, data: res.o });
  w.eval(fs.readFileSync(path.join(__dirname, 'survey-questions.js'), 'utf8'));   // real page loads this before its inline script
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

  // shared aggregation: live Firestore surveys + legacy Google Form snapshot
  const SQ = fs.readFileSync(path.join(__dirname, 'survey-questions.js'), 'utf8');
  const sw = {}; new Function('window', SQ)(sw); const MS = sw.MAATRAM_SURVEY;
  const fmt = () => '1 Jan 2026';
  const live = MS.liveStats([
    { stars: 5, answers: { freq: 'Once a day', overall: 'Excellent', text: 'Love the hard lock' }, at: new Date() },
    { stars: 3, answers: { freq: 'Once a day', overall: 'Fair', text: 'nil' }, at: new Date() },
    { stars: 4, answers: { freq: 'Rarely', overall: 'Good', text: 'Would like more games in the blocklist' }, at: new Date() },
  ], fmt);
  ok(live.dist[5] === 1 && live.dist[4] === 1 && live.dist[3] === 1 && live.responses === 3, 'live: star distribution from surveys');
  ok(live.reviews.length === 2 && live.reviews[0].at === '1 Jan 2026', 'live: empty-ish text hidden, date label applied');
  ok(live.questions.find((q) => q.q.startsWith('How frequently')).counts['Once a day'] === 2, 'live: per-question counts');
  ok(!live.questions.some((q) => /overall.*rate/i.test(q.q)), 'live: overall rating question left out of the cards');
  const merged = MS.merge(api.summarize([['Timestamp', 'Overall, how would you rate your experience with this app?', 'Any suggestions or feedback?'], ['1/1', 'Excellent', 'Nice app for us'], ['1/2', 'Poor', 'Too many popups']], true), live);
  ok(merged.dist[5] === 2 && merged.dist[1] === 1 && merged.dist[4] === 1 && merged.dist[3] === 1, 'merge: legacy and live totals add up');
  ok(merged.reviews.length === 4 && merged.reviews[0].text === 'Love the hard lock', 'merge: live reviews listed first');
  ok(MS.merge(null, null).reviews.length === 0 && MS.merge(null, live).dist[5] === 1, 'merge: works with either source missing');

  // survey form page
  let sv = page('survey.html');
  sv.eval(SQ);
  const svInline = [...sv.document.querySelectorAll('script:not([src]):not([type])')].map((x) => x.textContent).filter((c) => c.includes('survey:'));
  svInline.forEach((code) => { try { sv.eval(code); } catch (_) {} });
  ok(sv.document.querySelectorAll('#svForm fieldset').length === 10, 'survey: 10 choice questions rendered');
  ok(sv.document.querySelectorAll('#svForm textarea').length === 1, 'survey: free-text feedback box rendered');
  ok(sv.document.querySelectorAll('#svForm input[type=radio]').length >= 30, 'survey: every choice is a radio');
  ok(sv.document.getElementById('svSend').disabled, 'survey: submit disabled until signed in');

  // ratings page carries the live hook, rules carry the surveys collection
  const rat = fs.readFileSync(path.join(__dirname, 'ratings.html'), 'utf8');
  ok(/collection\(db,'surveys'\)/.test(rat), 'ratings: listens to surveys live');
  const rules = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
  ok(/match \/surveys\/\{uid\}/.test(rules) && /neu\(\)\.at == request\.time/.test(rules), 'rules: surveys collection, owner-only write');
  const vj = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  ok(vj.redirects.some((r) => r.source === '/survey' && r.destination === '/survey.html'), '/survey now points at the on-site form');
  ok(vj.redirects.some((r) => r.source === '/survey-form' && /docs\.google\.com/.test(r.destination)), 'old Google Form kept at /survey-form');

  console.log(`\n  ${pass} passed, ${fail} failed   (survey + ratings)`);
  process.exit(fail ? 1 : 0);
})();

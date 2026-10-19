/* download.html picker: flow, routing, central config, nav rename. jsdom, no network. */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'download.html'), 'utf8');

function load(hash) {
  const dom = new JSDOM(html, { url: 'file:///download.html' + (hash || ''), runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) { w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {}; w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} }); } });
  return dom;
}
const tick = () => new Promise(r => setTimeout(r, 20));
const go = async (w, h) => { w.location.hash = h; await tick(); };
const shown = d => [...d.querySelectorAll('#apps .app.show')].map(a => a.dataset.os).sort().join(',');
const choices = d => [...d.querySelectorAll('#pkChoices li')];
const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

(async () => {
  /* ---- static: nav, config, links ---- */
  const cfg = JSON.parse(html.match(/<script type="application\/json" id="dlcfg">([\s\S]*?)<\/script>/)[1]);
  const keys = Object.keys(cfg);
  ok('config has 10 destinations', keys.length === 10);
  const dom0 = load(); const d0 = dom0.window.document; await tick();
  const staticDom = new JSDOM(html); // no scripts: the no-JS fallback hrefs
  keys.forEach(k => {
    const els = [...staticDom.window.document.querySelectorAll('[data-dl="' + k + '"]')];
    ok('data-dl ' + k + ' present', els.length >= 1);
    ok('fallback href equals config for ' + k, els.every(a => a.getAttribute('href') === cfg[k].url));
  });
  ok('every config url is relative or https', keys.every(k => /^(https:\/\/|maatram-|\/\?)/.test(cfg[k].url)));
  ok('no href="#" placeholder on a download button', ![...staticDom.window.document.querySelectorAll('a.dl')].some(a => a.getAttribute('href') === '#'));
  ok('local files in config exist', keys.filter(k => !/^https?:|^\//.test(cfg[k].url)).every(k => fs.existsSync(path.join(root, cfg[k].url))));
  ok('no [[NEEDS: markers', !html.includes('[[NEEDS:'));

  const navPages = fs.readdirSync(root).filter(f => f.endsWith('.html')).concat(fs.readdirSync(path.join(root, 'wellness')).map(f => 'wellness/' + f).filter(f => f.endsWith('.html')));
  const bad = navPages.filter(f => /class="mn-link[^"]*" href="(\.\.\/)?download\.html">Get the app</.test(fs.readFileSync(path.join(root, f), 'utf8')));
  ok('no page still says Get the app in the nav', bad.length === 0);
  const withNav = navPages.filter(f => /class="mn-link[^"]*" href="(\.\.\/)?download\.html">Download</.test(fs.readFileSync(path.join(root, f), 'utf8')));
  ok('nav says Download on ' + withNav.length + ' pages', withNav.length >= 17);

  /* ---- level 0: triangle ---- */
  const w0 = dom0.window;
  const nodes = [...d0.querySelectorAll('.pk-n')];
  ok('three triangle nodes', nodes.length === 3);
  ok('nodes are real links to #desktop #phone #browser', nodes.map(n => n.getAttribute('href')).join() === '#desktop,#phone,#browser');
  ok('nodes have visible text labels', nodes.every(n => n.textContent.trim().length > 2));
  ok('brand wordmark present', d0.querySelector('.pk-brand').textContent === 'MAATRAM');
  ok('pk-on active (JS ran)', w0.document.documentElement.classList.contains('pk-on'));
  ok('panel hidden at start', d0.getElementById('pkPanel').hidden === true);
  ok('no card shown at start', shown(d0) === '');

  /* ---- level 1 + 2: every choice ---- */
  const flows = [
    ['#desktop', ['Windows', 'macOS', 'Linux']],
    ['#phone', ['Android', 'iOS']],
    ['#browser', ['Chrome', 'Edge', 'Brave', 'Opera', 'Firefox', 'Safari']]
  ];
  for (const [h, names] of flows) {
    await go(w0, h);
    ok(h + ' opens panel', d0.getElementById('pkPanel').hidden === false);
    ok(h + ' lists ' + names.join('/'), choices(d0).map(li => li.textContent.replace(/Web app|Coming soon/, '').trim()).join() === names.join());
    ok(h + ' selected node marked', d0.querySelector('.pk-n[aria-current="true"]').dataset.n === h.slice(1));
    ok(h + ' focus moves to panel heading', d0.activeElement === d0.getElementById('pkTitle'));
    ok(h + ' no card yet', shown(d0) === '');
  }
  const dest = {
    '#desktop/windows': 'windows', '#desktop/mac': 'mac', '#desktop/linux': 'linux',
    '#phone/android': 'android,android-full', '#phone/ios': 'ios',
    '#browser/chrome': 'desktop', '#browser/edge': 'desktop', '#browser/brave': 'desktop', '#browser/opera': 'desktop'
  };
  for (const [h, want] of Object.entries(dest)) {
    await go(w0, h);
    ok(h + ' shows card ' + want, shown(d0) === want.split(',').sort().join(','));
    const a = d0.querySelector('#pkChoices a[aria-current="true"]');
    ok(h + ' current tile marked', !!a && a.getAttribute('href') === h);
    ok(h + ' Start over visible', d0.getElementById('pkReset').hidden === false);
  }
  const winCard = d0.querySelector('.app[data-os="windows"] a.dl');
  ok('windows card links to the verified .exe release', winCard.getAttribute('href') === cfg.windows.url);

  /* ---- unavailable browsers ---- */
  await go(w0, '#browser');
  const soon = [...d0.querySelectorAll('#pkChoices .pk-c.soon')];
  ok('Firefox and Safari are Coming soon, not links', soon.length === 2 && soon.every(s => s.tagName === 'SPAN' && s.getAttribute('aria-disabled') === 'true' && /Coming soon/.test(s.textContent)));
  ok('browser note explains Bing', /Bing is a search engine/.test(d0.getElementById('pkNote').textContent));
  await go(w0, '#browser/firefox');
  ok('direct #browser/firefox falls back to the browser list', shown(d0) === '' && d0.getElementById('pkTitle').textContent === 'Browser');

  /* ---- back, reset, escape, unknown hash ---- */
  await go(w0, '#desktop/linux');
  ok('Back from OS goes to family', d0.getElementById('pkBack').getAttribute('href') === '#desktop');
  await go(w0, '#desktop');
  ok('Back from family goes to triangle', d0.getElementById('pkBack').getAttribute('href') === '#');
  await go(w0, '#phone/ios');
  key(w0, d0.querySelector('#pkChoices a'), 'Escape'); await tick();
  ok('Escape on a card goes up one level', w0.location.hash === '#phone' && shown(d0) === '');
  key(w0, d0.querySelector('#pkChoices a'), 'Escape'); await tick();
  ok('Escape on a family returns to the triangle', d0.getElementById('pkPanel').hidden === true);
  await go(w0, '#phone/android');
  await go(w0, '#verify');
  ok('non-route anchor (#verify) keeps the current card', shown(d0) === 'android,android-full');
  await go(w0, '#nonsense/x/y'); await go(w0, '');
  ok('empty hash resets to the triangle', d0.getElementById('pkPanel').hidden === true && shown(d0) === '');

  /* ---- keyboard on triangle ---- */
  key(w0, nodes[0], 'ArrowRight');
  ok('ArrowRight moves focus to next node', d0.activeElement === nodes[1]);
  key(w0, nodes[1], 'ArrowLeft'); key(w0, nodes[0], 'ArrowLeft');
  ok('ArrowLeft wraps to last node', d0.activeElement === nodes[2]);

  /* ---- deep link on load ---- */
  const deep = load('#desktop/mac'); await tick();
  ok('deep link #desktop/mac shows the Mac card on load', shown(deep.window.document) === 'mac');
  ok('initial load does not steal focus', deep.window.document.activeElement !== deep.window.document.getElementById('pkTitle'));

  /* ---- central config drives hrefs; soon status swaps to Coming soon ---- */
  const edited = html.replace('"windows":        {"url"', '"windows":        {"status":"soon","url"');
  const e = new JSDOM(edited, { url: 'file:///download.html', runScripts: 'dangerously', pretendToBeVisual: true });
  await tick();
  const ed = e.window.document;
  ok('status soon replaces the Windows button', !ed.querySelector('#dlBtnWin') && /Coming soon/.test(ed.querySelector('.app[data-os="windows"] .pk-soon').textContent));
  const moved = html.replace(cfg.mac.url, 'https://example.invalid/mac.dmg').replace(/(id="dlcfg">[\s\S]*?)("mac":\s*\{"url":")[^"]*/, '$1$2https://example.invalid/new.dmg');
  const m = new JSDOM(moved, { url: 'file:///download.html', runScripts: 'dangerously', pretendToBeVisual: true });
  await tick();
  ok('editing only the config changes the button href', m.window.document.getElementById('dlBtnMac').getAttribute('href') === 'https://example.invalid/new.dmg');

  /* ---- a11y basics ---- */
  const dd = d0;
  ok('all icons are aria-hidden or decorative', [...dd.querySelectorAll('.pk-n svg,.pk-svg')].every(s => s.getAttribute('aria-hidden') === 'true'));
  ok('browser tile images have empty alt', [...dd.querySelectorAll('#pkChoices img')].every(i => i.getAttribute('alt') === ''));
  ok('panel heading is focusable', dd.getElementById('pkTitle').getAttribute('tabindex') === '-1');
  ok('reduced-motion rule stops the edge flow', /prefers-reduced-motion:reduce\)\{\.pk-svg \.flow\{animation:none\}/.test(html));
  ok('picker group has an accessible name', dd.getElementById('picker').getAttribute('aria-label') === 'Platforms');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

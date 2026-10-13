/* Maatram survey: weekly "rate us" pop-up, plus a copy/share box
   that fills any element with [data-survey-share]. Short link /survey redirects to the
   Google Form (vercel.json). Loaded with defer on every page. */
(function () {
  var URL = 'https://maatram.co.in/survey', KEY = 'maatram_survey_seen';
  var MSG = 'Maatram helps students cut screen time. Rate it here: ' + URL;

  var css = document.createElement('style');
  css.textContent =
    '.sv-box{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.sv-box input{flex:1 1 180px;min-width:0;padding:11px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.18);' +
    'background:rgba(255,255,255,.05);color:#eafff6;font:600 14px Inter,system-ui,sans-serif}' +
    '.sv-btn{min-height:44px;padding:0 18px;border-radius:100px;border:1px solid rgba(47,227,143,.45);background:transparent;' +
    'color:#eafff6;font:700 12px Inter,system-ui,sans-serif;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}' +
    '.sv-btn:hover{background:rgba(47,227,143,.1)}' +
    '.sv-main{border:none;color:#04120f;background:linear-gradient(90deg,#2fe38f,#37b6ff)}' +
    'html.minimal .sv-main{background:#ECEFEE;color:#0B0C0B}html.minimal .sv-btn{border-color:rgba(255,255,255,.22)}' +
    '#svPop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.55)}' +
    '#svPop .sv-card{width:100%;max-width:440px;padding:26px 24px;border-radius:24px;border:1px solid rgba(255,255,255,.14);' +
    'background:rgba(6,14,13,.96);color:#eafff6;font-family:Inter,system-ui,sans-serif;box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}' +
    '#svPop h2{margin:0 0 6px;font:800 22px Sora,Inter,sans-serif}#svPop p{margin:0 0 18px;color:rgba(214,238,229,.7);font-size:14px;line-height:1.55}' +
    '#svPop .sv-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}#svPop small{display:block;margin:18px 0 8px;color:rgba(214,238,229,.6)}' +
    '@media(prefers-reduced-motion:no-preference){#svPop .sv-card{animation:svIn .35s ease-out}}' +
    '@keyframes svIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}';
  document.head.appendChild(css);

  function box() {
    var d = document.createElement('div');
    d.className = 'sv-box';
    d.innerHTML = '<input readonly aria-label="Survey link" value="' + URL + '">' +
      '<button type="button" class="sv-btn" data-a="copy">Copy</button>' +
      '<a class="sv-btn" href="mailto:?subject=' + encodeURIComponent('Try Maatram and rate it') + '&body=' + encodeURIComponent(MSG) + '">Mail</a>' +
      '<a class="sv-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(MSG) + '">WhatsApp</a>' +
      (navigator.share ? '<button type="button" class="sv-btn" data-a="share">More</button>' : '');
    d.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'share') { navigator.share({ title: 'Maatram survey', text: MSG, url: URL }).catch(function () {}); return; }
      var inp = d.querySelector('input'), done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(URL).then(done, function () { inp.select(); });
      else { inp.select(); try { document.execCommand('copy'); done(); } catch (_) {} }
    });
    d.querySelector('input').addEventListener('focus', function () { this.select(); });
    return d;
  }

  function popup() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (_) {}
    var p = document.createElement('div');
    p.id = 'svPop';
    p.innerHTML = '<div class="sv-card" role="dialog" aria-modal="true" aria-labelledby="svT">' +
      '<h2 id="svT">Enjoying Maatram?</h2><p>Give us a star rating. It shows up live on the Ratings page.</p>' +
      '<div class="sv-row" style="margin-top:0"><a class="sv-btn sv-main" href="/ratings.html#rate" data-close>Rate Maatram</a>' +
      '<a class="sv-btn" href="' + URL + '" target="_blank" rel="noopener" data-close>Take the survey</a></div>' +
      '<small>Or send the link to a friend</small></div>';
    p.querySelector('small').after(box());
    var row = document.createElement('div'); row.className = 'sv-row';
    row.innerHTML = '<button type="button" class="sv-btn" data-close>Maybe later</button>';
    p.querySelector('.sv-card').appendChild(row);
    function close() { p.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); }
    p.addEventListener('click', function (e) { if (e.target === p || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(p);
    p.querySelector('.sv-main').focus();
  }

  document.querySelectorAll('[data-survey-share]').forEach(function (el) { el.appendChild(box()); });

  var seen = true;   // shown at most once a week
  try { seen = Date.now() - (+localStorage.getItem(KEY) || 0) < 7 * 864e5; } catch (_) {}
  // Show after a few seconds on the page, at most once a week. Never on admin/login.
  if (!seen && !/\/(admin|login|auth-bridge)\.html$/.test(location.pathname)) setTimeout(popup, 8000);
})();

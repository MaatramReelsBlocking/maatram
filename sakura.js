/* Maatram Sakura — the tree that blooms while Hard Lock runs, the leaves it drops when you try a
   locked app, the garden of finished locks, and a sky tint that follows the real time of day.
   Same art and rules as the Maatram Hard Lock Android app (SakuraArt.kt / Garden.kt).
   Rule: any finished lock grows a blooming tree; a 90-minute lock grows a full tree.
   Exposes window.MaatramSakura = { show, growth, target, isFull, stage, garden, hourNow }. Garden lives in this browser. */
(function () {
  'use strict';
  var MAX_LEAVES = 12, FULL = 90, BLOOM = 0.8;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function hourNow() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }

  /* how far a lock's tree grows: a full tree only for 90+ minute locks */
  function target(minutes) { return minutes >= FULL ? 1 : BLOOM; }
  function isFull(minutes) { return minutes >= FULL; }
  function growth(progress, minutes) { return clamp(progress) * target(minutes); }
  function stage(g) { return g < 0.12 ? 'Seed planted' : g < 0.35 ? 'Sprouting' : g < 0.6 ? 'Growing' : g < 0.95 ? 'Blooming' : 'Full tree'; }

  /* sky tint for the hour: deep blue at night, warm gold at sunrise and sunset, none by day */
  function tint(hour) {
    var h = ((hour % 24) + 24) % 24;
    var night = h < 5 || h > 20.3 ? 1 : h < 6.5 ? (6.5 - h) / 1.5 : h > 18.8 ? (h - 18.8) / 1.5 : 0;
    var warm = Math.max(0, 1 - Math.abs(h - 6.6) / 1.2, 1 - Math.abs(h - 18.1) / 1.3);
    return night > 0.01 ? 'rgba(11,20,64,' + (clamp(night) * 0.5).toFixed(3) + ')' : 'rgba(255,138,61,' + (clamp(warm) * 0.22).toFixed(3) + ')';
  }

  /* Paints the scene into el: the animated clip coloured for growth g (0 = bare and grey, 0.8 = a
     blooming tree, 1 = the full tree), the hour's tint and fallen leaves. A still frame when
     Performance mode or reduced motion is on. */
  var LEAF = '<svg viewBox="-6 -12 12 13" aria-hidden="true"><path d="M0 0Q3.3-2.7 0-6-3.3-2.7 0 0Z"/></svg>';
  function show(el, g, leaves, hour) {
    if (!el) return;
    var still = window.MAATRAM_PERF === true || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var img = el.querySelector('img.sk-clip');
    if (!img) {
      el.innerHTML = '<img class="sk-clip" alt="" decoding="async"><div class="sk-tint"></div><div class="sk-fallen"></div>';
      img = el.querySelector('img.sk-clip');
    }
    var src = still ? '/sakura-still.jpg' : '/sakura-scene.webp';
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    g = clamp(g || 0);
    img.style.filter = 'saturate(' + (0.1 + 0.9 * g).toFixed(3) + ') brightness(' + (0.5 + 0.5 * g).toFixed(3) + ')';
    el.querySelector('.sk-tint').style.background = tint(hour == null ? hourNow() : hour);
    var n = Math.max(0, Math.min(MAX_LEAVES, leaves | 0)), box = el.querySelector('.sk-fallen');
    if (box.childElementCount !== n) {
      var html = '';
      for (var k = 0; k < n; k++)
        html += '<i style="left:' + (18 + (k * 41) % 64) + '%;top:' + (86 + (k * 23) % 9) + '%;transform:rotate(' + (70 + (k % 3) * 30) + 'deg);color:' + (k % 2 ? '#C9963E' : '#A8722E') + '">' + LEAF + '</i>';
      box.innerHTML = html;
    }
  }

  /* ---- garden (same rules as the app) ---- */
  var KEY = 'maatram_sakura_v1';
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && Array.isArray(o.plants)) return o; } catch (_) {} return { cur: null, plants: [] }; }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (_) {} }
  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  var last = { app: '', at: 0 };
  var garden = {
    MAX_LEAVES: MAX_LEAVES,
    begin: function (end, totalSec) {
      garden.settle(); var o = load();
      if (o.cur && o.cur.end === end) return;   // same lock restored after a refresh
      o.cur = { start: end - totalSec * 1000, end: end, min: Math.round(totalSec / 60), leaves: 0, tries: {} }; save(o);
    },
    current: function () { return load().cur; },
    tempted: function (app) {
      var now = Date.now(); if (app === last.app && now - last.at < 3000) return; last = { app: app, at: now };
      var o = load(); if (!o.cur || now >= o.cur.end) return;
      o.cur.leaves = Math.min(MAX_LEAVES, o.cur.leaves + 1); o.cur.tries[app] = (o.cur.tries[app] || 0) + 1; save(o);
    },
    settle: function () {
      var o = load(); if (!o.cur || Date.now() + 5000 < o.cur.end) return false;
      o.plants.push([o.cur.end, o.cur.min, o.cur.leaves]); o.plants = o.plants.slice(-400); o.cur = null; save(o); return true;
    },
    plants: function () { return load().plants.map(function (a) { return { end: a[0], minutes: a[1], leaves: a[2] }; }); },
    streak: function (plants) {
      var days = {}; plants.forEach(function (p) { days[dayKey(p.end)] = 1; });
      var d = new Date(); if (!days[dayKey(+d)]) d.setDate(d.getDate() - 1);
      var n = 0; while (days[dayKey(+d)]) { n++; d.setDate(d.getDate() - 1); } return n;
    },
    /* longest lock finished each day (minutes); 90+ = a full tree */
    lastDaysBest: function (plants, n) {
      n = n || 28; var by = {}; plants.forEach(function (p) { var k = dayKey(p.end); by[k] = Math.max(by[k] || 0, p.minutes); });
      var d = new Date(); d.setDate(d.getDate() - (n - 1)); var out = [];
      for (var i = 0; i < n; i++) { out.push(by[dayKey(+d)] || 0); d.setDate(d.getDate() + 1); } return out;
    },
    lastDays: function (plants, n) {
      n = n || 28; var by = {}; plants.forEach(function (p) { var k = dayKey(p.end); by[k] = (by[k] || 0) + p.minutes; });
      var d = new Date(); d.setDate(d.getDate() - (n - 1)); var out = [];
      for (var i = 0; i < n; i++) { out.push(by[dayKey(+d)] || 0); d.setDate(d.getDate() + 1); } return out;
    }
  };
  window.MaatramSakura = { show: show, growth: growth, target: target, isFull: isFull, stage: stage, garden: garden, hourNow: hourNow, FULL_MINUTES: FULL };
})();

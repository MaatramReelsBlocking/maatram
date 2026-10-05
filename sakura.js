/* Maatram Sakura — the tree that grows while Hard Lock runs, the leaves it drops when you
   try a locked app, the garden of finished locks, and a sky that follows the real time of day.
   Same art and rules as the Maatram Hard Lock Android app (PlantArt.kt / Garden.kt).
   Exposes window.MaatramSakura = { draw, garden }. Garden lives in this browser (localStorage). */
(function () {
  'use strict';
  var MAX_LEAVES = 12, DEPTH = 5;

  /* ---- fixed-seed branching tree (same algorithm as the app; the random source differs, so branch angles vary slightly) ---- */
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var segs = [], tips = [];
  (function grow(x, y, ang, len, d) {
    var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    segs.push([x, y, ex, ey, d]);
    if (d >= 2) tips.push([ex, ey, tips.length, d, x, y]);
    if (d === DEPTH) return;
    var n = d === 0 ? 2 : (rnd() < 0.35 ? 3 : 2);
    for (var k = 0; k < n; k++) {
      var spread = n === 2 ? (k === 0 ? -0.48 : 0.48) : (k - 1) * 0.55;
      grow(ex, ey, ang + spread + (rnd() - 0.5) * 0.35, len * (0.7 + rnd() * 0.1), d + 1);
    }
  })(0, 0, -Math.PI / 2, 1, 0);
  var minX = 0, maxX = 0, minY = 0;
  segs.forEach(function (s) { minX = Math.min(minX, s[0], s[2]); maxX = Math.max(maxX, s[0], s[2]); minY = Math.min(minY, s[1], s[3]); });

  var SKY = [[0, '#0A0E22', '#1A2140'], [5, '#0F1630', '#2A2F55'], [6.5, '#34406E', '#E89A7C'], [8, '#2F5F86', '#9CC7DA'],
    [16, '#2C5A80', '#9CC7DA'], [18, '#3A2C5C', '#E5876C'], [19.5, '#161A38', '#4A355F'], [24, '#0A0E22', '#1A2140']];
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { a = hex(a); b = hex(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function hourNow() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }

  function leaf(c, x, y, s, rot, color) {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = color;
    c.beginPath(); c.ellipse(0, -s * 0.42, s * 0.45, s * 0.58, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }

  function sky(c, w, h, hour) {
    var hr = ((hour % 24) + 24) % 24, i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= hr) i++;
    var a = SKY[i], b = SKY[i + 1], t = clamp((hr - a[0]) / (b[0] - a[0]));
    var top = mix(a[1], b[1], t), g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, mix(a[2], b[2], t));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var night = hr < 5 || hr > 20 ? 1 : hr < 6.5 ? (6.5 - hr) / 1.5 : hr > 18.5 ? (hr - 18.5) / 1.5 : 0;
    for (var k = 0; night > 0 && k < 18; k++) {
      c.fillStyle = 'rgba(255,255,255,' + (night * (120 + (k * 53) % 120) / 255).toFixed(2) + ')';
      c.beginPath(); c.arc(w * ((k * 61) % 97) / 97, h * ((k * 37) % 50) / 100, h * 0.004 + (k % 3) * h * 0.002, 0, 7); c.fill();
    }
    var day = hr >= 6 && hr <= 18, tt = day ? (hr - 6) / 12 : ((hr + 6) % 24) / 12;
    var sx = w * (0.1 + 0.8 * tt), sy = h * (0.5 - 0.36 * Math.sin(Math.PI * tt)), r = h * 0.05;
    if (day) {
      c.fillStyle = 'rgba(255,231,168,.2)'; c.beginPath(); c.arc(sx, sy, r * 1.9, 0, 7); c.fill();
      c.fillStyle = '#FFE19A'; c.beginPath(); c.arc(sx, sy, r, 0, 7); c.fill();
    } else {
      c.fillStyle = '#EDEBDD'; c.beginPath(); c.arc(sx, sy, r * 0.85, 0, 7); c.fill();
      c.fillStyle = top; c.beginPath(); c.arc(sx + r * 0.35, sy - r * 0.2, r * 0.75, 0, 7); c.fill();
    }
  }

  function fallen(c, w, h, gy, n) {
    for (var k = 0; k < Math.min(n, MAX_LEAVES); k++)
      leaf(c, w * (0.2 + ((k * 41) % 60) / 100), gy + h * (0.03 + ((k * 23) % 9) / 100), h * 0.028, 1.4 + (k % 3) * 0.4, '#C9A55A');
  }

  /* progress 0 = seed .. 1 = full bloom; leaves = dropped by temptation; done = petals drifting */
  function draw(c, w, h, progress, leaves, hour, done) {
    var p = clamp(progress || 0), lost = Math.max(0, Math.min(MAX_LEAVES, leaves | 0));
    if (hour == null) hour = hourNow();
    sky(c, w, h, hour);
    var gy = h * 0.84, g2 = c.createLinearGradient(0, gy, 0, h);
    g2.addColorStop(0, '#22352A'); g2.addColorStop(1, '#101A14');
    c.fillStyle = g2; c.beginPath(); c.moveTo(0, gy + h * 0.03); c.quadraticCurveTo(w / 2, gy - h * 0.05, w, gy + h * 0.03);
    c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
    var cx = w / 2, by = gy - h * 0.01, scale = Math.min(h * 0.66 / -minY, w * 0.9 / (maxX - minX)), g = clamp((p - 0.05) / 0.95);
    if (p < 0.05 || g <= 0) {
      var t = p / 0.05;
      c.fillStyle = '#3A2A20'; c.beginPath(); c.ellipse(cx, by + h * 0.0025, h * 0.09, h * 0.0275, 0, 0, 7); c.fill();
      c.fillStyle = '#9A6B4A'; c.beginPath(); c.ellipse(cx, by - h * 0.025, h * 0.028, h * 0.025, 0, 0, 7); c.fill();
      if (t > 0.5) { c.strokeStyle = '#8CC79A'; c.lineWidth = h * 0.008; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, by - h * 0.045); c.lineTo(cx, by - h * 0.045 - h * 0.04 * (t - 0.5) * 2); c.stroke(); }
      fallen(c, w, h, gy, lost); return;
    }
    c.lineCap = 'round';
    segs.forEach(function (s) {
      var local = clamp((g - s[4] * 0.13) / 0.22); if (local <= 0) return;
      c.strokeStyle = s[4] === 0 && g < 0.25 ? '#7FB08A' : '#6A4A3A';
      c.lineWidth = Math.max(1.2, scale * 0.09 * Math.pow(0.68, s[4]) * (0.35 + 0.65 * g));
      c.beginPath(); c.moveTo(cx + s[0] * scale, by + s[1] * scale);
      c.lineTo(cx + (s[0] + (s[2] - s[0]) * local) * scale, by + (s[1] + (s[3] - s[1]) * local) * scale); c.stroke();
    });
    if (g < 0.3) {
      var top = segs[0], l2 = clamp(g / 0.22), tx = cx + top[2] * scale * l2, ty = by + top[3] * scale * l2, ss = h * 0.035 * (0.4 + l2);
      leaf(c, tx - ss * 0.6, ty, ss, -0.6, '#8CC79A'); leaf(c, tx + ss * 0.6, ty, ss, 0.6, '#8CC79A');
    }
    var r = h * 0.03;
    tips.forEach(function (tp) {
      var i = tp[2]; if ((i * 7) % MAX_LEAVES < lost) return;
      var tl = clamp((g - tp[3] * 0.13) / 0.22);   // leaves ride the tip of the growing twig
      if (!(g > 0.3 + (i % 7) * 0.03) || tl < 0.35) return;
      var x = cx + (tp[4] + (tp[0] - tp[4]) * tl) * scale, y = by + (tp[5] + (tp[1] - tp[5]) * tl) * scale;
      leaf(c, x, y, r * 1.1, ((i % 5) - 2) * 0.5, '#6FA57F');
      if (p >= 0.6 + ((i * 37) % 100) / 100 * 0.38 || p >= 1) {
        var br = r * (0.75 + ((i * 13) % 10) / 25);
        c.fillStyle = i % 3 === 0 ? '#F19BB5' : '#F6BCCD'; c.beginPath(); c.arc(x + br * 0.3, y - br * 0.2, br, 0, 7); c.fill();
        c.fillStyle = '#FFE6EE'; c.beginPath(); c.arc(x + br * 0.3, y - br * 0.2, br * 0.32, 0, 7); c.fill();
      }
    });
    fallen(c, w, h, gy, lost);
    if (done) for (var k = 0; k < 7; k++) {
      var px = w * (0.15 + ((k * 29) % 70) / 100), py = h * (0.25 + ((k * 17) % 50) / 100);
      c.save(); c.translate(px, py); c.rotate(k * 0.7); c.fillStyle = 'rgba(246,188,205,.8)';
      c.beginPath(); c.ellipse(0, 0, r * 0.5, r * 0.3, 0, 0, 7); c.fill(); c.restore();
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
    lastDays: function (plants, n) {
      n = n || 28; var by = {}; plants.forEach(function (p) { var k = dayKey(p.end); by[k] = (by[k] || 0) + p.minutes; });
      var d = new Date(); d.setDate(d.getDate() - (n - 1)); var out = [];
      for (var i = 0; i < n; i++) { out.push(by[dayKey(+d)] || 0); d.setDate(d.getDate() + 1); } return out;
    }
  };
  window.MaatramSakura = { draw: draw, garden: garden, hourNow: hourNow };
})();

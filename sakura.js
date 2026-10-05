/* Maatram Sakura — the tree that grows while Hard Lock runs, the leaves it drops when you
   try a locked app, the garden of finished locks, and a sky that follows the real time of day.
   Same art and rules as the Maatram Hard Lock Android app (PlantArt.kt / Garden.kt): both use the
   same seeded random source, so the tree, mountains and clouds are identical on web and phone.
   Exposes window.MaatramSakura = { draw, live, petals, garden, hourNow }. Garden lives in this browser. */
(function () {
  'use strict';
  var MAX_LEAVES = 12, DEPTH = 6, PI = Math.PI;

  /* Park-Miller random, identical in PlantArt.kt */
  function rng(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function hourNow() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }

  /* ---- the tree: curved, tapering limbs from a fixed seed ---- */
  var segs = [], tips = [];
  (function () {
    var R = rng(3);
    (function grow(x, y, ang, len, rad, d) {
      var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, bend = (R() - 0.5) * len * 0.22;
      var mx = (x + ex) / 2 - Math.sin(ang) * bend, my = (y + ey) / 2 + Math.cos(ang) * bend;
      segs.push([x, y, mx, my, ex, ey, rad, rad * 0.7, d]);
      if (d >= 3) tips.push([ex, ey, tips.length, d, x, y, R()]);
      if (d === DEPTH) return;
      var n = d === 0 ? 3 : R() < 0.45 ? 3 : 2;
      for (var k = 0; k < n; k++) {
        var sp = n === 2 ? (k === 0 ? -1 : 1) * (0.3 + R() * 0.22) : (k - 1) * (d === 0 ? 0.62 + R() * 0.14 : 0.42 + R() * 0.14);
        var a = ang + sp + (R() - 0.5) * 0.28;
        a += (-PI / 2 - a) * 0.06;                       // limbs reach up and out into a rounded crown
        grow(ex, ey, a, len * (d === 0 ? 0.78 : 0.74 + R() * 0.1), rad * (n === 3 ? 0.62 : 0.7), d + 1);
      }
    })(0, 0, -PI / 2 + 0.04, 0.72, 0.16, 0);
  })();
  var minX = 0, maxX = 0, minY = 0;
  segs.forEach(function (s) { minX = Math.min(minX, s[0], s[4]); maxX = Math.max(maxX, s[0], s[4]); minY = Math.min(minY, s[1], s[5]); });

  /* ---- colour helpers ---- */
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function toHex(a) { return '#' + a.map(function (v) { v = Math.round(v); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = hex(a), y = hex(b); return toHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function rgba(c, al) { var x = hex(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + al.toFixed(3) + ')'; }

  /* sky keyframes: hour, top, middle, horizon */
  var SKY = [
    [0, '#070A1A', '#101634', '#1E2448'], [4.8, '#0A0F26', '#161C40', '#2A2C55'], [5.8, '#1E2452', '#5A4A7A', '#E0907A'],
    [6.8, '#3E6EA8', '#E9A88C', '#FFD6A0'], [8, '#3D7BC0', '#7FB6E0', '#CFE6F2'], [15.5, '#2F6FB8', '#7AB3E2', '#D2E9F4'],
    [17.3, '#4A6FA8', '#E9A97E', '#FFD08A'], [18.3, '#3B3770', '#C7697A', '#FF9E6B'], [19.3, '#161A40', '#3E2F63', '#8A4D6E'],
    [20.5, '#090D22', '#121838', '#232A52'], [24, '#070A1A', '#101634', '#1E2448']];

  /* everything the scene needs to know about the light at this hour */
  function light(hour) {
    var hr = ((hour % 24) + 24) % 24, i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= hr) i++;
    var a = SKY[i], b = SKY[i + 1], t = clamp((hr - a[0]) / (b[0] - a[0]));
    var night = hr < 5 || hr > 20.3 ? 1 : hr < 6.5 ? (6.5 - hr) / 1.5 : hr > 18.8 ? (hr - 18.8) / 1.5 : 0;
    var warm = Math.max(0, 1 - Math.abs(hr - 6.6) / 1.2, 1 - Math.abs(hr - 18.1) / 1.3);
    var day = hr >= 5.6 && hr <= 18.9, tt = day ? (hr - 5.6) / 13.3 : ((hr + 5.1) % 24) / 10.7;
    return { hr: hr, top: mix(a[1], b[1], t), mid: mix(a[2], b[2], t), hor: mix(a[3], b[3], t),
      night: clamp(night), warm: clamp(warm), day: day, tt: tt };
  }
  /* tint scene colours: cool and dark at night, golden at sunrise/sunset */
  function tint(L, c) { return mix(mix(c, '#FF9F7A', L.warm * 0.18), '#141A36', L.night * 0.6); }
  function tintBloom(L, c) { return mix(mix(c, '#FF9F7A', L.warm * 0.14), '#5B5F9A', L.night * 0.42); }

  function disc(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  function glow(c, x, y, r, col, al) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, al)); g.addColorStop(1, rgba(col, 0));
    disc(c, x, y, r, g);
  }
  function puff(c, x, y, r, col, al) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, al)); g.addColorStop(0.6, rgba(col, al * 0.85)); g.addColorStop(1, rgba(col, 0));
    disc(c, x, y, r, g);
  }
  function ridge(c, w, h, seed, base, amp, col) {
    var R = rng(seed), p1 = R() * 6, p2 = R() * 6, p3 = R() * 6;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
    for (var k = 0; k <= 48; k++) {
      var x = k / 48, y = base - amp * (0.55 * Math.sin(x * 5.1 + p1) + 0.3 * Math.sin(x * 11.3 + p2) + 0.15 * Math.sin(x * 23.7 + p3));
      c.lineTo(x * w, y * h);
    }
    c.lineTo(w, h); c.closePath(); c.fill();
  }
  function band(c, w, h, y0, y1, col, al) {
    var g = c.createLinearGradient(0, y0 * h, 0, y1 * h);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, al)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(0, y0 * h, w, (y1 - y0) * h);
  }
  function leafShape(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.55, -s * 0.45, 0, -s); c.quadraticCurveTo(-s * 0.55, -s * 0.45, 0, 0); c.fill();
    c.restore();
  }
  function petal(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col;
    c.beginPath(); c.moveTo(0, s * 0.5); c.quadraticCurveTo(s * 0.62, 0, s * 0.18, -s * 0.5); c.lineTo(0, -s * 0.36);
    c.lineTo(-s * 0.18, -s * 0.5); c.quadraticCurveTo(-s * 0.62, 0, 0, s * 0.5); c.fill();
    c.restore();
  }
  function flower(c, x, y, r, col, rot) {
    c.fillStyle = col;
    for (var k = 0; k < 5; k++) {
      var a = rot + k * 1.2566;
      c.beginPath(); c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, 0, PI * 2); c.fill();
    }
    disc(c, x, y, r * 0.24, '#D9577F'); disc(c, x, y, r * 0.11, '#FFE6A6');
  }

  /* ---- sky, sun/moon, clouds, mountains, mist ---- */
  function sky(c, w, h, L) {
    var g = c.createLinearGradient(0, 0, 0, h * 0.8);
    g.addColorStop(0, L.top); g.addColorStop(0.55, L.mid); g.addColorStop(1, L.hor);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (L.night > 0) {
      var R = rng(7);
      for (var k = 0; k < 70; k++) {
        var x = R() * w, y = R() * h * 0.62, s = (0.4 + R() * 1.1) * h * 0.0032, al = L.night * (0.35 + R() * 0.65) * (1 - y / (h * 0.7));
        disc(c, x, y, s, 'rgba(255,255,255,' + al.toFixed(3) + ')');
        if (s > h * 0.0042) glow(c, x, y, s * 5, '#BFD4FF', al * 0.25);
      }
    }
    var sx = w * (0.08 + 0.84 * L.tt), sy = h * (0.66 - 0.52 * Math.sin(PI * clamp(L.tt))), r = h * 0.045;
    if (L.day) {
      var near = clamp(1 - Math.sin(PI * clamp(L.tt)) * 1.6);       // low sun: bigger, warmer
      glow(c, sx, sy, r * (7 + near * 4), mix('#FFE7B0', '#FF9E62', near), 0.42);
      glow(c, sx, sy, r * 2.2, '#FFF4D6', 0.55);
      var sg = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      sg.addColorStop(0, '#FFFDF2'); sg.addColorStop(1, mix('#FFE3A0', '#FF9A5A', near));
      disc(c, sx, sy, r, sg);
    } else {
      glow(c, sx, sy, r * 6, '#AFC4F2', 0.22);
      var mg = c.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 0, sx, sy, r * 0.9);
      mg.addColorStop(0, '#FFFDF0'); mg.addColorStop(1, '#D9D6C8');
      disc(c, sx, sy, r * 0.9, mg);
      disc(c, sx + r * 0.25, sy + r * 0.12, r * 0.18, 'rgba(150,145,130,0.35)');
      disc(c, sx - r * 0.3, sy + r * 0.32, r * 0.11, 'rgba(150,145,130,0.3)');
    }
    /* clouds: soft puffs, lit from the sun's side */
    var CL = [[0.16, 0.15, 0.11], [0.6, 0.09, 0.15], [0.88, 0.25, 0.08], [0.4, 0.3, 0.07]];
    var ccol = L.night > 0.5 ? mix('#3C4470', '#262C52', L.night) : mix('#FFFFFF', '#FFC2A6', L.warm);
    var cal = L.night > 0.5 ? 0.45 : 0.7 - L.warm * 0.1;
    CL.forEach(function (cl, j) {
      var R = rng(31 + j), cx = cl[0] * w, cy = cl[1] * h, s = cl[2] * w;
      for (var k = 0; k < 7; k++) {
        var ox = (R() - 0.5) * s * 1.6, oy = (R() - 0.5) * s * 0.35, pr = s * (0.35 + R() * 0.35);
        puff(c, cx + ox, cy + oy + pr * 0.22, pr * 1.05, mix(ccol, L.top, 0.4), cal * 0.55);
        puff(c, cx + ox, cy + oy, pr, ccol, cal);
      }
    });
    /* layered mountains fading into haze */
    ridge(c, w, h, 101, 0.7, 0.1, mix(L.hor, mix('#2E3D63', L.top, 0.4), 0.38));
    band(c, w, h, 0.6, 0.8, L.hor, 0.5);
    ridge(c, w, h, 202, 0.77, 0.06, mix(L.hor, '#1F2C3E', 0.62));
    band(c, w, h, 0.72, 0.88, L.hor, 0.55);
  }

  /* ---- ground: grassy hill, blades, fallen petals and leaves ---- */
  function ground(c, w, h, L, bloom, lost) {
    var gy = h * 0.84, g = c.createLinearGradient(0, gy - h * 0.04, 0, h);
    g.addColorStop(0, tint(L, '#6E9A5C')); g.addColorStop(0.35, tint(L, '#3F6B3A')); g.addColorStop(1, tint(L, '#1B2E1A'));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, gy + h * 0.03); c.quadraticCurveTo(w / 2, gy - h * 0.06, w, gy + h * 0.03);
    c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
    var R = rng(404), blade = tint(L, '#2D4F2A'), tipc = tint(L, '#8FBF6E');
    c.lineCap = 'round';
    for (var k = 0; k < 140; k++) {
      var x = R() * w, xf = x / w - 0.5, y = gy + h * 0.03 - h * 0.09 * (0.25 - xf * xf) + R() * h * 0.12, len = h * (0.012 + R() * 0.02);
      c.strokeStyle = R() < 0.3 ? tipc : blade; c.lineWidth = Math.max(1, h * 0.0025);
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len * 0.2, y - len * 0.6, x + (R() - 0.3) * len * 0.6, y - len); c.stroke();
    }
    var n = Math.round(46 * bloom), pc = [tint(L, '#F7C3D3'), tint(L, '#F29BB6'), tint(L, '#FFE4EC')];
    for (var j = 0; j < n; j++) petal(c, w * (0.12 + R() * 0.76), gy + h * (0.015 + R() * 0.13), h * (0.011 + R() * 0.006), R() * 6.28, pc[j % 3]);
    for (var m = 0; m < Math.min(lost, MAX_LEAVES); m++)
      leafShape(c, w * (0.24 + ((m * 41) % 52) / 100), gy + h * (0.04 + ((m * 23) % 9) / 100), h * 0.034, 1.3 + (m % 3) * 0.55, tint(L, m % 2 ? '#B98E3E' : '#9C6E2E'));
  }

  /* one limb: a curved, tapering shape with a sunlit edge, grown to fraction t */
  function limb(c, s, t, sc, cx, by, gw, col, hi, side) {
    var x0 = s[0], y0 = s[1], qx = s[2], qy = s[3], x1 = s[4], y1 = s[5];
    var bx = x0 + (qx - x0) * t, byy = y0 + (qy - y0) * t;            // de Casteljau split at t
    var mx = qx + (x1 - qx) * t, my = qy + (y1 - qy) * t;
    var ex = bx + (mx - bx) * t, ey = byy + (my - byy) * t;
    var r0 = s[6] * gw * sc, r1 = (s[6] + (s[7] - s[6]) * t) * gw * sc, rm = (r0 + r1) / 2;
    function nrm(ax, ay, bx2, by2) { var dx = bx2 - ax, dy = by2 - ay, l = Math.sqrt(dx * dx + dy * dy) || 1; return [-dy / l, dx / l]; }
    var n0 = nrm(x0, y0, bx, byy), n1 = nrm(bx, byy, ex, ey), nm = nrm(x0, y0, ex, ey);
    function P(x, y) { return [cx + x * sc, by + y * sc]; }
    function shape(off, w0, wm, w1) {
      var a = P(x0, y0), b = P(bx, byy), e = P(ex, ey);
      c.beginPath();
      c.moveTo(a[0] + n0[0] * w0 + off, a[1] + n0[1] * w0);
      c.quadraticCurveTo(b[0] + nm[0] * wm + off, b[1] + nm[1] * wm, e[0] + n1[0] * w1 + off, e[1] + n1[1] * w1);
      c.lineTo(e[0] - n1[0] * w1 + off, e[1] - n1[1] * w1);
      c.quadraticCurveTo(b[0] - nm[0] * wm + off, b[1] - nm[1] * wm, a[0] - n0[0] * w0 + off, a[1] - n0[1] * w0);
      c.closePath(); c.fill();
      c.beginPath(); c.arc(e[0] + off, e[1], w1, 0, PI * 2); c.fill();
    }
    c.fillStyle = col; shape(0, r0, rm, r1);
    if (r0 > 1.2) {                                   // round it: shadow side, then the sunlit side
      c.globalAlpha = 0.45; c.fillStyle = '#1E120E'; shape(-side * r0 * 0.5, r0 * 0.45, rm * 0.45, r1 * 0.45);
      c.globalAlpha = 0.75; c.fillStyle = hi; shape(side * r0 * 0.36, r0 * 0.4, rm * 0.4, r1 * 0.4);
      c.globalAlpha = 1;
    }
  }

  /* progress 0 = seed .. 1 = full bloom; leaves = dropped by temptation; done = petals drifting */
  function draw(c, w, h, progress, leaves, hour, done) {
    var p = clamp(progress || 0), lost = Math.max(0, Math.min(MAX_LEAVES, leaves | 0));
    if (hour == null) hour = hourNow();
    var L = light(hour), bloom = done || p >= 1 ? 1 : clamp((p - 0.55) / 0.45);
    c.save();
    sky(c, w, h, L);
    ground(c, w, h, L, bloom, lost);
    var gy = h * 0.84, cx = w / 2, by = gy - h * 0.012;
    var sc = Math.min(h * 0.6 / -minY, w * 0.8 / (maxX - minX)), g = clamp((p - 0.05) / 0.95);
    var side = L.tt < 0.5 ? -1 : 1, bark = tint(L, '#3E2A24'), barkHi = tint(L, '#7A5644');
    var sh = c.createRadialGradient(cx, by + h * 0.01, 0, cx, by + h * 0.01, w * 0.32 * Math.max(0.15, g));
    sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh; c.save(); c.translate(cx, by + h * 0.01); c.scale(1, 0.18); c.translate(-cx, -(by + h * 0.01));
    c.beginPath(); c.arc(cx, by + h * 0.01, w * 0.32 * Math.max(0.15, g), 0, PI * 2); c.fill(); c.restore();

    if (p < 0.05 || g <= 0) {                     // a seed in a small mound, then a sprout
      var t = p / 0.05;
      c.fillStyle = tint(L, '#4A3326'); c.beginPath(); c.ellipse(cx, by + h * 0.004, h * 0.085, h * 0.026, 0, 0, PI * 2); c.fill();
      c.fillStyle = tint(L, '#A9764E'); c.beginPath(); c.ellipse(cx, by - h * 0.018, h * 0.024, h * 0.02, 0.3, 0, PI * 2); c.fill();
      if (t > 0.5) {
        var sl = h * 0.05 * (t - 0.5) * 2; c.strokeStyle = tint(L, '#7DB26A'); c.lineWidth = h * 0.007; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, by - h * 0.03); c.lineTo(cx, by - h * 0.03 - sl); c.stroke();
        leafShape(c, cx, by - h * 0.03 - sl, h * 0.03 * (t - 0.5) * 2, -0.9, tint(L, '#9BCB78'));
        leafShape(c, cx, by - h * 0.03 - sl, h * 0.03 * (t - 0.5) * 2, 0.9, tint(L, '#8DBF6A'));
      }
      vignette(c, w, h); c.restore(); return;
    }

    var gw = 0.15 + 0.85 * g, open = [], sap = clamp(g / 0.32);
    tips.forEach(function (tp) {
      var i = tp[2]; if ((i * 7) % MAX_LEAVES < lost) return;
      var tl = clamp((g - tp[3] * 0.115) / 0.115);
      if (g <= 0.3 + (i % 7) * 0.025 || tl < 0.4) return;
      var at = 0.55 + tp[6] * 0.4, bt = done || p >= 1 ? 1 : clamp((p - at) / 0.22);
      open.push([cx + (tp[4] + (tp[0] - tp[4]) * tl) * sc, by + (tp[5] + (tp[1] - tp[5]) * tl) * sc, i, bt, tp[6], tl, tp[3]]);
    });
    var cr = h * 0.05, back = tintBloom(L, '#B86A8C'), mid = tintBloom(L, '#E79AB6');
    open.forEach(function (o) {                 // canopy depth behind the limbs
      if (o[3] <= 0) return;
      glow(c, o[0] - cr * 0.3, o[1] - cr * 0.2, cr * 1.35 * (0.5 + o[3] * 0.5), back, 0.5 * o[3]);
    });
    var rr = segs[0][6] * gw * sc;                // root flare where the trunk meets the ground
    c.fillStyle = sap < 1 ? mix(tint(L, '#6F9F5C'), bark, sap) : bark; c.beginPath();
    c.moveTo(cx - rr * 2.3, by + h * 0.008); c.quadraticCurveTo(cx - rr * 0.95, by - rr * 0.2, cx - rr * 0.85, by - rr * 2.2);
    c.lineTo(cx + rr * 0.85, by - rr * 2.2); c.quadraticCurveTo(cx + rr * 0.95, by - rr * 0.2, cx + rr * 2.3, by + h * 0.008); c.closePath(); c.fill();
    segs.forEach(function (s) {
      var local = clamp((g - s[8] * 0.115) / 0.115); if (local <= 0) return;
      limb(c, s, local, sc, cx, by, gw, sap < 1 ? mix(tint(L, '#6F9F5C'), bark, sap) : bark, sap < 1 ? mix(tint(L, '#A8D488'), barkHi, sap) : barkHi, side);
      if (sap < 1 && local < 1 && local > 0.15) {          // a sapling's growing shoots carry two small leaves
        var t2 = local, qx = s[2], qy = s[3];
        var ex = (1 - t2) * (1 - t2) * s[0] + 2 * (1 - t2) * t2 * qx + t2 * t2 * s[4], ey = (1 - t2) * (1 - t2) * s[1] + 2 * (1 - t2) * t2 * qy + t2 * t2 * s[5];
        var lsz = h * 0.022 * (1 - sap * 0.5);
        leafShape(c, cx + ex * sc, by + ey * sc, lsz, -0.8, tint(L, '#9BCB78'));
        leafShape(c, cx + ex * sc, by + ey * sc, lsz, 0.8, tint(L, '#86B862'));
      }
    });
    var pal = ['#FFE9EF', '#FBD0DD', '#F6B6CA', '#F09BB4', '#FFF5F7'].map(function (x) { return tintBloom(L, x); });
    open.forEach(function (o) {
      var R = rng(1000 + o[2]), bt = o[3], x = o[0], y = o[1];
      if (bt < 1) {                              // fresh green leaves before the blossoms open
        var lf = tint(L, '#86B862'), ls = h * 0.028 * o[5] * (1 - bt * 0.7);
        for (var k = 0; k < 3; k++) leafShape(c, x, y, ls, -1.4 + k * 1.4 + o[4], k === 1 ? tint(L, '#9BCB78') : lf);
      }
      if (bt <= 0) return;
      var crr = cr * (0.75 + o[4] * 0.6) * (o[6] < 5 ? 1.35 : 1);
      glow(c, x, y, crr * (0.6 + bt * 0.6), mid, 0.55 * bt);
      var nb = Math.round(11 * bt);
      for (var b = 0; b < nb; b++) {
        var a = R() * 6.283, d = Math.sqrt(R()) * crr * (0.55 + bt * 0.5), fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.8;
        var lit = clamp(0.5 - (fy - y) / (cr * 2) + side * (fx - x) / (cr * 4));
        flower(c, fx, fy, h * (0.0095 + R() * 0.007) * (0.6 + bt * 0.4), pal[Math.min(4, Math.floor((1 - lit) * 4 + R() * 1.2))], R() * 6.283);
      }
    });
    if (done) {                                   // a finished tree lets a few petals go
      var Rd = rng(77);
      for (var k = 0; k < 16; k++) petal(c, w * (0.1 + Rd() * 0.8), h * (0.18 + Rd() * 0.6), h * (0.012 + Rd() * 0.006), Rd() * 6.28, rgba(pal[k % 4], 0.85));
    }
    if (L.day) glow(c, w * (0.08 + 0.84 * L.tt), h * (0.66 - 0.52 * Math.sin(PI * clamp(L.tt))), w * 0.7, '#FFE2B8', 0.1 + L.warm * 0.12);
    vignette(c, w, h);
    c.restore();
  }
  function vignette(c, w, h) {
    var v = c.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h * 0.45, Math.max(w, h) * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }

  /* drifting petals over the scene: sec = time in seconds, amount 0..1 */
  function petals(c, w, h, sec, amount) {
    var n = Math.round(22 * clamp(amount)); if (!n) return;
    var R = rng(555), cols = ['#FBD0DD', '#F6B6CA', '#FFE9EF'];
    for (var k = 0; k < n; k++) {
      var sp = 0.035 + R() * 0.05, ph = R(), sway = 0.03 + R() * 0.05, x0 = R(), s = h * (0.011 + R() * 0.008), spin = 0.6 + R() * 1.4;
      var f = (ph + sec * sp) % 1, x = (x0 + f * 0.35 + Math.sin(sec * 0.7 + k) * sway) % 1, y = -0.05 + f * 1.1;
      c.save(); c.translate(x * w, y * h); c.rotate(sec * spin + k); c.scale(Math.cos(sec * spin * 1.3 + k), 1);
      petal(c, 0, 0, s, 0, rgba(cols[k % 3], 0.9 * Math.min(1, (1 - f) * 6))); c.restore();
    }
  }

  /* web: draw the scene once into a cached layer, then let petals drift over it (static when Performance mode or reduced motion is on) */
  var lives = typeof WeakMap === 'function' ? new WeakMap() : null;
  function live(canvas, w, h, dpr, progress, leaves, hour, done) {
    var old = lives && lives.get(canvas); if (old) cancelAnimationFrame(old.raf);
    var layer = document.createElement('canvas'); layer.width = Math.round(w * dpr); layer.height = Math.round(h * dpr);
    var lc = layer.getContext('2d'); lc.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(lc, w, h, progress, leaves, hour, done);
    canvas.width = layer.width; canvas.height = layer.height;
    var c = canvas.getContext('2d'), p = clamp(progress || 0), amount = done || p >= 1 ? 1 : clamp((p - 0.6) / 0.4);
    var still = window.MAATRAM_PERF === true || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    function frame(ts) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(layer, 0, 0);
      if (amount > 0) { c.setTransform(dpr, 0, 0, dpr, 0, 0); petals(c, w, h, (ts || 0) / 1000, amount * 0.75); }
      if (still || amount <= 0) return;
      st.raf = requestAnimationFrame(function (t) {
        if (!canvas.isConnected) return;
        frame(t);
      });
    }
    var st = { raf: 0 }; if (lives) lives.set(canvas, st);
    frame(still ? 9 * 1000 : performance.now());
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
  window.MaatramSakura = { draw: draw, live: live, petals: petals, garden: garden, hourNow: hourNow };
})();

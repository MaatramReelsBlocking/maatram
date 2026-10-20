/* Phone screen time -> website Stats. The Android Hard Lock app pushes today's minutes for a few
   social apps under the user's link code; stats.html reads them back and fills the rows in.
   Runs as a Vercel Node function at /api/usage. Storage: Firestore usage/{code} (see firestore.rules).

   GET  /api/usage?code=ABCD2345                  -> { day, apps:{instagram:42,...}, at }
   POST /api/usage { code, day, apps }            -> { ok:true }

   Only these app ids are accepted; nothing else about the phone is stored. */

const { banned } = require('./_guard');
const PROJECT = 'maatram-859f4';
const KEY = 'AIzaSyAjiAm61IkH3wB1tjwOyGRrXAuRMKQyCcQ';   // public web key (same as firebase-config.js)
const CODE = /^[A-HJ-NP-Z2-9]{8}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const IDS = ['instagram', 'snapchat', 'tiktok', 'youtube', 'whatsapp', 'other'];
const DOC = (c) => `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/usage/${c}?key=${KEY}`;
const HDR = { 'Content-Type': 'application/json', Referer: 'https://maatram.co.in/' };

const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 6e4);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 120;
}

/* keeps only known ids with whole minutes 1..1440; returns null when nothing usable is left */
function clean(apps) {
  if (!apps || typeof apps !== 'object') return null;
  const out = {};
  for (const id of IDS) { const m = Math.round(Number(apps[id])); if (m >= 1 && m <= 1440) out[id] = m; }
  return Object.keys(out).length ? out : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); return res.status(204).end(); }
  if (banned(req, res)) return;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });

  try {
    if (req.method === 'GET') {
      const code = String(new URL(req.url, 'http://x').searchParams.get('code') || '').toUpperCase();
      if (!CODE.test(code)) return res.status(400).json({ error: 'bad code' });
      const r = await fetch(DOC(code), { headers: HDR });
      if (r.status === 404) return res.status(200).json({ day: '', apps: {}, at: 0 });
      if (!r.ok) throw new Error('read ' + r.status);
      const f = (await r.json()).fields || {};
      let apps = {}; try { apps = clean(JSON.parse(f.apps?.stringValue || '{}')) || {}; } catch (_) {}
      return res.status(200).json({ day: f.day?.stringValue || '', apps, at: Number(f.at?.integerValue || 0) });
    }
    if (req.method === 'POST') {
      let b;
      try { b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; } catch (_) { b = null; }
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'bad request' });
      const code = String(b.code || '').toUpperCase(), day = String(b.day || ''), apps = clean(b.apps);
      if (!CODE.test(code) || !DAY.test(day) || !apps) return res.status(400).json({ error: 'bad request' });
      const body = { fields: { day: { stringValue: day }, apps: { stringValue: JSON.stringify(apps) }, at: { integerValue: String(Date.now()) } } };
      const w = await fetch(DOC(code), { method: 'PATCH', headers: HDR, body: JSON.stringify(body) });
      if (!w.ok) throw new Error('write ' + w.status);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    console.warn('usage', e.message);
    return res.status(502).json({ error: 'Could not reach the usage store.' });
  }
};
module.exports.clean = clean;

/* Linked devices — one Hard Lock for the website, the phone app and the Chrome extension.
   A device holds a link code (8 letters/digits). Starting a lock anywhere stores its end time
   under that code; every linked device checks the code and locks until that time.
   Runs as a Vercel Node function at /api/link. Storage: Firestore links/{code} (see firestore.rules).

   GET  /api/link?code=ABCD2345            -> { end, minutes, by }   (end 0 = no lock)
   POST /api/link { code, minutes, by }     -> { end, minutes, by }  (409 if a longer lock already runs)

   The end time is set with the server's clock, so every device agrees. A running lock can only
   be extended, never shortened or cancelled. */

const PROJECT = 'maatram-859f4';
const KEY = 'AIzaSyAjiAm61IkH3wB1tjwOyGRrXAuRMKQyCcQ';   // public web key (same as firebase-config.js)
const CODE = /^[A-HJ-NP-Z2-9]{8}$/;
const MAX_MIN = 90;
const BY = new Set(['web', 'phone', 'chrome']);
const DOC = (c) => `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/links/${c}?key=${KEY}`;
const HDR = { 'Content-Type': 'application/json', Referer: 'https://maatram.co.in/' };

/* best-effort per-instance limiter: 40 requests/minute per IP (a device polls once a minute) */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 6e4);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 40;
}

async function read(code) {
  const r = await fetch(DOC(code), { headers: HDR });
  if (r.status === 404) return { end: 0, minutes: 0, by: '' };
  if (!r.ok) throw new Error('read ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const f = (await r.json()).fields || {};
  return { end: Number(f.end?.integerValue || 0), minutes: Number(f.minutes?.integerValue || 0), by: f.by?.stringValue || '' };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');          // phone app and extension call this too
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); return res.status(204).end(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });

  try {
    if (req.method === 'GET') {
      const code = String(req.query.code || '').toUpperCase();
      if (!CODE.test(code)) return res.status(400).json({ error: 'bad code' });
      const cur = await read(code);
      return res.status(200).json({ ...cur, now: Date.now() });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const code = String(b.code || '').toUpperCase(), minutes = Math.round(Number(b.minutes)), by = BY.has(b.by) ? b.by : 'web';
      if (!CODE.test(code) || !(minutes >= 1 && minutes <= MAX_MIN)) return res.status(400).json({ error: 'bad request' });
      const now = Date.now(), end = now + minutes * 60000, cur = await read(code);
      if (cur.end > now && cur.end >= end) return res.status(409).json({ ...cur, now, error: 'A lock is already running.' });
      const body = { fields: { end: { integerValue: String(end) }, minutes: { integerValue: String(minutes) }, by: { stringValue: by }, at: { integerValue: String(now) } } };
      const w = await fetch(DOC(code), { method: 'PATCH', headers: HDR, body: JSON.stringify(body) });
      if (!w.ok) throw new Error('write ' + w.status + ' ' + (await w.text()).slice(0, 200));
      return res.status(200).json({ end, minutes, by, now });
    }
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    console.warn('link', e.message);
    return res.status(502).json({ error: 'Could not reach the lock store.' });
  }
};

/* Shared abuse guard for the /api functions (underscore prefix = not a route).
   Vercel sets x-forwarded-for to the real client address, so it can't be spoofed from the browser.
   Ban an abusive address by adding it to Vercel -> Settings -> Environment Variables:
     BLOCKED_IPS = 203.0.113.7, 198.51.100.0/24      (comma separated; exact IPs or IPv4 /prefix)
   Empty by default. Don't ban a whole school or mobile-carrier range: many students share one IP. */

const ip4 = (s) => { const p = String(s).split('.').map(Number); return p.length === 4 && p.every((n) => n >= 0 && n <= 255) ? ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0 : null; };

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
}

function isBlocked(ip, list) {
  const rules = String(list == null ? process.env.BLOCKED_IPS || '' : list).split(',').map((s) => s.trim()).filter(Boolean);
  const a = ip4(ip);
  return rules.some((r) => {
    if (r === ip) return true;
    const [base, bits] = r.split('/'), b = ip4(base), n = Number(bits);
    if (a === null || b === null || !(n >= 8 && n <= 32)) return false;   // /8 minimum so a typo can't ban the world
    const mask = n === 32 ? 0xffffffff : (~0 << (32 - n)) >>> 0;
    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
  });
}

/* Returns true (and answers 403) when the caller is banned; handlers just `if (banned(req, res)) return;` */
function banned(req, res) {
  if (!isBlocked(clientIp(req))) return false;
  res.setHeader('Cache-Control', 'no-store');
  res.status(403).json({ error: 'blocked' });
  return true;
}

module.exports = { banned, isBlocked, clientIp };

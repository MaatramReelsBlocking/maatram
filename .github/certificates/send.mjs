/* Monthly Leaderboard certificates.
   Finds the top 3 students of a month, writes their login name and the month onto
   template.png, and emails each one their certificate from maatram97@gmail.com.

   Run by .github/workflows/certificates.yml on the 1st of every month (previous month).
   Env (GitHub repo secrets):
     FIREBASE_SERVICE_ACCOUNT  JSON key of a Firebase service account (reads users + their emails)
     GMAIL_APP_PASSWORD        16-letter app password of maatram97@gmail.com
   Options:
     MONTH=2026-10   month to award (default: last month, India time)
     DRY_RUN=1       render certificates into out/ only, no email, no "sent" record
   A month is only emailed once: certificates/{month} in Firestore records who got one. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(DIR, 'layout.json'), 'utf8'));
const FROM = 'maatram97@gmail.com';

export function lastMonth(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 3600e3);          // the board resets on India time
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}
export const monthName = (m) =>
  new Date(m + '-01T00:00:00Z').toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/* A user's score for month m. gate.js archives points into m_YYYY-MM the next time the
   user opens the site; someone who hasn't come back yet still has them in `points`. */
export function scoreFor(u, m) {
  if (Number.isInteger(u['m_' + m])) return u['m_' + m];
  return u.cycle === m && Number.isInteger(u.points) ? u.points : 0;
}

/* Same rule as leaderboard.html competes(): banned accounts never place. */
export function topThree(users, m) {
  return users
    .filter((u) => u.banned !== true && !u.isAdmin)
    .map((u) => ({ ...u, score: scoreFor(u, m) }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)))
    .slice(0, 3)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

const RANK = ['1st', '2nd', '3rd'];

export async function render(name, m, rank) {
  for (const f of CFG.fonts || []) GlobalFonts.registerFromPath(path.join(DIR, f.file), f.family);
  const img = await loadImage(path.join(DIR, 'template.png'));
  const cv = createCanvas(img.width, img.height), ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const vals = { name, month: monthName(m), rank: RANK[rank - 1] + ' place' };
  for (const [key, t] of Object.entries(CFG.text)) {
    if (!vals[key]) continue;
    let size = Math.round(t.size * img.height);
    const max = t.maxWidth * img.width;
    ctx.fillStyle = t.color; ctx.textAlign = t.align || 'center'; ctx.textBaseline = 'middle';
    do { ctx.font = `${t.weight || 'normal'} ${size}px "${t.font}"`; size -= 2; }   // shrink long names to fit
    while (ctx.measureText(vals[key]).width > max && size > 10);
    ctx.fillText(vals[key], t.x * img.width, t.y * img.height);
  }
  return cv.encode('png');
}

async function main() {
  const m = process.env.MONTH || lastMonth(), dry = !!process.env.DRY_RUN;
  if (!fs.existsSync(path.join(DIR, 'template.png'))) throw new Error('template.png missing: export the Canva certificate as PNG into .github/certificates/');
  if (!/^\d{4}-\d{2}$/.test(m)) throw new Error('MONTH must look like 2026-10');
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(), auth = getAuth();

  const snap = await db.collection('users').get();
  const winners = topThree(snap.docs.map((d) => ({ uid: d.id, ...d.data() })), m);
  console.log(`${monthName(m)}: ${snap.size} users, top ${winners.length}:`,
    winners.map((w) => `#${w.rank} (${w.score} pts)`).join(', ') || 'none');   // public repo: no names or emails in logs
  if (!winners.length) return;

  const log = db.collection('certificates').doc(m);
  const sent = ((await log.get()).data() || {}).sent || {};
  const people = (await auth.getUsers(winners.map((w) => ({ uid: w.uid })))).users;
  const mail = dry ? null : (await import('nodemailer')).default.createTransport({
    service: 'gmail', auth: { user: FROM, pass: process.env.GMAIL_APP_PASSWORD } });
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });

  for (const w of winners) {
    const acct = people.find((p) => p.uid === w.uid);
    const name = (acct && acct.displayName) || w.name || 'Maatram Student';   // the name they log in with
    const png = await render(name, m, w.rank);
    const file = `maatram-certificate-${m}-${w.rank}.png`;
    fs.writeFileSync(path.join(DIR, 'out', file), png);
    if (dry) { console.log(`  rendered ${file}`); continue; }
    if (sent[w.uid]) { console.log(`  #${w.rank}: already sent`); continue; }
    if (!acct || !acct.email) { console.log(`  #${w.rank}: no email on the account, skipped`); continue; }
    await mail.sendMail({
      from: `Maatram <${FROM}>`, to: acct.email,
      subject: `Your Maatram certificate: ${RANK[w.rank - 1]} place, ${monthName(m)}`,
      text: `Hi ${name},\n\nYou finished ${RANK[w.rank - 1]} on the Maatram Leaderboard for ${monthName(m)} with ${w.score} points. Your certificate is attached.\n\nKeep going!\nTeam Maatram\nhttps://maatram.co.in`,
      attachments: [{ filename: file, content: png }],
    });
    await log.set({ sent: { [w.uid]: { rank: w.rank, at: FieldValue.serverTimestamp() } } }, { merge: true });
    console.log(`  #${w.rank}: emailed`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });

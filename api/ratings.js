/* Survey ratings for ratings.html. Reads the Google Form's response sheet as CSV and
   returns averages + answer counts + recent feedback. Runs as a Vercel Node function.

   The sheet must be shared "Anyone with the link: Viewer" (Share → General access), or
   Google returns a sign-in page and this falls back to the last snapshot below.
   Override the sheet with env SURVEY_SHEET_ID. */

const SHEET = process.env.SURVEY_SHEET_ID || '1HTtHR5XPAE81xhHvDQ52oO-zzFxs-KbLEWFQ6wPRdxk';
const CSV = `https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv`;
const STARS = { Excellent: 5, Good: 4, Fair: 3, Poor: 1 };   // "Overall experience" answer -> stars
const SKIP = /^(no|nil|none|na|n\/a|hi|hello|nothing|-|\.)$/i;   // empty-ish feedback isn't shown

/* Real responses as of 13 Aug 2026 (sheet was school-domain only then). */
const SNAPSHOT = [
  ["Timestamp", "How frequently do you use the app to track or manage your screen time?", "How easy was it to set up and navigate through the app?", "Which feature of the app do you find most useful?", "How effective are the app's alerts or reminders in helping you stop using your device?", "On average, how much has your daily non-academic screen time decreased since using the app?", "On which type of apps has this tool helped you cut down the most time?", "What primary benefit have you noticed in your daily life since reducing your screen time?", "How appealing and engaging is the overall design and interface of the app?", "How likely are you to recommend this app to a classmate or friend?", "Overall, how would you rate your experience with this app?", "Do you have any suggestions, feature ideas, or general feedback to help us improve the app?"],
  ["8/10/2026 21:18:20", "Multiple times a day", "Very easy", "App blocking / Screen limits", "Extremely effective", "More than 2 hours", "Social media", "Better focus on studies and homework", "Simple and clear", "Highly likely", "Excellent", "no"],
  ["8/10/2026 21:25:09", "Multiple times a day", "Easy", "App blocking / Screen limits", "Extremely effective", "30 mins", "Video streaming", "Better focus on studies and homework", "Very attractive and fun to use", "Highly likely", "Excellent", "Nice and highly recommendable  app"],
  ["8/12/2026 19:54:14", "Multiple times a day", "Very easy", "App blocking / Screen limits", "Extremely effective", "More than 2 hours", "Social media", "Better focus on studies and homework", "Very attractive and fun to use", "Highly likely", "Excellent", "nil"],
  ["8/12/2026 19:55:09", "Once a day", "Very easy", "App blocking / Screen limits", "Extremely effective", "More than 2 hours", "Social media", "Better focus on studies and homework", "Very attractive and fun to use", "Highly likely", "Excellent", "peak app no need any suggestions"],
  ["8/12/2026 20:48:54", "Multiple times a day", "Easy", "Rewards / Focus streak tracking", "Effective", "More than 2 hours", "Social media", "Better focus on studies and homework", "Simple and clear", "Highly likely", "Excellent", "can improve the point providing mechanism as i did 29 sessions and granted 2500 points in 90 min flow timer"],
  ["8/13/2026 16:26:17", "Multiple times a day", "Very easy", "App blocking / Screen limits", "Extremely effective", "More than 2 hours", "Social media", "Better focus on studies and homework", "Very attractive and fun to use", "Highly likely", "Excellent", "hi"],
];

function parseCsv(t) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function summarize(rows, live) {
  const head = rows[0].map((h) => h.trim()), data = rows.slice(1);
  const col = (re) => head.findIndex((h) => re.test(h));
  const iRate = col(/overall.*rate/i), iText = col(/suggestions|feedback/i), iTime = col(/timestamp/i);
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }; let sum = 0, n = 0;
  const questions = [];
  head.forEach((h, i) => {
    if (i === iTime || i === iText || !h) return;
    const counts = {};
    data.forEach((r) => { const a = (r[i] || '').trim(); if (a) counts[a] = (counts[a] || 0) + 1; });
    if (Object.keys(counts).length) questions.push({ q: h, counts });
  });
  data.forEach((r) => { const s = STARS[(r[iRate] || '').trim()]; if (s) { dist[s]++; sum += s; n++; } });
  const reviews = data.map((r) => ({ at: r[iTime] || '', stars: STARS[(r[iRate] || '').trim()] || 0, text: (r[iText] || '').trim().slice(0, 400) }))
    .filter((r) => r.text.length >= 8 && !SKIP.test(r.text)).reverse().slice(0, 30);
  return { live, responses: data.length, average: n ? Math.round((sum / n) * 10) / 10 : 0, rated: n, dist, questions, reviews,
    asOf: live ? new Date().toISOString() : '2026-08-13' };
}

module.exports = async (req, res) => {
  let out;
  try {
    const r = await fetch(CSV, { redirect: 'manual' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/csv|text\/plain/.test(type)) throw new Error('sheet not public (' + r.status + ' ' + type + ')');
    const rows = parseCsv(await r.text());
    if (rows.length < 1) throw new Error('empty sheet');
    out = summarize(rows, true);
  } catch (e) {
    console.warn('ratings', e.message);
    out = summarize(SNAPSHOT, false);
  }
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  return res.status(200).json(out);
};

module.exports.parseCsv = parseCsv;
module.exports.summarize = summarize;

/* Focuz AI — streams answers for the help bot (focuz-bot.js).
   Runs as a Vercel Node function at /api/focuz. Works with whichever free
   key is set in Vercel → Settings → Environment Variables (tried in order):
     GEMINI_API_KEY  — free from aistudio.google.com (no card)
     NVIDIA_API_KEY  — free from build.nvidia.com (no card)
     AI_GATEWAY_API_KEY / Vercel OIDC — Vercel AI Gateway (needs a card on file)
   If every provider fails the bot falls back to its offline FAQ. */

const env = process.env;
const PROVIDERS = [
  { name: 'gemini', key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: [env.GEMINI_MODEL, 'gemini-3.8-flash'] },
  { name: 'nvidia', key: env.NVIDIA_API_KEY, url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: [env.NVIDIA_MODEL, 'nvidia/nemotron-3-super-120b-a12b', 'deepseek-ai/deepseek-v4.1-flash', 'openai/gpt-oss-20b', 'mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'] },
  { name: 'gateway', key: env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN, oidc: true, url: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    models: [env.FOCUZ_MODEL, 'anthropic/claude-haiku-4.5'] },
];
const ALLOWED = /^https:\/\/(www\.)?maatram\.co\.in$|^https:\/\/maatram-website[\w-]*\.vercel\.app$|^http:\/\/localhost(:\d+)?$/;

const CORE = `Facts about Maatram (only state Maatram facts that appear here or in the page context below):
- Maatram (maatram.co.in) is a free, open-source (MIT) focus and screen-time platform for students, built by a team of five class 10B students at SSVM School of Excellence, Coimbatore. Slogan: "Bringing a change in you". Inspired by Gen Z, made by Gen Z, made for Gen Z. No ads, no paid tier.
- Tools: Focus Timers (Pomodoro 25 min +25 pts, Deep Work 90 min +100 pts), App Gate (opening a social app costs 10 pts) with Hard Lock (5 to 90 minutes, +10 pts per 5 minutes locked), Study Rooms (up to 5 people, live synced timers, chat, strikes when someone opens a social app; 3 strikes ends your seat and costs 30 pts; +10 pts after 10 minutes), Screen Stats (manual daily log stored on the device, +50 pts when your week is under your average), Leaderboard (monthly and all-time, signed-in students only), Wellness (7-day meal plan and four daily checks, +25 pts each), Sports Corner (local events posted by signed-in users).
- No account needed; Google sign-in saves points to the Leaderboard. Android app (APK from /download.html, Android 5.1+, Maatram Shield accessibility service does the blocking). Chrome extension "Maatram Hard Lock" blocks Instagram, Snapchat, TikTok, YouTube, X and Facebook while a lock started on the site is active. No iPhone app.
- Bottom-left ⚡ Performance switch: On = full animation, Off = calm mode with no background animation (off by default on small or slow devices). Bottom-right ◐ Customize UI switches Neon / Minimal Glass themes.
- Contact: maatram97@gmail.com or the feedback form on /socials.html. Socials: Instagram @maatram_official97, X @maatram_97, Reddit u/Maatram97, GitHub MaatramReelsBlocking/maatram.`;

function system(page, ctx) {
  const today = new Date().toISOString().slice(0, 10);
  return `You are Focuz, the AI assistant on the Maatram website. Today is ${today}. The user is on the "${page || 'home'}" page.

You can help with ANY question: Maatram itself, schoolwork in every subject (maths, science, languages, history, coding and more), exam preparation, study plans, focus and screen-time habits, careers, general knowledge, writing, and everyday questions.

How to answer:
- Most users are school students, often teenagers. Be warm, clear and encouraging, never preachy.
- Be concise: lead with the answer, then the key steps. Use short paragraphs, bullet lists and **bold** for key terms. Use fenced code blocks for code and show working step by step for maths. Write maths as plain text (for example 2x = 8, so x = 8 ÷ 2 = 4); never use LaTeX, $ signs or \\frac.
- For homework, teach: explain the method so they can do the next one themselves, then give the answer.
- When a Maatram tool would genuinely help, mention it with its link (for example [Timers](/timers.html), [App Gate](/app-gate.html), [Study Room](/study-room.html), [Stats](/stats.html), [Leaderboard](/leaderboard.html), [Wellness](/wellness/wellness.html), [Get the app](/download.html)). Do not force it into unrelated answers.
- Never invent Maatram features, numbers, people or policies. If a Maatram detail is not in the facts below, say you are not sure and point to maatram97@gmail.com.
- You cannot see live data such as the user's points, rank or account, and you cannot browse the web. Say so if asked, and do not guess current events after your training.
- Keep everything age-appropriate. Decline sexual content, instructions for weapons, drugs, self-harm or hacking, and anything that helps cheat in a live exam; offer a safe, useful alternative.
- If someone mentions self-harm, suicide, abuse or being in danger, respond with care, encourage them to talk to a trusted adult, and share India's Tele-MANAS helpline 14416 (free, 24x7) or emergency number 112.
- No medical, legal or financial diagnosis; give general information and suggest a professional, parent or teacher.
- Reply in the language the user writes in.

${CORE}${ctx ? '\n\nRelevant help-centre entries:\n' + ctx : ''}`;
}

/* best-effort per-instance limiter: 12 requests/minute and 150/day per IP */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = hits.get(ip) || { m: [], d: 0, day: now };
  if (now - h.day > 864e5) { h.d = 0; h.day = now; }
  h.m = h.m.filter((t) => now - t < 6e4);
  if (h.m.length >= 12 || h.d >= 150) return true;
  h.m.push(now); h.d++; hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return false;
}

function clean(body) {
  const b = typeof body === 'string' ? JSON.parse(body || '{}') : body || {};
  const msgs = Array.isArray(b.messages) ? b.messages.slice(-14) : [];
  const out = msgs
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return {
    messages: out,
    page: String(b.page || '').replace(/[^\w-]/g, '').slice(0, 30),
    ctx: typeof b.ctx === 'string' ? b.ctx.slice(0, 1500) : '',
  };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && ALLOWED.test(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!ALLOWED.test(origin)) return res.status(403).json({ error: 'origin' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return res.status(429).json({ error: 'Slow down a little — try again in a minute.' });

  let input;
  try { input = clean(req.body); } catch (_) { input = null; }
  if (!input) return res.status(400).json({ error: 'bad request' });

  const messages = [{ role: 'system', content: system(input.page, input.ctx) }, ...input.messages];
  let upstream = null;
  outer: for (const p of PROVIDERS) {
    const key = p.key || (p.oidc && req.headers['x-vercel-oidc-token']);
    if (!key) continue;
    for (const model of [...new Set(p.models.filter(Boolean))]) for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1500 * attempt)); // busy model: retry with backoff
      try {
        upstream = await fetch(p.url, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, stream: true, max_tokens: 4000, temperature: 0.5 }),
        });
        if (upstream.ok) break outer;
        console.warn('focuz', p.name, model, upstream.status, (await upstream.text()).slice(0, 200));
        if (upstream.status !== 503) { upstream = null; break; } // only 'busy' is worth a retry; quota/not-found move on
      } catch (e) { console.warn('focuz', p.name, model, e.message); }
      upstream = null;
    }
  }
  if (!upstream) return res.status(503).json({ error: 'ai unavailable' });

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  const reader = upstream.body.getReader(), dec = new TextDecoder();
  let buf = '';
  req.on('close', () => reader.cancel().catch(() => {}));
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const t = JSON.parse(data).choices?.[0]?.delta?.content;
          if (t) res.write(t);
        } catch (_) { /* partial keep-alive line */ }
      }
    }
  } catch (e) { console.warn('focuz stream', e.message); }
  res.end();
};

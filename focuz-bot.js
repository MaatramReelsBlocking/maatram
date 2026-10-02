/* Focuz — Maatram help bot. AI answers (streamed from /api/focuz) for any question,
   with an offline FAQ matcher as instant chips and as the fallback when AI is unreachable.
   Loaded with <script defer src="/focuz-bot.js"> on every page. */
(function () {
  'use strict';
  if (window.__focuz) return; window.__focuz = true;

  var GREET = "Hi, I'm Focuz, Maatram's AI. Ask me anything: homework in any subject, exam plans, focus tips, coding, or how Maatram works.";
  var MAIL = 'maatram97@gmail.com';

  /* ---- Knowledge base: every fact below is taken from the live site pages ---- */
  var KB = [
    // Basics
    { id: 'what', q: 'What is Maatram?', k: ['what is maatram', 'about', 'maatram', 'what does it do', 'purpose', 'app'],
      a: 'Maatram is a free focus and screen-time app for students. It puts a cost, a pause and an audience between you and the feed: Focus Timers, App Gate with Hard Lock, Study Rooms, Screen Stats, a Leaderboard and Wellness, all on one points balance.', l: ['About Maatram', '/about.html'] },
    { id: 'free', q: 'Is Maatram free?', k: ['free', 'cost', 'price', 'paid', 'pay', 'subscription', 'money', 'ads', 'premium'],
      a: 'Yes. Maatram is completely free and open source. No ads, no paid tier, no subscription.' },
    { id: 'account', q: 'Do I need an account?', k: ['account', 'need account', 'register', 'signup', 'sign up', 'guest', 'without login'],
      a: 'No. Every tool opens without an account. Sign in with Google only if you want your points saved and shown on the Leaderboard. Listing a sports event also needs a sign-in.', l: ['Sign in', '/login.html'] },
    { id: 'signin', q: 'How do I sign in?', k: ['sign in', 'signin', 'login', 'log in', 'google', 'gmail', 'logout', 'sign out'],
      a: 'Maatram uses Google sign-in only. Open the Sign in page and tap Continue with Google. To sign out, tap your profile chip in the top bar and choose Sign out.', l: ['Sign in', '/login.html'] },
    { id: 'data', q: 'Where is my data stored?', k: ['data', 'privacy', 'stored', 'store', 'safe', 'track', 'spy', 'collect', 'delete account', 'personal'],
      a: 'Screen-time numbers you enter on Stats stay in your own browser. If you sign in, your name, photo and points are saved to your account so they can appear on the Leaderboard. Study Room messages go through a public relay and are not stored, so never share personal details there.', l: ['Privacy policy', '/privacy.html'] },
    { id: 'who', q: 'Who built Maatram?', k: ['who built', 'who made', 'team', 'creator', 'ssvm', 'school', 'students', 'developer'],
      a: 'A team of five class 10B students at SSVM School of Excellence, Coimbatore. Inspired by Gen Z, made by Gen Z, made for Gen Z.', l: ['About the team', '/about.html'] },

    // Points
    { id: 'points', q: 'How do points work?', k: ['points', 'pts', 'score', 'earn', 'how to earn', 'reward', 'balance', 'lose points', 'penalty'],
      a: 'Everything runs on one points balance. Earn: Pomodoro +25, Deep Work +100, Hard Lock +10 per 5 minutes locked, +10 after 10 minutes in a Study Room, +50 when your week comes in under your screen-time average, Wellness +25 per daily check (up to +100). Lose: opening a social app on App Gate costs 10, getting struck out of a room costs 30.' },
    { id: 'points-missing', q: "My points aren't saving", k: ['points not saving', 'points gone', 'points missing', 'points reset', 'lost points', 'points zero', 'not updating'],
      a: 'Points are only saved when you are signed in with Google, otherwise they live on this device only. The monthly board also starts fresh each month; your all-time total keeps growing. Check the All time tab on the Leaderboard.', l: ['Leaderboard', '/leaderboard.html'] },
    { id: 'leaderboard', q: 'How does the Leaderboard work?', k: ['leaderboard', 'rank', 'ranking', 'top', 'board', 'monthly', 'all time', 'my rank'],
      a: 'The Leaderboard ranks real signed-in students by points. It has a This month tab and an All time tab. No fake accounts, no paid boosts.', l: ['Open Leaderboard', '/leaderboard.html'] },

    // Timers
    { id: 'timers', q: 'How do the Focus Timers work?', k: ['timer', 'timers', 'pomodoro', 'deep work', 'focus', 'session', 'break', '25', '90'],
      a: 'Pick Pomodoro (25 min focus, 5 min break, +25 pts) or Deep Work (90 min focus, 15 min break, +100 pts). Press Start. Space starts or pauses, R resets. Points land when a focus session finishes.', l: ['Open Timers', '/timers.html'] },
    { id: 'timer-which', q: 'Pomodoro or Deep Work?', k: ['which timer', 'pomodoro or deep work', 'deep work or pomodoro', 'which is better', 'better', 'vs', 'compare', 'difference', 'better timer', 'choose timer'],
      a: 'Pomodoro is short sprints that make it easy to start and keep breaks frequent. Deep Work is one long, distraction-free block for hard tasks and pays the biggest single reward in Maatram.', l: ['Open Timers', '/timers.html'] },

    // App Gate / Hard Lock
    { id: 'gate', q: 'What is the App Gate?', k: ['app gate', 'gate', 'block', 'blocker', 'instagram', 'youtube', 'snapchat', 'tiktok', 'whatsapp', 'social media'],
      a: 'App Gate holds shortcuts to Instagram, Snapchat, TikTok, YouTube and WhatsApp behind a gate you control. Opening one costs 10 points. Arm Hard Lock to put them all out of reach until your focus window ends.', l: ['Open App Gate', '/app-gate.html'] },
    { id: 'hardlock', q: 'How does Hard Lock work?', k: ['hard lock', 'hardlock', 'lock', 'locked', 'unlock', 'lock duration', 'minutes'],
      a: 'On App Gate, pick a window from 5 to 90 minutes and press Lock. Every app goes grey and un-clickable until the timer runs out. No exits, no shortcuts. You earn +10 pts for every 5 minutes (90 minutes = +180).', l: ['Open App Gate', '/app-gate.html'] },
    { id: 'hardlock-pc', q: 'Hard Lock on my computer?', k: ['computer', 'laptop', 'pc', 'desktop', 'chrome', 'browser block', 'block on laptop', 'instagram computer', 'block website'],
      a: 'In Chrome on a computer, add the Maatram Hard Lock extension. While a Hard Lock started on the site is active, it blocks Instagram, Snapchat, TikTok, YouTube, X and Facebook in Chrome.', l: ['Get the extension', 'https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen'] },
    { id: 'extension', q: 'What does the Chrome extension do?', k: ['extension', 'chrome extension', 'web store', 'add to chrome', 'addon', 'plugin'],
      a: 'Maatram Hard Lock is a Chrome extension. The lock is started on maatram.co.in; the extension only blocks while that lock is active. It collects no data.', l: ['Chrome Web Store', 'https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen'] },

    // Study room
    { id: 'room', q: 'How do Study Rooms work?', k: ['study room', 'room', 'friends', 'together', 'group', 'join', 'room code', 'code', 'seat'],
      a: 'Pick a name, share the room code with up to 4 friends and join. Up to five people, timers synced live, room chat. If anyone opens a social app on App Gate, everyone sees the strike in real time. Staying 10 minutes pays +10 pts.', l: ['Open Study Room', '/study-room.html'] },
    { id: 'strikes', q: 'What are strikes?', k: ['strike', 'strikes', 'struck out', 'kicked', 'three strikes', 'removed from room'],
      a: 'Each social app you open on App Gate during a room session is a strike that everyone sees. Three strikes and the room ends your seat, costing 30 points. Take a breath and come back focused.', l: ['Open Study Room', '/study-room.html'] },
    { id: 'room-stuck', q: "Study Room won't connect", k: ['room not working', 'connecting', 'cant join', 'not connecting', 'room stuck', 'friends cant see'],
      a: 'Check everyone typed exactly the same room code, and that you are online. Rooms run through a public relay, so a school or office network that blocks it can stop the connection; try mobile data. Still stuck? Email the team.', mail: true },

    // Stats
    { id: 'stats', q: 'How do Screen Stats work?', k: ['stats', 'screen time', 'statistics', 'usage', 'log', 'track screen', 'chart', 'weekly'],
      a: 'Enter your screen time for each app by hand and save the day. You get today\'s total, a 7-day average and weekly charts. If your week comes in under your average you get +50 pts. The data never leaves your device.', l: ['Open Stats', '/stats.html'] },
    { id: 'stats-auto', q: 'Why is screen time manual?', k: ['automatic', 'automatically', 'track automatically', 'auto track', 'why manual', 'import', 'digital wellbeing', 'screen time api'],
      a: 'Social apps do not share usage data with other apps or websites, so Stats is logged by hand and kept on your device. On a computer, the Chrome extension counts time on blocked sites for Screen Stats.' },

    // Wellness / Sports
    { id: 'wellness', q: 'What is Wellness?', k: ['wellness', 'meal', 'meal plan', 'diet', 'food', 'hydration', 'water', 'sleep', 'health'],
      a: 'Wellness gives you a private 7-day meal plan and four daily checks: meals, hydration, activity and sleep. Each check pays +25 pts, up to +100 a day. Your plan and checks stay on your device.', l: ['Open Wellness', '/wellness/wellness.html'] },
    { id: 'sports', q: 'What is Sports Corner?', k: ['sports', 'sport', 'event', 'tournament', 'match', 'camp', 'sports corner', 'outdoor'],
      a: 'Sports Corner lists local tournaments, camps and meet-ups posted by signed-in users. Filter by city, sport and date. Registration always happens on the organiser\'s own site.', l: ['Open Sports Corner', '/sports.html'] },

    // Android
    { id: 'android', q: 'Is there an Android app?', k: ['android', 'apk', 'phone app', 'mobile app', 'download', 'install', 'play store', 'ios', 'iphone'],
      a: 'Yes, Android 5.1 and above. It runs App Gate, Hard Lock and Maatram Shield natively, so blocking keeps working outside the browser. It is not on the Play Store; download the APK from the site. There is no iPhone app.', l: ['Get the app', '/download.html'] },
    { id: 'not-installed', q: '"App not installed" error', k: ['app not installed', 'not installed', 'install failed', 'wont install', 'cant install', 'installation error'],
      a: 'An older Maatram is still on the phone. Version 1.1 is signed with a different key, so uninstall the old copy first, then install again. Open the APK from the Files app, not a chat preview.', l: ['Install guide', '/download.html'] },
    { id: 'playprotect', q: 'Blocked by Play Protect', k: ['play protect', 'blocked', 'harmful', 'unsafe', 'warning', 'virus', 'download anyway'],
      a: 'Play Protect warns about anything not from the Play Store. Tap More details, then Install anyway. It is a warning about the source, not the file. You can check the file\'s SHA-256 on the download page.', l: ['Install guide', '/download.html'] },
    { id: 'shield', q: 'Hard Lock does nothing on my phone', k: ['shield', 'maatram shield', 'accessibility', 'not blocking', 'doesnt block', 'lock not working', 'hard lock not working'],
      a: 'Maatram Shield is off, or the system killed it. Open Settings → Accessibility → Maatram Shield and turn it on. Without Shield the timers run but nothing gets blocked.', l: ['Install guide', '/download.html'] },
    { id: 'restricted', q: 'Shield switch is greyed out', k: ['restricted setting', 'restricted', 'greyed out', 'grayed out', 'cant enable', 'financial information', 'allow restricted'],
      a: 'On Android 13 and above, go to Settings → Apps → Maatram → ⋮ → Allow restricted settings. Then come back and turn on Maatram Shield in Accessibility.' },
    { id: 'samsung', q: 'Shield keeps turning off (Samsung)', k: ['samsung', 'turns off', 'stops working', 'killed', 'battery', 'sleeping apps', 'keeps stopping'],
      a: 'On Samsung, keep the service alive: lock Maatram in Recents, set Battery to Unrestricted, and remove it from Sleeping apps. Then re-enable Shield in Accessibility.' },

    // Misc
    { id: 'lag', q: 'The site is slow or laggy', k: ['slow', 'lag', 'laggy', 'performance', 'battery drain', 'heavy', 'hang', 'freeze'],
      a: 'Turn on ⚡ Performance (bottom-left button). It stops the background animations while keeping every tool working. It switches on by itself on smaller phones.' },
    { id: 'theme', q: 'Can I change the look?', k: ['theme', 'dark mode', 'light mode', 'colors', 'customize', 'minimal', 'neon', 'design'],
      a: 'Yes. Tap the ◐ Customize UI button at the bottom-right to switch the whole site between Neon and Minimal Glass.' },
    { id: 'contact', q: 'Contact the team', k: ['contact', 'email', 'support', 'help me', 'human', 'report', 'bug', 'feedback', 'complaint', 'suggestion'],
      a: 'Email the team at ' + MAIL + ', or send a message from the feedback form on the Socials page.', l: ['Socials & feedback', '/socials.html'], mail: true },
    { id: 'socials', q: 'Maatram socials', k: ['instagram page', 'twitter', 'x account', 'linkedin', 'reddit', 'github', 'social handles', 'follow', 'source code'],
      a: 'Instagram @maatram_official97, X @maatram_97, Reddit u/Maatram97, LinkedIn maatram.exe, and the source code on GitHub (MaatramReelsBlocking/maatram).', l: ['All socials', '/socials.html'] },

    // Study / focus tips — written for Focuz
    { id: 'tip-start', q: "I can't start studying", k: ['cant start', 'procrastinate', 'procrastination', 'lazy', 'motivation', 'no motivation', 'dont feel like'],
      a: 'Shrink the first step until it feels silly: open the book and read one page. Start one Pomodoro for that one page. Starting is the hard part; most people keep going once the timer is running.', l: ['Start a Pomodoro', '/timers.html'] },
    { id: 'tip-phone', q: 'How do I stop checking my phone?', k: ['phone addiction', 'keep checking', 'scrolling', 'reels', 'shorts', 'doomscroll', 'distracted', 'addicted', 'cant stop'],
      a: 'Put distance between you and the phone: another room, or face down out of reach. Arm a Hard Lock for the length of your study block, and log your screen time daily so you can see it drop.', l: ['Arm Hard Lock', '/app-gate.html'] },
    { id: 'tip-focus', q: 'How do I focus longer?', k: ['focus longer', 'concentrate', 'concentration', 'attention span', 'lose focus', 'mind wanders'],
      a: 'Build it up. Do Pomodoros for a week, then try one Deep Work block a day for your hardest subject. Keep a notepad next to you: when a random thought pops up, write it down and get back to work.', l: ['Open Timers', '/timers.html'] },
    { id: 'tip-exam', q: 'Tips for exam prep', k: ['exam', 'exams', 'test', 'revision', 'revise', 'boards', 'board exam', 'syllabus', 'study plan'],
      a: 'Test yourself instead of re-reading: close the book and write what you remember, then check. Spread revision over several days rather than one long night. Plan tomorrow\'s topics before you stop today.' },
    { id: 'tip-sleep', q: 'I study late and feel tired', k: ['tired', 'sleepy', 'late night', 'night study', 'sleep schedule', 'exhausted'],
      a: 'Sleep is when your brain stores what you studied, so cutting it costs you marks. Keep the phone out of bed and stop screens a while before sleeping. Wellness has a daily sleep check to keep you honest.', l: ['Open Wellness', '/wellness/wellness.html'] },
    { id: 'tip-group', q: 'Studying with friends keeps going off track', k: ['study with friends', 'group study', 'friends distract', 'study group'],
      a: 'Agree on one goal before you start, then use a Study Room: shared timer, and everyone sees who opens a social app. Chat in the breaks, not during focus.', l: ['Open Study Room', '/study-room.html'] }
  ];

  /* Chips shown when the panel opens, per page */
  var PAGE_CHIPS = {
    'timers': ['timers', 'timer-which', 'points', 'tip-start'],
    'app-gate': ['hardlock', 'hardlock-pc', 'shield', 'points'],
    'study-room': ['room', 'strikes', 'room-stuck', 'tip-group'],
    'stats': ['stats', 'stats-auto', 'points', 'tip-phone'],
    'leaderboard': ['leaderboard', 'points-missing', 'signin', 'points'],
    'download': ['not-installed', 'playprotect', 'shield', 'restricted'],
    'wellness': ['wellness', 'points', 'tip-sleep', 'data'],
    'sports': ['sports', 'signin', 'account', 'contact'],
    'login': ['signin', 'account', 'data', 'points-missing'],
    '': ['what', 'points', 'hardlock', 'android']
  };

  /* ---- Matcher ---- */
  var SYN = { mobile: 'phone', cell: 'phone', insta: 'instagram', ig: 'instagram', yt: 'youtube', pts: 'points', point: 'points',
    signin: 'sign in', login: 'sign in', lb: 'leaderboard', pomo: 'pomodoro', laptop: 'computer', pc: 'computer',
    apk: 'android', blocking: 'block', blocked: 'block', blocks: 'block', locking: 'lock', rooms: 'room', timers: 'timer',
    exams: 'exam', studying: 'study', distracted: 'distract', distraction: 'distract', distractions: 'distract' };
  var STOP = /^(the|a|an|is|are|do|does|i|my|me|to|of|in|on|it|how|what|can|you|for|and|or|this|that|with|be|there|any|please|pls|plz|hi|hey|hello|maatram)$/;

  function norm(s) {
    return (' ' + String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ') + ' ')
      .replace(/ (\w+)/g, function (m, w) { return ' ' + (SYN[w] || w); }).replace(/\s+/g, ' ');
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0]; p[0] = i;
      for (j = 1; j <= b.length; j++) {
        var t = p[j];
        p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = t;
      }
    }
    return p[b.length];
  }
  function wordHit(w, words) {
    for (var i = 0; i < words.length; i++) {
      var u = words[i];
      if (u === w) return 1;
      if (w.length >= 4 && u.length >= 4 && (u.indexOf(w) === 0 || w.indexOf(u) === 0)) return 0.9;
      if (w.length >= 4 && lev(u, w) <= (w.length >= 7 ? 2 : 1)) return 0.8;
    }
    return 0;
  }
  function score(entry, text, words) {
    var s = 0, seen = {};
    entry.k.forEach(function (kw) {
      var nk = norm(kw).trim();
      if (!nk || seen[nk]) return; seen[nk] = 1;
      if (nk.indexOf(' ') > 0) { if (text.indexOf(' ' + nk + ' ') >= 0) s += 2 + nk.split(' ').length; else {
        var parts = nk.split(' ').filter(function (p) { return !STOP.test(p); }), hit = 0;
        parts.forEach(function (p) { hit += wordHit(p, words); });
        if (parts.length && hit / parts.length >= 0.99) s += 1.5 + parts.length * 0.5;
      } }
      else if (!STOP.test(nk)) s += wordHit(nk, words) * (nk.length <= 3 ? 1.2 : 1.5);
    });
    return s;
  }
  function match(q) {
    var text = norm(q), words = text.trim().split(' ').filter(function (w) { return w && !STOP.test(w); });
    if (!words.length) return / maatram /.test(' ' + String(q).toLowerCase() + ' ') ? [{ e: KB[0], s: 2 }] : [];
    return KB.map(function (e) { return { e: e, s: score(e, text, words) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
  }
  window.__focuzMatch = match; // exposed for tests

  /* ---- UI (built on first open) ---- */
  var CSS =
    '#fz-btn{position:fixed;right:18px;bottom:74px;z-index:10000;width:52px;height:52px;border-radius:50%;border:1px solid rgba(52,211,153,.55);' +
    'background:linear-gradient(135deg,#34D399,#4E9BFF);color:#04120F;display:grid;place-items:center;cursor:pointer;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 4px rgba(52,211,153,.12);transition:transform .2s ease;padding:0}' +
    '#fz-btn:hover{transform:translateY(-2px) scale(1.04)}#fz-btn svg{width:100%;height:100%}' +
    /* Mascot: focus eye inside a target, blinks every few seconds */
    '.fz-av{display:block;width:100%;height:100%}.fz-av .w{fill:#F4FFFB}.fz-av .d{fill:#04120F}' +
    '.fz-av .ring{fill:none;stroke:#04120F;stroke-opacity:.3;stroke-width:2}.fz-av .tk{fill:none;stroke:#04120F;stroke-width:3.2;stroke-linecap:round}' +
    '.fz-av .eye{transform-box:view-box;transform-origin:32px 32px;animation:fzblink 5s infinite}' +
    '@keyframes fzblink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}' +
    '#fz-head .fz-hav{width:30px;height:30px;border-radius:50%;flex:none;opacity:1;overflow:hidden;background:linear-gradient(135deg,#34D399,#4E9BFF)}.fz-hav .eye{animation-delay:-2.5s}' +
    '#fz-btn:focus-visible,#fz-panel :focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '#fz-panel{position:fixed;right:18px;bottom:136px;z-index:10001;width:360px;max-width:calc(100vw - 24px);height:min(540px,calc(100dvh - 160px));' +
    'display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:rgba(8,14,16,.94);color:#E8F2EF;' +
    'border:1px solid rgba(52,211,153,.35);box-shadow:0 24px 60px rgba(0,0,0,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);' +
    'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;opacity:0;transform:translateY(12px) scale(.98);' +
    'transition:opacity .2s ease,transform .2s ease;pointer-events:none}' +
    '#fz-panel.open{opacity:1;transform:none;pointer-events:auto}' +
    '#fz-head{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.08)}' +
    '#fz-head b{font-size:16px;letter-spacing:.3px;background:linear-gradient(90deg,#34D399,#4E9BFF);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '#fz-head span{font-size:12px;opacity:.65;flex:1}' +
    '#fz-x{width:44px;height:44px;border:0;background:none;color:inherit;font-size:22px;cursor:pointer;border-radius:12px}' +
    '#fz-x:hover{background:rgba(255,255,255,.07)}' +
    '#fz-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}' +
    '.fz-m{max-width:88%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;word-wrap:break-word}' +
    '.fz-b{align-self:flex-start;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-bottom-left-radius:6px}' +
    '.fz-u{align-self:flex-end;background:linear-gradient(135deg,rgba(52,211,153,.9),rgba(78,155,255,.9));color:#04120F;border-bottom-right-radius:6px}' +
    '.fz-m a{color:#6EE7B7;font-weight:600;text-decoration:none;display:inline-block;margin-top:6px}.fz-m a:hover{text-decoration:underline}' +
    '.fz-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}' +
    '.fz-chip{min-height:36px;padding:7px 12px;border-radius:999px;border:1px solid rgba(52,211,153,.4);background:rgba(52,211,153,.08);color:inherit;font:inherit;font-size:13px;cursor:pointer;text-align:left}' +
    '.fz-chip:hover{background:rgba(52,211,153,.18)}' +
    '#fz-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(255,255,255,.08)}' +
    '#fz-in{flex:1;min-width:0;min-height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:inherit;font:inherit;font-size:16px}' +
    '#fz-in::placeholder{color:rgba(232,242,239,.45)}' +
    '#fz-send{min-width:44px;min-height:44px;border:0;border-radius:12px;background:linear-gradient(135deg,#34D399,#4E9BFF);color:#04120F;font-weight:700;cursor:pointer}' +
    '.fz-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
    /* Minimal Glass theme */
    'html.minimal #fz-btn,html.minimal #fz-head .fz-hav{background:linear-gradient(135deg,#AFCEC1,#6F9384);color:#ECEFEE;border-color:rgba(255,255,255,.18);box-shadow:0 8px 24px rgba(0,0,0,.45);backdrop-filter:blur(14px)}' +
    'html.minimal #fz-panel{background:rgba(16,18,17,.9);color:#ECEFEE;border-color:rgba(255,255,255,.13)}' +
    'html.minimal #fz-head b{background:none;color:#9CC0B2}' +
    'html.minimal .fz-u,html.minimal #fz-send{background:#9CC0B2;color:#0B0C0B}' +
    'html.minimal .fz-m a{color:#AFCEC1}html.minimal .fz-chip{border-color:rgba(156,192,178,.35);background:rgba(156,192,178,.07)}' +
    /* Mobile: full-width sheet, clear of the ◐ pill */
    '@media(max-width:560px){#fz-btn{right:12px;bottom:66px;width:48px;height:48px}' +
    '#fz-panel{left:8px;right:8px;bottom:8px;width:auto;max-width:none;height:min(78dvh,620px);border-radius:20px}}' +
    /* Lift the bubble above the guest sign-in bar (gate.js #mguest) on phones */
    '@media(max-width:640px){body:has(#mguest) #fz-btn{bottom:124px}}' +
    'html.minimal .fz-av .d{fill:#0B0C0B}html.minimal .fz-av .w{fill:#F4F7F6}html.minimal .fz-av .ring,html.minimal .fz-av .tk{stroke:#0B0C0B}' +
    'html.fz-perf #fz-panel{backdrop-filter:none;-webkit-backdrop-filter:none}html.fz-perf .fz-av .eye{animation:none}' +
    '@media(prefers-reduced-motion:reduce){#fz-btn,#fz-panel{transition:none}.fz-av .eye{animation:none}}';

  var ICON = '<svg class="fz-av" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle class="ring" cx="32" cy="32" r="23"/><path class="tk" d="M32 6v6M32 52v6M6 32h6M52 32h6"/>' +
    '<g class="eye"><path class="w" d="M14 32q18-17 36 0q-18 17-36 0z"/><circle class="d" cx="32" cy="32" r="8"/><circle class="w" cx="35" cy="29" r="2.6"/></g></svg>';

  /* AI chat additions: wider panel, markdown, typing dots, toolbar, textarea */
  CSS +=
    '#fz-panel{width:400px;height:min(620px,calc(100dvh - 160px))}' +
    '#fz-panel.big{width:min(760px,calc(100vw - 36px));height:calc(100dvh - 150px)}' +
    '#fz-head .fz-tb{width:36px;height:36px;border:0;background:none;color:inherit;font-size:17px;cursor:pointer;border-radius:10px;opacity:.75}' +
    '#fz-head .fz-tb:hover{background:rgba(255,255,255,.07);opacity:1}#fz-x{width:40px;height:40px}' +
    '#fz-head span .fz-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#34D399;margin-right:5px;vertical-align:1px;box-shadow:0 0 8px #34D399}' +
    '#fz-head span .fz-dot.off{background:#9aa5a2;box-shadow:none}' +
    '.fz-b.md{white-space:normal;max-width:94%}.fz-b.md p{margin:0 0 8px}.fz-b.md p:last-child{margin-bottom:0}' +
    '.fz-b.md ul,.fz-b.md ol{margin:4px 0 8px;padding-left:20px}.fz-b.md li{margin:2px 0}' +
    '.fz-b.md h4{margin:10px 0 4px;font-size:15px;color:#6EE7B7}.fz-b.md a{display:inline;margin:0}' +
    '.fz-b.md code{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:rgba(0,0,0,.4);padding:1px 5px;border-radius:5px}' +
    '.fz-b.md pre{background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;overflow-x:auto;margin:6px 0 8px}' +
    '.fz-b.md pre code{background:none;padding:0;white-space:pre}' +
    '.fz-b.md blockquote{margin:6px 0;padding-left:10px;border-left:3px solid rgba(52,211,153,.5);opacity:.9}' +
    '.fz-act{display:flex;gap:6px;margin-top:8px}.fz-act button{min-height:30px;padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:12px;cursor:pointer;opacity:.75}' +
    '.fz-act button:hover{opacity:1;border-color:rgba(52,211,153,.5)}' +
    '.fz-typing{display:inline-flex;gap:4px;padding:4px 2px}.fz-typing i{width:7px;height:7px;border-radius:50%;background:#6EE7B7;animation:fzdot 1s infinite ease-in-out}' +
    '.fz-typing i:nth-child(2){animation-delay:.15s}.fz-typing i:nth-child(3){animation-delay:.3s}' +
    '@keyframes fzdot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}' +
    '.fz-err{color:#fca5a5}' +
    '#fz-form{align-items:flex-end}' +
    '#fz-in{resize:none;padding:11px 14px;line-height:1.4;max-height:140px;overflow-y:auto;font-family:inherit}' +
    '#fz-send.stop{background:rgba(255,255,255,.12);color:#E8F2EF;border:1px solid rgba(255,255,255,.2)}' +
    '.fz-note{font-size:11px;opacity:.45;text-align:center;padding:0 10px 8px}' +
    'html.minimal .fz-b.md h4,html.minimal .fz-typing i{color:#AFCEC1;background:#AFCEC1}html.minimal .fz-b.md h4{background:none}' +
    '@media(max-width:560px){#fz-panel.big{left:0;right:0;bottom:0;width:auto;height:100dvh;border-radius:0}}' +
    '@media(prefers-reduced-motion:reduce){.fz-typing i{animation:none;opacity:.7}}html.fz-perf .fz-typing i{animation:none;opacity:.7}';

  var API = '/api/focuz', KEY = 'focuz_chat_v2';
  var btn, panel, log, input, send, status, built = false, isOpen = false, lastFocus = null;
  var hist = [], busy = null, aiDown = false;
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (page === 'index') page = '';

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function scrollEnd() { log.scrollTop = log.scrollHeight; }
  function say(text, who) { var m = el('div', 'fz-m ' + (who === 'u' ? 'fz-u' : 'fz-b'), text); log.appendChild(m); scrollEnd(); return m; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-30))); } catch (_) {} }
  function remember(role, content) { hist.push({ role: role, content: content }); save(); }

  /* ---- tiny safe markdown: escape first, then format ---- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    return s
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|\/)[^)\s"]+)\)/g, function (m, t, u) {
        var ext = /^https?:/.test(u) && u.indexOf(location.origin) !== 0;
        return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener nofollow"' : '') + '>' + t + '</a>';
      });
  }
  function md(src) {
    var parts = esc(src).split(/```[\w+-]*\n?/), html = '';
    parts.forEach(function (chunk, i) {
      if (i % 2) { html += '<pre><code>' + chunk.replace(/\n$/, '') + '</code></pre>'; return; }
      var list = null;
      chunk.split('\n').forEach(function (line) {
        var ul = /^\s*[-*•]\s+(.*)/.exec(line), ol = /^\s*\d+[.)]\s+(.*)/.exec(line), kind = ul ? 'ul' : ol ? 'ol' : null;
        if (list && list !== kind) { html += '</' + list + '>'; list = null; }
        if (kind) { if (!list) { html += '<' + kind + '>'; list = kind; } html += '<li>' + inline((ul || ol)[1]) + '</li>'; return; }
        var h = /^#{1,6}\s+(.*)/.exec(line), q = /^&gt;\s?(.*)/.exec(line);
        if (h) html += '<h4>' + inline(h[1]) + '</h4>';
        else if (q) html += '<blockquote>' + inline(q[1]) + '</blockquote>';
        else if (line.trim()) html += '<p>' + inline(line) + '</p>';
      });
      if (list) html += '</' + list + '>';
    });
    return html;
  }
  window.__focuzMd = md; // exposed for tests

  function actions(m, text) {
    var bar = el('div', 'fz-act'), c = el('button', null, 'Copy'); c.type = 'button';
    c.addEventListener('click', function () {
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1400);
      }, function () { c.textContent = 'Copy failed'; });
    });
    bar.appendChild(c); m.appendChild(bar);
  }
  function botMd(text, withActions) {
    var m = el('div', 'fz-m fz-b md'); m.innerHTML = md(text); log.appendChild(m);
    if (withActions) actions(m, text);
    scrollEnd(); return m;
  }

  function chips(ids, label) {
    var box = el('div', 'fz-chips'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', label || 'Suggested questions');
    ids.forEach(function (id) {
      var e = KB.filter(function (x) { return x.id === id; })[0]; if (!e) return;
      var c = el('button', 'fz-chip', e.q); c.type = 'button';
      c.addEventListener('click', function () { if (busy) return; say(e.q, 'u'); remember('user', e.q); answer(e); });
      box.appendChild(c);
    });
    log.appendChild(box); scrollEnd();
  }
  /* instant offline answer from the help-centre KB */
  function answer(e) {
    var m = say(e.a, 'b'), extra = '';
    if (e.l) {
      var a = el('a', null, e.l[0] + ' →'); a.href = e.l[1];
      if (/^https?:/.test(e.l[1])) { a.target = '_blank'; a.rel = 'noopener'; }
      m.appendChild(document.createElement('br')); m.appendChild(a);
      extra = ' [' + e.l[0] + '](' + e.l[1] + ')';
    }
    if (e.mail && !e.l) {
      var ml = el('a', null, 'Email ' + MAIL + ' →'); ml.href = 'mailto:' + MAIL;
      m.appendChild(document.createElement('br')); m.appendChild(ml);
    }
    remember('assistant', e.a + extra);
  }
  function offline(q, r) {
    if (r.length && r[0].s >= 1.5 && (!r[1] || r[0].s >= r[1].s * 1.25)) {
      answer(r[0].e);
    } else if (r.length) {
      say('Not fully sure what you mean. Did you mean one of these?', 'b');
      chips(r.slice(0, 3).map(function (x) { return x.e.id; }), 'Did you mean');
    } else {
      var m = say("I'm in offline mode right now, so I can only answer Maatram questions. The team can help: email " + MAIL + ' or use the feedback form on Socials.', 'b');
      var a = el('a', null, 'Open Socials & feedback →'); a.href = '/socials.html';
      m.appendChild(document.createElement('br')); m.appendChild(a);
      chips(['points', 'hardlock', 'room', 'android'], 'Popular questions');
    }
  }
  function setStatus(on) {
    status.innerHTML = '<i class="fz-dot' + (on ? '' : ' off') + '"></i>' + (on ? 'AI · ask anything' : 'Offline FAQ mode');
  }
  function setBusy(ctrl) {
    busy = ctrl;
    send.classList.toggle('stop', !!ctrl);
    send.textContent = ctrl ? '■' : '➤';
    send.setAttribute('aria-label', ctrl ? 'Stop answer' : 'Send');
  }

  function ask(q) {
    q = q.trim(); if (!q || busy) return;
    say(q, 'u'); remember('user', q);
    var r = match(q);
    if (aiDown || !window.fetch || !window.TextDecoder) { offline(q, r); return; }
    var ctx = r.slice(0, 3).map(function (x) { return '- ' + x.e.q + ' ' + x.e.a + (x.e.l ? ' (' + x.e.l[1] + ')' : ''); }).join('\n');
    var m = el('div', 'fz-m fz-b md'); m.innerHTML = '<span class="fz-typing" aria-label="Focuz is typing"><i></i><i></i><i></i></span>';
    log.appendChild(m); scrollEnd();
    var ctrl = window.AbortController ? new AbortController() : null, text = '', raf = 0;
    function stopped() { return !!(ctrl && ctrl.signal.aborted); }
    setBusy(ctrl || {});
    function paint() { raf = 0; var near = log.scrollHeight - log.scrollTop - log.clientHeight < 80; m.innerHTML = md(text); if (near) scrollEnd(); }
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl && ctrl.signal,
      body: JSON.stringify({ messages: hist.slice(-12), page: page || 'home', ctx: ctx })
    }).then(function (res) {
      if (res.status === 429) return res.json().then(function (j) { throw { soft: j.error || 'Too many questions at once. Try again in a minute.' }; });
      if (!res.ok || !res.body) throw new Error('ai ' + res.status);
      var reader = res.body.getReader(), dec = new TextDecoder();
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) return;
          text += dec.decode(x.value, { stream: true });
          if (!raf) raf = requestAnimationFrame(paint);
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      if (stopped() || (err && err.name === 'AbortError')) return;
      if (err && err.soft) { m.remove(); var s = say(err.soft, 'b'); s.classList.add('fz-err'); hist.pop(); save(); throw 'handled'; }
      if (!text) { aiDown = true; setStatus(false); m.remove(); offline(q, r); throw 'handled'; }
    }).then(function () {
      if (raf) cancelAnimationFrame(raf);
      if (!text) { m.remove(); if (!stopped()) { aiDown = true; setStatus(false); offline(q, r); } return; }
      if (stopped()) text += ' …';
      m.innerHTML = md(text); actions(m, text); scrollEnd();
      remember('assistant', text);
    }, function () {}).then(function () { setBusy(null); if (isOpen && matchMedia('(pointer:fine)').matches) input.focus(); });
  }

  function reset() {
    if (busy && busy.abort) busy.abort();
    hist = []; save(); log.innerHTML = '';
    say(GREET, 'b');
    chips(PAGE_CHIPS[page] || PAGE_CHIPS['']);
  }

  function build() {
    built = true;
    panel = el('div'); panel.id = 'fz-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'fz-title');
    panel.hidden = true;
    var head = el('div'); head.id = 'fz-head';
    var t = el('b', null, 'Focuz'); t.id = 'fz-title';
    status = el('span');
    var nw = el('button', 'fz-tb', '↺'); nw.type = 'button'; nw.title = 'New chat'; nw.setAttribute('aria-label', 'Start a new chat');
    nw.addEventListener('click', reset);
    var big = el('button', 'fz-tb', '⤢'); big.type = 'button'; big.title = 'Expand'; big.setAttribute('aria-label', 'Expand chat');
    big.setAttribute('aria-pressed', 'false');
    big.addEventListener('click', function () { var on = panel.classList.toggle('big'); big.setAttribute('aria-pressed', String(on)); scrollEnd(); });
    var x = el('button', null, '×'); x.id = 'fz-x'; x.type = 'button'; x.setAttribute('aria-label', 'Close help');
    x.addEventListener('click', close);
    var av = el('span', 'fz-hav'); av.innerHTML = ICON;
    head.appendChild(av); head.appendChild(t); head.appendChild(status); head.appendChild(nw); head.appendChild(big); head.appendChild(x);
    log = el('div'); log.id = 'fz-log'; log.setAttribute('aria-live', 'polite'); log.setAttribute('role', 'log');
    var form = el('form'); form.id = 'fz-form';
    var lab = el('label', 'fz-sr', 'Ask Focuz a question'); lab.htmlFor = 'fz-in';
    input = el('textarea'); input.id = 'fz-in'; input.rows = 1; input.autocomplete = 'off'; input.maxLength = 2000;
    input.placeholder = 'Ask anything…';
    function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; }
    input.addEventListener('input', grow);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
    });
    send = el('button', null, '➤'); send.id = 'fz-send'; send.type = 'submit'; send.setAttribute('aria-label', 'Send');
    form.appendChild(lab); form.appendChild(input); form.appendChild(send);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) { if (busy.abort) busy.abort(); return; }
      var v = input.value; input.value = ''; grow(); ask(v);
    });
    var note = el('div', 'fz-note', 'Focuz is AI and can make mistakes. Check important answers.');
    panel.appendChild(head); panel.appendChild(log); panel.appendChild(form); panel.appendChild(note);
    document.body.appendChild(panel);
    setStatus(true);
    try { hist = JSON.parse(sessionStorage.getItem(KEY) || '[]') || []; } catch (_) { hist = []; }
    if (!hist.length) { say(GREET, 'b'); chips(PAGE_CHIPS[page] || PAGE_CHIPS['']); }
    else hist.forEach(function (h) { h.role === 'user' ? say(h.content, 'u') : botMd(h.content, true); });
  }
  function open() {
    if (!built) build();
    lastFocus = document.activeElement;
    panel.hidden = false; isOpen = true;
    requestAnimationFrame(function () { if (isOpen) panel.classList.add('open'); });
    btn.setAttribute('aria-expanded', 'true');
    scrollEnd();
    if (window.matchMedia('(pointer:fine)').matches) input.focus(); else panel.querySelector('#fz-x').focus();
  }
  function close() {
    isOpen = false; panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!isOpen) panel.hidden = true; }, 220);
    (lastFocus && lastFocus.focus ? lastFocus : btn).focus();
  }

  function init() {
    if (document.getElementById('fz-btn')) return;
    var st = el('style'); st.id = 'fz-css'; st.textContent = CSS; document.head.appendChild(st);
    if (window.MAATRAM_PERF === true) document.documentElement.classList.add('fz-perf');
    btn = el('button'); btn.id = 'fz-btn'; btn.type = 'button';
    btn.setAttribute('aria-label', 'Open Focuz AI help'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'fz-panel');
    btn.title = 'Focuz — ask anything'; btn.innerHTML = ICON;
    btn.addEventListener('click', function () { isOpen ? close() : open(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

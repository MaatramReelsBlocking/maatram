/* Focuz — Maatram help bot. AI answers (streamed from /api/focuz) for any question,
   with an offline FAQ matcher as instant chips and as the fallback when AI is unreachable.
   Loaded with <script defer src="/focuz-bot.js"> on every page. */
(function () {
  'use strict';
  if (window.__focuz) return; window.__focuz = true;

  var GREET = "yo, I'm Focuz 🥷 Maatram's AI. ask me anything fr: homework in any subject, exam plans, focus hacks, coding, or how Maatram works.";
  var MAIL = 'maatram97@gmail.com';

  /* ---- Knowledge base: every fact below is taken from the live site pages ---- */
  var KB = [
    // Basics
    { id: 'what', q: 'What is Maatram?', k: ['what is maatram', 'about', 'maatram', 'what does it do', 'purpose', 'app'],
      a: "Maatram is a free focus + screen-time app for students. it puts a cost, a pause and an audience between you and the feed: Focus Timers, App Gate with Hard Lock, Study Rooms, Screen Stats, a Leaderboard and Wellness, all on one points balance.", l: ['About Maatram', '/about.html'] },
    { id: 'free', q: 'Is Maatram free?', k: ['is it free', 'is maatram free', 'free', 'cost', 'price', 'paid', 'pay', 'subscription', 'money', 'ads', 'premium'],
      a: 'yep, 100% free and open source. no ads, no paid tier, no subscription. no catch fr.' },
    { id: 'account', q: 'Do I need an account?', k: ['account', 'need account', 'register', 'signup', 'sign up', 'guest', 'without login'],
      a: "nope. every tool opens without an account. sign in with Google only if you want your points saved and on the Leaderboard. listing a sports event also needs a sign-in.", l: ['Sign in', '/login.html'] },
    { id: 'signin', q: 'How do I sign in?', k: ['sign in', 'signin', 'login', 'log in', 'google', 'gmail', 'logout', 'sign out'],
      a: "Google sign-in only. open the Sign in page, tap Continue with Google, done. to sign out, tap your profile chip in the top bar → Sign out.", l: ['Sign in', '/login.html'] },
    { id: 'data', q: 'Where is my data stored?', k: ['data', 'privacy', 'stored', 'store', 'safe', 'track', 'spy', 'collect', 'personal'],
      a: "the screen-time numbers you type on Stats stay in your own browser. if you sign in, your name, photo and points are saved to your account so they can show on the Leaderboard. Study Room messages go through a public relay and aren't stored, so never drop personal details there.", l: ['Privacy policy', '/privacy.html'] },
    { id: 'who', q: 'Who built Maatram?', k: ['who built', 'who made', 'team', 'creator', 'ssvm', 'school', 'students', 'developer'],
      a: 'five class 10B students at SSVM School of Excellence, Coimbatore. inspired by Gen Z, made by Gen Z, made for Gen Z 🫡', l: ['About the team', '/about.html'] },

    // Points
    { id: 'points', q: 'How do points work?', k: ['points work', 'points', 'pts', 'score', 'earn', 'how to earn', 'reward', 'balance', 'lose points', 'penalty'],
      a: "everything runs on one points balance.\n**earn:** Pomodoro +25, Deep Work +100, Hard Lock +10 per 5 min locked, +10 after 10 min in a Study Room, +50 when your week is under your screen-time average, Wellness +25 per daily check (up to +100).\n**lose:** opening a social app on App Gate costs 10, getting struck out of a room costs 30." },
    { id: 'points-missing', q: "My points aren't saving", k: ['points arent saving', 'points not saving', 'points gone', 'points missing', 'points reset', 'lost points', 'points zero', 'not updating'],
      a: "points only save when you're signed in with Google, otherwise they live on this device only. also the monthly board starts fresh every month, but your all-time total keeps growing. check the All time tab on the Leaderboard.", l: ['Leaderboard', '/leaderboard.html'] },
    { id: 'leaderboard', q: 'How does the Leaderboard work?', k: ['leaderboard work', 'leaderboard', 'rank', 'ranking', 'top', 'board', 'monthly', 'all time', 'my rank'],
      a: 'the Leaderboard ranks real signed-in students by points, with a This month tab and an All time tab. no fake accounts, no paid boosts. pure grind 💪', l: ['Open Leaderboard', '/leaderboard.html'] },

    // Timers
    { id: 'timers', q: 'How do the Focus Timers work?', k: ['timer', 'timers', 'pomodoro', 'deep work', 'focus', 'session', 'break', '25', '90'],
      a: 'pick Pomodoro (25 min focus, 5 min break, +25 pts) or Deep Work (90 min focus, 15 min break, +100 pts) and hit Start. Space starts or pauses, R resets. points land when a focus session finishes.', l: ['Open Timers', '/timers.html'] },
    { id: 'timer-which', q: 'Pomodoro or Deep Work?', k: ['which timer', 'pomodoro or deep work', 'deep work or pomodoro', 'which is better', 'better', 'vs', 'compare', 'difference', 'better timer', 'choose timer'],
      a: "Pomodoro = short sprints, easy to start, frequent breaks. perfect when you're struggling to begin. Deep Work = one long no-distraction block for the hard stuff, and it pays the biggest single reward in Maatram.", l: ['Open Timers', '/timers.html'] },

    // App Gate / Hard Lock
    { id: 'gate', q: 'What is the App Gate?', k: ['app gate', 'gate', 'block', 'blocker', 'instagram', 'youtube', 'snapchat', 'tiktok', 'whatsapp', 'social media'],
      a: "App Gate keeps shortcuts to Instagram, Snapchat, TikTok, YouTube and WhatsApp behind a gate you control. opening one costs 10 points. arm Hard Lock and they're all out of reach till your focus window ends.", l: ['Open App Gate', '/app-gate.html'] },
    { id: 'hardlock', q: 'How does Hard Lock work?', k: ['hard lock', 'hardlock', 'lock', 'locked', 'unlock', 'lock duration', 'minutes'],
      a: "on App Gate, pick 5 to 90 minutes and press Lock. every app goes grey and un-clickable till the timer runs out. no exits, no shortcuts. you earn +10 pts for every 5 minutes (90 minutes = +180) 🔒", l: ['Open App Gate', '/app-gate.html'] },
    { id: 'hardlock-pc', q: 'Hard Lock on my computer?', k: ['hard lock on my computer', 'hard lock on laptop', 'computer', 'laptop', 'pc', 'desktop', 'chrome', 'browser block', 'block on laptop', 'instagram computer', 'block website'],
      a: 'yep, in Chrome. add the Maatram Hard Lock extension. while a Hard Lock started on the site is running, it blocks Instagram, Snapchat, TikTok, YouTube, X and Facebook in Chrome.', l: ['Get the extension', 'https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen'] },
    { id: 'extension', q: 'What does the Chrome extension do?', k: ['extension', 'chrome extension', 'web store', 'add to chrome', 'addon', 'plugin'],
      a: "Maatram Hard Lock is our Chrome extension. you start the lock on maatram.co.in and the extension blocks only while that lock is active. it collects no data.", l: ['Chrome Web Store', 'https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen'] },

    // Study room
    { id: 'room', q: 'How do Study Rooms work?', k: ['study room', 'room', 'friends', 'together', 'group', 'join', 'room code', 'code', 'seat'],
      a: "pick a name, share the room code with up to 4 friends and join. up to five people, timers synced live, room chat. if anyone opens a social app on App Gate, everyone sees the strike instantly 👀 stay 10 minutes for +10 pts.", l: ['Open Study Room', '/study-room.html'] },
    { id: 'strikes', q: 'What are strikes?', k: ['strike', 'strikes', 'struck out', 'kicked', 'three strikes', 'removed from room'],
      a: "every social app you open on App Gate during a room session is a strike everyone can see. three strikes and you're out, which costs 30 points. take a breath and come back locked in.", l: ['Open Study Room', '/study-room.html'] },
    { id: 'room-stuck', q: "Study Room won't connect", k: ['wont connect', 'room wont connect', 'study room not connecting', 'room not working', 'connecting', 'cant join', 'not connecting', 'room stuck', 'friends cant see'],
      a: "check everyone typed the exact same room code and that you're online. rooms run through a public relay, so a school or office network that blocks it can break the connection. try mobile data. still stuck? email the team.", mail: true },

    // Stats
    { id: 'stats', q: 'How do Screen Stats work?', k: ['screen stats', 'stats', 'screen time', 'statistics', 'usage', 'log', 'track screen', 'chart', 'weekly'],
      a: "type in your screen time for each app and save the day. you get today's total, a 7-day average and weekly charts. week under your average = +50 pts. the data never leaves your device.", l: ['Open Stats', '/stats.html'] },
    { id: 'stats-auto', q: 'Why is screen time manual?', k: ['screen time manual', 'why is it manual', 'automatic', 'automatically', 'track automatically', 'auto track', 'why manual', 'import', 'screen time api'],
      a: "social apps don't share usage data with other apps or websites, so Stats is logged by hand and kept on your device. on a computer, the Chrome extension counts time on blocked sites for Screen Stats." },

    // Wellness / Sports
    { id: 'wellness', q: 'What is Wellness?', k: ['wellness', 'meal', 'meal plan', 'diet', 'food', 'hydration', 'water', 'sleep', 'health'],
      a: "Wellness builds you a private 7-day meal plan from 80+ Indian meals (swap any meal), a daily protein and water guide based on ICMR-NIN guidelines, and four daily checks: meals, hydration, activity and sleep. each check pays +25 pts, up to +100 a day. your plan stays on your device.", l: ['Open Wellness', '/wellness/wellness.html'] },
    { id: 'sports', q: 'What is Sports Corner?', k: ['sports', 'sport', 'event', 'tournament', 'match', 'camp', 'sports corner', 'outdoor'],
      a: "Sports Corner lists local tournaments, camps and meet-ups posted by signed-in users. filter by city, sport and date. registration always happens on the organiser's own site. touch grass, literally ⚽", l: ['Open Sports Corner', '/sports.html'] },

    // Android
    { id: 'android', q: 'Is there an Android app?', k: ['android', 'apk', 'phone app', 'mobile app', 'download', 'install', 'play store'],
      a: "yes, Android 5.1 and above. it runs App Gate, Hard Lock and Maatram Shield natively, so blocking keeps working outside the browser. it's not on the Play Store, grab the APK from the site. no iPhone app yet.", l: ['Get the app', '/download.html'] },
    { id: 'not-installed', q: '"App not installed" error', k: ['app not installed', 'not installed', 'install failed', 'wont install', 'cant install', 'installation error'],
      a: "an older Maatram is still on the phone. version 1.1 is signed with a different key, so uninstall the old one first, then install again. open the APK from the Files app, not a chat preview.", l: ['Install guide', '/download.html'] },
    { id: 'playprotect', q: 'Blocked by Play Protect', k: ['play protect', 'blocked', 'harmful', 'unsafe', 'warning', 'virus', 'download anyway'],
      a: "Play Protect warns about anything not from the Play Store. tap More details → Install anyway. it's a warning about the source, not the file. you can check the file's SHA-256 on the download page if you're sus.", l: ['Install guide', '/download.html'] },
    { id: 'shield', q: 'Hard Lock does nothing on my phone', k: ['nothing on my phone', 'hard lock does nothing', 'not blocking on phone', 'shield', 'maatram shield', 'accessibility', 'not blocking', 'doesnt block', 'lock not working', 'hard lock not working'],
      a: "Maatram Shield is off, or the system killed it. go to Settings → Accessibility → Maatram Shield and turn it on. without Shield the timers run but nothing actually gets blocked.", l: ['Install guide', '/download.html'] },
    { id: 'restricted', q: 'Shield switch is greyed out', k: ['restricted setting', 'restricted', 'greyed out', 'grayed out', 'cant enable', 'financial information', 'allow restricted'],
      a: 'on Android 13+, go to Settings → Apps → Maatram → ⋮ → Allow restricted settings. then come back and turn on Maatram Shield in Accessibility.' },
    { id: 'samsung', q: 'Shield keeps turning off (Samsung)', k: ['shield turning off', 'keeps turning off', 'samsung', 'turns off', 'stops working', 'killed', 'battery', 'sleeping apps', 'keeps stopping'],
      a: "Samsung loves killing apps lol. keep it alive: lock Maatram in Recents, set Battery to Unrestricted, and remove it from Sleeping apps. then re-enable Shield in Accessibility." },

    // Misc
    { id: 'lag', q: 'The site is slow or laggy', k: ['slow', 'lag', 'laggy', 'performance', 'battery drain', 'heavy', 'hang', 'freeze'],
      a: "turn off ⚡ Performance (bottom-left button). that kills the background animations but every tool keeps working. it's already off by default on smaller phones." },
    { id: 'theme', q: 'Can I change the look?', k: ['change the look', 'change look', 'theme', 'dark mode', 'light mode', 'colors', 'customize', 'minimal', 'neon', 'design'],
      a: 'yep. tap ◐ Customize UI at the bottom-right to flip the whole site between Neon and Minimal Glass ✨' },
    { id: 'contact', q: 'Contact the team', k: ['contact the team', 'contact team', 'contact', 'email', 'support', 'help me', 'human', 'report', 'bug', 'feedback', 'complaint', 'suggestion'],
      a: 'hit up the team at ' + MAIL + ', or send a message from the feedback form on the Socials page.', l: ['Socials & feedback', '/socials.html'], mail: true },
    { id: 'socials', q: 'Maatram socials', k: ['maatram socials', 'your socials', 'instagram page', 'twitter', 'x account', 'linkedin', 'reddit', 'github', 'social handles', 'follow'],
      a: 'Instagram @maatram_official97, X @maatram_97, Reddit u/Maatram97, LinkedIn maatram.exe, and the source code on GitHub (MaatramReelsBlocking/maatram). follow us (then close the app and study 😅)', l: ['All socials', '/socials.html'] },

    // Study / focus tips
    { id: 'tip-start', q: "I can't start studying", k: ['cant start', 'procrastinate', 'procrastination', 'lazy', 'motivation', 'no motivation', 'dont feel like'],
      a: "shrink the first step till it feels silly: open the book and read ONE page. start one Pomodoro just for that page. starting is the hard part, once the timer's running you usually keep going.", l: ['Start a Pomodoro', '/timers.html'] },
    { id: 'tip-phone', q: 'How do I stop checking my phone?', k: ['stop checking my phone', 'checking my phone', 'checking phone', 'phone addiction', 'keep checking', 'scrolling', 'reels', 'shorts', 'doomscroll', 'distracted', 'addicted', 'cant stop'],
      a: "put distance between you and the phone: another room, or face down out of reach. arm a Hard Lock for your whole study block, and log screen time daily so you can watch it drop 📉", l: ['Arm Hard Lock', '/app-gate.html'] },
    { id: 'tip-focus', q: 'How do I focus longer?', k: ['focus longer', 'concentrate', 'concentration', 'attention span', 'lose focus', 'mind wanders'],
      a: "build it up like a muscle. Pomodoros for a week, then one Deep Work block a day for your hardest subject. keep a notepad nearby: random thought pops up → write it down → back to work.", l: ['Open Timers', '/timers.html'] },
    { id: 'tip-exam', q: 'Tips for exam prep', k: ['exam prep', 'exam', 'exams', 'test', 'revision', 'revise', 'boards', 'board exam', 'syllabus', 'study plan'],
      a: "test yourself instead of re-reading: close the book, write what you remember, then check. spread revision over several days instead of one long night. and plan tomorrow's topics before you stop today." },
    { id: 'tip-sleep', q: 'I study late and feel tired', k: ['study late', 'feel tired', 'tired', 'sleepy', 'late night', 'night study', 'sleep schedule', 'exhausted'],
      a: "sleep is literally when your brain saves what you studied, so cutting it costs you marks. phone out of bed, screens off a while before sleeping. Wellness has a daily sleep check to keep you honest.", l: ['Open Wellness', '/wellness/wellness.html'] },
    { id: 'tip-group', q: 'Studying with friends keeps going off track', k: ['study with friends', 'group study', 'friends distract', 'study group'],
      a: "agree on one goal before you start, then use a Study Room: shared timer, and everyone sees who opens a social app. chat in the breaks, not during focus.", l: ['Open Study Room', '/study-room.html'] }
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
    exams: 'exam', studying: 'study', u: 'you', r: 'are', ur: 'your', ya: 'you', distracted: 'distract', distraction: 'distract', distractions: 'distract' };
  var STOP = /^(the|a|an|is|are|do|does|i|my|me|to|of|in|on|it|how|what|can|you|for|and|or|this|that|with|be|there|any|please|pls|plz|hi|hey|hello|maatram|focuz)$/;

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
      if (text.trim() === nk) s += 3; // the whole message is exactly this keyword ("lol", "bye")
      if (nk.indexOf(' ') > 0) { if (text.indexOf(' ' + nk + ' ') >= 0) s += 2 + nk.split(' ').length; else {
        var parts = nk.split(' ').filter(function (p) { return !STOP.test(p); }), hit = 0;
        parts.forEach(function (p) { hit += wordHit(p, words); });
        if (parts.length > 1 && hit / parts.length >= 0.89) s += 1.5 + parts.length * 0.5;
      } }
      else if (!STOP.test(nk)) s += wordHit(nk, words) * (nk.length <= 3 ? 1.2 : 1.5);
    });
    return s;
  }
  function match(q) {
    var text = norm(q), words = text.trim().split(' ').filter(function (w) { return w && !STOP.test(w); });
    var r = KB.map(function (e) { return { e: e, s: score(e, text, words) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
    // stopword-only text ("how are you") can still hit a full phrase; else a bare "maatram" means the intro
    if (!r.length && !words.length && / maatram /.test(' ' + String(q).toLowerCase() + ' ')) return [{ e: KB[0], s: 2 }];
    return r;
  }
  window.__focuzMatch = match; window.__focuzKB = KB; // exposed for tests

  /* ---- UI (built on first open) ---- */
  var CSS =
    '#fz-btn{position:fixed;right:18px;bottom:74px;z-index:10000;width:52px;height:52px;border-radius:50%;border:1px solid rgba(52,211,153,.55);' +
    'background:linear-gradient(135deg,#34D399,#4E9BFF);color:#04120F;display:grid;place-items:center;cursor:pointer;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 4px rgba(52,211,153,.12);transition:transform .2s ease;padding:0}' +
    '#fz-btn:hover{transform:translateY(-2px) scale(1.04)}#fz-btn svg{width:100%;height:100%}' +
    /* Mascot: Mini Ronin. Blinks; on hover (or tap) the katana slices a phone in half; headband flutters while thinking */
    '.fz-av{display:block;width:100%;height:100%}.fz-av .w{fill:#F4FFFB}.fz-av .d{fill:#04120F}' +
    '.fz-av .bl{fill:none;stroke:#F4FFFB;stroke-width:3;stroke-linecap:round}.fz-av .hd{fill:none;stroke:#04120F;stroke-width:4.5;stroke-linecap:round}' +
    '.fz-av .tl{fill:none;stroke:#F4FFFB;stroke-width:2.6;stroke-linecap:round}.fz-av .br{fill:none;stroke:#F4FFFB;stroke-width:2;stroke-linecap:round}' +
    '.fz-av .eye{transform-box:view-box;transform-origin:32px 38px;animation:fzblink 5s infinite}' +
    '.fz-av .kat{transform-box:view-box;transform-origin:32px 35px}.fz-av .ph{opacity:0;transform-box:fill-box;transform-origin:center}' +
    '.fz-av .tail{transform-box:view-box;transform-origin:18px 29px}' +
    '#fz-btn:hover .kat,#fz-btn.slash .kat{animation:fzswing .9s cubic-bezier(.3,.7,.2,1)}' +
    '#fz-btn:hover .ph1,#fz-btn.slash .ph1{animation:fzph1 .9s ease-out}#fz-btn:hover .ph2,#fz-btn.slash .ph2{animation:fzph2 .9s ease-out}' +
    '.fz-busy .fz-hav .tail{animation:fzflut .35s ease-in-out infinite alternate}' +
    '@keyframes fzswing{0%{transform:none}28%{transform:rotate(-28deg)}52%{transform:rotate(78deg)}100%{transform:none}}' +
    '@keyframes fzph1{0%,22%{opacity:0;transform:scale(.5)}34%,50%{opacity:1;transform:none}100%{opacity:0;transform:translate(5px,-6px) rotate(-28deg)}}' +
    '@keyframes fzph2{0%,22%{opacity:0;transform:scale(.5)}34%,50%{opacity:1;transform:none}100%{opacity:0;transform:translate(-2px,8px) rotate(18deg)}}' +
    '@keyframes fzflut{from{transform:rotate(-6deg)}to{transform:rotate(9deg)}}' +
    '.fz-b.md>a{display:inline-block;margin-top:6px}' +
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
    'html.minimal .fz-av .d{fill:#0B0C0B}html.minimal .fz-av .w{fill:#F4F7F6}html.minimal .fz-av .hd{stroke:#0B0C0B}html.minimal .fz-av .bl,html.minimal .fz-av .tl,html.minimal .fz-av .br{stroke:#F4F7F6}' +
    'html.fz-perf #fz-panel{backdrop-filter:none;-webkit-backdrop-filter:none}html.fz-perf .fz-av .eye,html.fz-perf .fz-av .kat,html.fz-perf .fz-av .ph,html.fz-perf .fz-av .tail{animation:none!important}' +
    '@media(prefers-reduced-motion:reduce){#fz-btn,#fz-panel{transition:none}.fz-av .eye,.fz-av .kat,.fz-av .ph,.fz-av .tail{animation:none!important}}';

  var ICON = '<svg class="fz-av" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<g class="kat"><path class="bl" d="M21 46L58 9"/><path class="hd" d="M11 56l9-9"/><path class="hd" d="M17.5 45.5l5 5"/></g>' +
    '<g class="ph ph1"><rect class="w" x="44" y="42" width="10" height="8" rx="2"/><rect class="d" x="45.6" y="43.6" width="6.8" height="6.4" rx="1"/></g>' +
    '<g class="ph ph2"><rect class="w" x="44" y="50" width="10" height="8" rx="2"/><rect class="d" x="45.6" y="50" width="6.8" height="5" rx="1"/></g>' +
    '<circle class="d" cx="32" cy="35" r="16"/>' +
    '<path class="w" d="M18.1 27h27.8l1.8 5H16.3z"/>' +
    '<g class="tail"><path class="tl" d="M18 28q-7-1-12-8"/><path class="tl" d="M18 31q-8 2-13-2"/></g>' +
    '<path class="br" d="M22 33.6l7 1.8M42 33.6l-7 1.8"/>' +
    '<g class="eye"><ellipse class="w" cx="26.5" cy="38.6" rx="3.3" ry="2.5"/><ellipse class="w" cx="37.5" cy="38.6" rx="3.3" ry="2.5"/>' +
    '<circle class="d" cx="27.2" cy="38.8" r="1.4"/><circle class="d" cx="36.8" cy="38.8" r="1.4"/></g></svg>';

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
  var hist = [], busy = null;
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
  function pick(a) { return Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a; }
  /* 150+ extra topics live in focuz-kb.js, fetched the first time the chat opens */
  window.__focuzAddKB = function (list) { KB.push.apply(KB, list); };
  function loadKB() {
    if (document.getElementById('fz-kb')) return;
    var sc = el('script'); sc.id = 'fz-kb'; sc.src = '/focuz-kb.js?v=1'; sc.async = true; document.head.appendChild(sc);
  }

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
    var text = pick(e.a), m = el('div', 'fz-m fz-b md'), extra = '';
    m.innerHTML = md(text); log.appendChild(m); scrollEnd();
    if (e.l) {
      var a = el('a', null, e.l[0] + ' →'); a.href = e.l[1];
      if (/^https?:/.test(e.l[1])) { a.target = '_blank'; a.rel = 'noopener'; }
      m.appendChild(a);
      extra = ' [' + e.l[0] + '](' + e.l[1] + ')';
    }
    if (e.mail && !e.l) {
      var ml = el('a', null, 'Email ' + MAIL + ' →'); ml.href = 'mailto:' + MAIL;
      m.appendChild(ml);
    }
    remember('assistant', text + extra);
  }
  function offline(q, r) {
    if (r.length && r[0].s >= 1.5 && (!r[1] || r[0].s >= r[1].s * 1.25)) {
      answer(r[0].e);
    } else if (r.length) {
      say(pick(["hmm not 100% sure what you mean. one of these?", "wait, did you mean one of these?", "lowkey lost me there. try one of these?"]), 'b');
      chips(r.slice(0, 3).map(function (x) { return x.e.id; }), 'Did you mean');
    } else {
      var m = say(pick(["ngl my AI brain is taking a nap rn 😴 ask again in a sec and I'll answer properly.", "can't reach my AI side right now, give it a moment and try again."]) + ' for Maatram stuff tap one below, or email ' + MAIL + '.', 'b');
      var a = el('a', null, 'Open Socials & feedback →'); a.href = '/socials.html';
      m.appendChild(document.createElement('br')); m.appendChild(a);
      chips(['points', 'hardlock', 'room', 'android'], 'Popular questions');
    }
  }
  function setStatus(on) {
    status.innerHTML = '<i class="fz-dot' + (on ? '' : ' off') + '"></i>' + (on ? 'AI · ask anything' : 'AI busy · will retry');
  }
  function setBusy(ctrl) {
    busy = ctrl;
    if (panel) panel.classList.toggle('fz-busy', !!ctrl);
    send.classList.toggle('stop', !!ctrl);
    send.textContent = ctrl ? '■' : '➤';
    send.setAttribute('aria-label', ctrl ? 'Stop answer' : 'Send');
  }

  function ask(q) {
    q = q.trim(); if (!q || busy) return;
    say(q, 'u'); remember('user', q);
    var r = match(q);
    if (!window.fetch || !window.TextDecoder) { offline(q, r); return; }
    var ctx = r.slice(0, 3).map(function (x) { return '- ' + x.e.q + ' ' + [].concat(x.e.a)[0] + (x.e.l ? ' (' + x.e.l[1] + ')' : ''); }).join('\n');
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
      if (!text) { setStatus(false); m.remove(); offline(q, r); throw 'handled'; }
    }).then(function () {
      if (raf) cancelAnimationFrame(raf);
      if (!text) { m.remove(); if (!stopped()) { setStatus(false); offline(q, r); } return; }
      if (stopped()) text += ' …';
      setStatus(true); m.innerHTML = md(text); actions(m, text); scrollEnd();
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
    built = true; loadKB();
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
    btn.addEventListener('click', function () { btn.classList.remove('slash'); void btn.offsetWidth; btn.classList.add('slash'); isOpen ? close() : open(); });
    btn.addEventListener('animationend', function (e) { if (e.animationName === 'fzswing') btn.classList.remove('slash'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

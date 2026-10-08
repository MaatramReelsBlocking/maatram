# Maatram

**Action ⟹ Value**

Maatram is an open-source tool that helps students cut their own screen time — not by
nagging them, but by putting friction, points and other people between them and the app
they were about to open.

It started as a school business project at SSVM School of Excellence (class 10B, team of
five) and now runs as a live website, an Android app and a Chrome extension.

- **Live:** https://maatram.co.in
- **Blog:** [How to Stop Scrolling Reels: 5 Friction Tricks for Students](https://maatram.co.in/blog-stop-scrolling-reels.html) ([also on Medium](https://medium.com/@maatram97/how-to-stop-scrolling-reels-5-friction-tricks-for-students-433ddce8cfaa))
- **Contact:** maatram97@gmail.com

---

## Who it is for

Anyone who wants to spend less time on their phone, built with students in mind. Every tool
opens without an account; pages that award points show a small guest bar asking you to sign
in so the points are saved. Signing in is Google only.

---

## What it does

**App Gate + friction layer.** Opening Instagram, TikTok, Snapchat, YouTube, Facebook, X or
Reddit goes through a gate first: an escalating points toll per app per day, a dwell timer
that doubles with each approved open in the last hour, an intent meter (why are you opening
this, and for how long), a peer veto that lets study-room members add to your wait, and a
"was it worth it?" receipt the next time you try. Walking away pays you points back.

**Hard Lock.** Pick 5–90 minutes. On Android the block is enforced natively by an
accessibility service; the lock is written to `SharedPreferences`, so it survives the app
being killed and expires on its own.

**Timers.** Pomodoro 25/5 and Deep Work 90/15, wall-clock based so background throttling
can't cheat them. Wake lock, haptics, and a power-up screen at the end of each session.

**Study rooms.** Up to five people share a room code and sync over a public
MQTT-over-WebSocket broker (`broker.emqx.io`) — no backend required. The room code is the
channel, so anyone with the code can see the room's traffic. Timers, strikes, joins, leaves and chat
are all live. If someone opens a blocked app, everyone sees it.

**Stats.** Manual per-app entry, saved locally, charted per app and per week, with a weekly
bonus. Laptop time can be imported from the Chrome extension.

**Leaderboard + accounts.** Google sign-in via Firebase, real users only — no seeded
placeholder accounts. Monthly and all-time boards; name, photo and points are visible to
signed-in users.

**Wellness.** A private 7-day meal plan plus four daily checks (meals, hydration, activity,
sleep) worth +25 points each, up to +100 a day. The plan and checks stay on the device.

**Sports Corner.** Signed-in users list local sports events; register links go to the
organisers.

**Chrome extension — Maatram Hard Lock.** Published on the
[Chrome Web Store](https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen).
During a Hard Lock it blocks Instagram, Snapchat, TikTok, YouTube, X and Facebook in Chrome,
and it counts time on them for Stats. Source in `chrome-extension/`.

---

## Points economy

| Event | Points |
|---|---|
| Hard Lock completed | +10 per 5 minutes |
| Study-room session past 10 minutes | +10 |
| Walking away from the gate | +2 (max 3 per day) |
| Opening a social app through the gate | −10 |
| Friction toll, 1st–4th open of an app that day | −5 / −15 / −30 / −50 |
| Three strikes in a study room | points reduced |
| Pomodoro / Deep Work session finished | +25 / +100 |
| Wellness daily check | +25 each, max +100 per day |

Points are banked locally and written to Firestore through a queue that matches
`firestore.rules`: gains are paced at about 1 point per 6 seconds since the last gain, at
most +100 per write, with a ceiling of 3000 points per month; losses are at most −100 per
write with a floor of 0. The monthly board resets each month (past months are archived as
`m_YYYY-MM`), while lifetime points keep counting.

---

## Stack

Plain HTML, CSS and vanilla JavaScript — no framework. Each page is a flat file you can
open directly. The only build step: `index.js` and `theme.js` are terser-minified from
`index.src.js` and `theme.src.js` — edit the `.src.js` file, then run
`npx terser index.src.js -c -m -o index.js` (and the same for `theme`).

- **Auth + database:** Firebase (Google sign-in, Firestore)
- **Hosting:** Vercel
- **Study-room sync:** public MQTT broker over WebSocket
- **Android:** Capacitor wrapper, `com.maatram.app`, with native blocking by a Java
  `AccessibilityService` ("Maatram Shield"); the APK (v1.1) is published on `download.html`
- **Theming:** shared `theme.js`, two skins (neon / minimal glass), stored in `localStorage`
- **Analytics:** Microsoft Clarity (via `speed-insights.js`), Vercel Web Analytics and Vercel
  Speed Insights

---

## Repository layout

```
index.html          landing page + intro (script: index.src.js -> index.js)
timers.html         Pomodoro and Deep Work
app-gate.html       App Gate, friction layer, Hard Lock
study-room.html     5-person synced rooms
stats.html          screen-time entry and charts
leaderboard.html    monthly and all-time ranking by points
wellness/           Wellness meal plan and daily checks
sports.html         Sports Corner event listings
login.html          Google sign-in
download.html       Android APK download
socials.html        links and contact
about.html          team and editorial policy
blog.html           Updates
privacy.html        privacy policy
terms.html          terms of service
404.html            not-found page
auth-bridge.html    sign-in bridge
chrome-extension/   Maatram Hard Lock Chrome extension
theme.src.js        shared theme engine (minified to theme.js)
gate.js             guest bar for the app pages
firebase-config.js  public Firebase web config
speed-insights.js   Vercel Speed Insights / Web Analytics + Microsoft Clarity loader
firestore.rules     database rules — must be published in the Firebase console
docs/               deployment, rules and SEO notes
```

---

## Running it locally

No install, no server needed for the front end:

```bash
git clone https://github.com/MaatramReelsBlocking/maatram.git
cd maatram
open index.html          # or just double-click it
```

Sign-in, the leaderboard and cross-device sync need Firebase configured (below). Everything
else — timers, the gate, stats — works offline against `localStorage`.

### Firebase

1. Create a Firebase project and enable **Google** under Authentication → Sign-in method.
2. Enable **Firestore**.
3. Add your domain under Authentication → Settings → Authorized domains, or sign-in fails
   with `auth/unauthorized-domain`.
4. Publish `firestore.rules` in the console. The rules in this repo are the ones the app
   expects; the console does not pick them up automatically.
5. Put your own web config in `firebase-config.js` (`window.MAATRAM_FB`).

### Android

The Android project is not in this repository; the built APK is published on
`download.html`. On the phone, enable **Maatram Shield** once under Settings →
Accessibility. On Android 13+ a sideloaded build is blocked by "restricted settings" first:
Settings → Apps → Maatram → ⋮ → Allow restricted settings.

---

## Tests

The test suites run against jsdom with a fake MQTT broker and per-device storage, so
multi-user study-room behaviour can be exercised without any network.

```bash
npm install          # jsdom, dev-only
node test-site.js
node test-download.js
node test-security.js
node test-csp.js
node test-gate.js
node test-points.js
node test-sports.js
```

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues are labelled `good first issue`.
The short version: no framework, no new dependencies without a reason, rebuild `index.js` /
`theme.js` with terser after editing their `.src.js`, and every change should still open
from `file://`.

## Security

Found something that could hurt users? See [SECURITY.md](SECURITY.md). Please don't open a
public issue for it.

## License

MIT — see [LICENSE](LICENSE).

## Links

Instagram [@maatram_official97](https://www.instagram.com/maatram_official97/) ·
X [@maatram_97](https://x.com/maatram_97) ·
Reddit [u/Maatram97](https://www.reddit.com/user/Maatram97/) ·
[LinkedIn](https://www.linkedin.com/in/maatram-exe-10b295423/) ·
[GitHub](https://github.com/MaatramReelsBlocking/maatram)

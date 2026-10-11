# Maatram: full project context

Read this first in any chat or coding session about Maatram. It covers all repositories,
how they connect, the rules the code depends on, and the things that keep breaking.
Last updated 2026-10-11 from the code in each repository.

## 1. What Maatram is

- Free, open-source (MIT) focus and screen-time platform for students. Live at
  https://maatram.co.in (also https://maatram-website.vercel.app).
- Built by a team of five class 10B students at SSVM School of Excellence, Coimbatore.
  It started as a school business project.
- Tagline: "Bringing a change in you". README motto: "Action ⟹ Value". Voice: made by Gen Z
  for Gen Z. No ads and no paid tier.
- Approach: put friction, points and other people between the student and the app they were
  about to open, instead of nagging them.
- Contact: maatram97@gmail.com. Socials: Instagram @maatram_official97, X @maatram_97,
  Reddit u/Maatram97, GitHub MaatramReelsBlocking.
- No iPhone app.

## 2. Repositories (GitHub org `MaatramReelsBlocking`)

| Repo | What it is | Stack | Version |
|---|---|---|---|
| `maatram` | Website, the main product. It also holds an `api/` folder (Vercel functions), a copy of the Chrome extension, and the downloadable APK and zip | Plain HTML, CSS and vanilla JS, Firebase, Vercel | site; APK v1.1 |
| `maatram-android` | Original Android app: a Capacitor wrapper around the web pages, `com.maatram.app`, with the "Maatram Shield" Java AccessibilityService | Capacitor 6, Java | 1.0 (minSdk 22) |
| `maatram-hard-lock` | Standalone Kotlin Hard Lock app, `com.maatram.hardlock`. Sakura tree, garden, widget, linked devices, top-10 games | Kotlin, Jetpack Compose | 2.4.4-alpha (minSdk 26) |
| `maatram-chrome-extension` | "Maatram Hard Lock" Chrome extension, published on the Chrome Web Store | Manifest V3 | 1.5.1 |
| `maatram-windows` | Windows Hard Lock: kills apps and blocks sites through the hosts file | Tauri 2, Rust, one HTML UI | 0.1.0 |
| `maatram-hardlock` | Empty, with no files. Probably a duplicate of `maatram-hard-lock` | n/a | n/a |

Chrome Web Store: https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen

## 3. Website features (`maatram` repo)

| Page | Feature |
|---|---|
| `index.html` | Landing page with six tool cards and an FAQ. The script is `index.src.js`, minified to `index.js` |
| `timers.html` | Pomodoro 25/5 (+25 pts) and Deep Work 90/15 (+100 pts). Timers use the wall clock, a wake lock and haptics |
| `app-gate.html` | App Gate friction layer, Hard Lock (5–90 min), sakura tree, My garden, Premium Blocking (top 10 games), and the link code for linked devices |
| `study-room.html` | Up to five people per room code, synced over a public MQTT broker (`broker.emqx.io`, WebSocket). Covers timers, strikes, chat, joins and leaves |
| `stats.html` | Manual per-app daily log kept in `localStorage`, weekly charts, and a weekly bonus. Can import laptop time from the extension |
| `leaderboard.html` | Monthly and all-time boards, signed-in users only |
| `wellness/` | 7-day Indian meal plan (`recipes.json`), protein and water guide based on ICMR-NIN guidelines, and four daily checks. All data stays on the device |
| `sports.html` | Sports Corner. Signed-in users post local events |
| `download.html` | APK downloads (Capacitor v1.1 and Hard Lock 2.4.x) and the extension zip |
| `login.html`, `auth-bridge.html` | Google sign-in. The bridge is used by the Android app |
| `blog*.html`, `about`, `privacy`, `terms`, `socials`, `404` | Content pages |

Shared scripts:
- `theme.src.js`, minified to `theme.js`. Neon and Minimal Glass skins, the ⚡ Performance switch, and the ◐ Customize UI menu.
- `gate.js`, the guest bar shown on pages that award points.
- `firebase-config.js` (`window.MAATRAM_FB`, public config).
- `focuz-bot.js` and `focuz-kb.js`, the Focuz AI help bot.
- `sakura.js`, `focus-sound.js`, `speed-insights.js` (Clarity and Vercel analytics).

App Gate friction:
- Escalating toll per app per day.
- Dwell timer that doubles with each approved open in the past hour.
- Intent meter (why you are opening the app, and for how long).
- Peer veto from study-room members.
- "Was it worth it?" receipt the next time you try.
- Walking away pays points back.

### Serverless API (`maatram/api/`, Vercel Node functions)

- `api/link.js` handles **linked devices**, giving one Hard Lock across the website, the
  phone and Chrome.
  - Link code format: 8 characters matching `^[A-HJ-NP-Z2-9]{8}$`.
  - `GET /api/link?code=` returns `{end, minutes, by, now}`.
  - `POST /api/link {code, minutes, by}`, where `by` is `web`, `phone` or `chrome`.
  - Data is stored in Firestore `links/{code}` through the REST API. The end time comes from
    the server clock.
  - A running lock can only be extended, never shortened. The API returns 409 if a longer
    lock is already running.
  - Rate limit: 300 requests per minute per IP, because a whole school can share one IP.
  - Devices poll about once a minute.
- `api/focuz.js` runs the **Focuz** AI bot, which streams its answers.
  - Providers are tried in order: `GEMINI_API_KEY`, then `NVIDIA_API_KEY`, then
    `AI_GATEWAY_API_KEY` or Vercel OIDC.
  - If every provider fails, the bot falls back to its offline FAQ (`focuz-kb.js`).
  - Mascot: a mini ronin with a katana. Origins are restricted to maatram.co.in, the Vercel
    domain and localhost.

## 4. Points economy

Points are written from several pages. If you change one value, change it everywhere and
update the README table.

| Event | Points |
|---|---|
| Hard Lock completed | +10 per 5 min |
| Study-room session past 10 min | +10 |
| Walk away from gate | +2 (max 3 per day) |
| Open a social app through the gate | −10 |
| Friction toll for the 1st, 2nd, 3rd and 4th open of an app that day | −5 / −15 / −30 / −50 |
| Three strikes in a study room | seat ended, −30 |
| Pomodoro / Deep Work finished | +25 / +100 |
| Wellness daily check | +25 each, max +100 per day |
| Stats week under your average | +50 |

Points are banked locally, then written to Firestore through a queue that follows the rules.
The rules enforce these limits:

- Gains are paced at most 1 point per 6 seconds since the last gain, stamped with
  `awardAt == request.time`.
- At most +100 or −100 per write.
- At most 3000 points per month, and the balance never goes below 0.

The monthly board resets each month. Past months are archived as `m_YYYY-MM`. Lifetime
points keep counting.

## 5. Firebase

- Project ID: `maatram-859f4`. Sign-in is Google only.
- Firestore collections: `users/{uid}`, `events/{id}` (sports), `links/{code}`.
  Everything else is denied.
- Client-writable keys on a user document: `name`, `photo`, `points`, `lifetime`,
  `lastLogin`, `cycle`, `awardAt`. No email or contact field is ever allowed.
- `photo` must be a `*.googleusercontent.com` URL.
- Only `maatram97@gmail.com`, with a verified email, can take down sports listings.
  Bans and deletions are done in the Firebase console.
- **`firestore.rules` is not deployed by a git push.** Paste it into the Firebase console
  and press Publish every time it changes.
- Rules gotcha: reading a missing field throws an error; it does not return `undefined`.
  Always use `resource.data.get('field', default)`. This bug caused the class-code
  `permission-denied` incident (`docs/firebase-rules.md`).
- New domains must be added to the Firebase authorized domains list. Otherwise sign-in fails
  with `auth/unauthorized-domain`.

## 6. Android

### Capacitor app (`maatram-android`)

- `www/` holds copies of the web pages. `native.js` is the bridge.
- `AppBlockerPlugin.java`, `AppBlockerService.java` (Shield accessibility service) and
  `FrictionActivity.java` do the native work.
- Hard Lock state lives in `SharedPreferences`, so it survives the app being killed.
- Sign-in (v10 fix): Google refuses to run in a WebView.
  1. The app opens `auth-bridge.html` in Chrome.
  2. The page bounces back with `maatram://auth?idt=<token>`.
  3. The app calls `signInWithCredential`.
  - If the bounce is blocked, the user can copy and paste the code instead.
- Release check: `python3 preflight.py app-release.apk` (in the `maatram` repo).

### Kotlin Hard Lock (`maatram-hard-lock`)

- `BlockerService.kt` is the Focus Shield accessibility service. It sends blocked apps
  straight to the home screen and shows a "Locked" pill.
- During a lock it also bounces the Settings app and the installer screens.
- `AdminReceiver.kt` (Device Admin) blocks uninstalling.
- `BootReceiver.kt` keeps the lock across reboots.
- `LockManager.kt` holds the lock state. The lock is time-based, lasts 90 min at most, and
  cannot be cancelled.
- Other files: `Link.kt` (linked devices), `Games.kt` (top 10 games), `Garden.kt`,
  `SakuraArt.kt`, `PlantWidget.kt`, `Motivation.kt` (quotes), `LockEvents.kt`.
- Built with GitHub Actions (`.github/workflows/build.yml`), which produces the
  `maatram-hardlock-debug` artifact.
  - Signing secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
  - Without these secrets every build gets a new key, and updates fail with
    "App not installed".
- Known limits: safe mode, factory reset, and anything that needs Device Owner mode.

### Phone setup (both apps)

1. On Android 13+, open Settings → Apps → the app → ⋮ → **Allow restricted settings**.
2. Turn on the accessibility service.
3. On Xiaomi, Redmi and POCO, turn on Autostart and lock the app in Recents.

## 7. Chrome extension (`maatram-chrome-extension`, synced copy in `maatram/chrome-extension/`)

- MV3. Files: `background.js` (service worker), `popup.*`, `blocked.*`.
- Permissions: `declarativeNetRequest`, `storage`, `alarms` and `idle`.
- `externally_connectable` is limited to `https://maatram.co.in/*`. App Gate and Stats use it
  to talk to the extension, for example `GET_STATUS`, which returns the lock start time.
- Blocks Instagram, YouTube, TikTok, Snapchat, X and Facebook, plus user-added sites
  (`optional_host_permissions`, asked one site at a time).
- Counts minutes on the six sites while the user is not idle.
- Two-way sync with App Gate. Takes part in linked devices.
- When the extension changes, also update `maatram/chrome-extension/` and the zip
  (`maatram-hard-lock-extension-*.zip`) on `download.html`.

## 8. Windows (`maatram-windows`)

- Tauri 2 with Rust code in `src-tauri/src/main.rs` and `logic.rs`. `logic.rs` holds the
  unit-tested blocklists and hosts-file logic.
- The window is one file, `ui/index.html`.
- Asks for admin rights through `app.manifest`.
- Kills blocked `.exe` files and writes `MAATRAM` lines into the hosts file.
- Hides to the tray when closed.
- A watchdog process restarts the app if it is killed, and a sign-in task restarts it after
  a reboot.
- Lock lasts 90 min at most.
- Emergency cleanup: `Maatram-Restore.bat`, run as admin. The uninstaller hook
  (`hooks.nsh`) also ends any running lock.
- Built with GitHub Actions on `windows-latest`. Pushing a tag creates a Release.
- Known limits: DNS-over-HTTPS bypasses the hosts file, killing both processes at once ends
  the lock, and changing the clock changes the countdown.

## 9. Engineering rules

- **No framework and no build step.** Every page must open from `file://`.
- The only exception is minification. Edit `index.src.js` and `theme.src.js`, then run
  `npx terser X.src.js -c -m -o X.js`. Never edit `index.js` or `theme.js` directly.
- No new dependencies without a stated reason.
- Never commit secrets. The Firebase web key is public by design. Keystores and service
  accounts never go in a repository.
- Accessibility services are the most fragile code. Test on a real device and say which
  device in the PR.
- Check pages at 375, 768 and 1280 px, and with reduced motion turned on.
- Commit style: plain messages such as `fix: ...`.
- Tests (jsdom, fake MQTT): run `npm install`, then `node test-site.js`, `test-download.js`,
  `test-security.js`, `test-csp.js`, `test-gate.js`, `test-points.js`, `test-sports.js` and
  `test-focuz-bot.js`.
- Hosting: Vercel deploys automatically from `main`.
- After every push to `main`, the IndexNow workflow pings search engines.
- The `sports-update` workflow refreshes `sports-auto.json`.
- SEO notes: `docs/seo.md`, `llms.txt`, `sitemap.xml`. Extension UI pages are `noindex`.
- When a cached link changes, bump its cache-bust query, for example `?v=3`.
- Copy must be honest. Do not make up stats, users or claims.

## 10. Current state and open threads (as of 2026-10-11)

- Recent website work:
  - Premium Blocking on App Gate (top 10 games, logos in `assets/games/`, enforced through
    the phone app).
  - Blog post on stopping reels.
  - Sync with extension 1.5.1.
  - Linked devices.
- Hard Lock Android is in alpha: 2.4.4, build around 31.
- Windows is at v0.1, unsigned, so SmartScreen warns "Unknown publisher".
- `maatram-hardlock` is empty. Decide whether to delete it or use it.
- `CONTRIBUTING.md` mentions `test-roles.js`, which no longer exists. Class codes and roles
  were removed.

## 11. How to use this file

- **Claude Code:** this file is `CLAUDE.md` at the root of `maatram`, so it loads
  automatically.
- **claude.ai Project:** create a project named "Maatram", paste this file into Project
  knowledge or instructions, and start chatting.

# Maatram context (compact)

## Reply rules
- Be terse. No filler, no preamble, no recap. Answer first, then reason only if it is needed.
- Show the code diff or the exact lines. Never reprint whole files.
- Read only the files the task needs. Prefer a targeted search over reading a whole repo.
- Ask only when you are truly blocked. Otherwise pick the simplest fix and say what you chose.
- Never invent stats, users or claims. Mark gaps as `[[NEEDS: ...]]`.

## What
- maatram.co.in (also maatram-website.vercel.app): free MIT focus and screen-time app for
  students. It works by adding friction, points and peers before a distracting app opens.
- Built by 5 students, class 10B, SSVM School of Excellence, Coimbatore. No ads, no paid tier,
  no iOS app.
- Tagline: "Bringing a change in you". Voice: Gen Z, honest.
- Contact: maatram97@gmail.com. IG @maatram_official97, X @maatram_97, Reddit u/Maatram97.

## Repos (GitHub org `MaatramReelsBlocking`)
| Repo | What | Version |
|---|---|---|
| `maatram` | Website, plus `api/` Vercel functions, a copy of the extension, the APK and the extension zip | APK v1.1 |
| `maatram-android` | Capacitor 6 wrapper `com.maatram.app`, Java "Maatram Shield" accessibility service | 1.0 |
| `maatram-hard-lock` | Kotlin + Compose Hard Lock app `com.maatram.hardlock` | 2.4.4-alpha |
| `maatram-chrome-extension` | MV3 "Maatram Hard Lock", on the Chrome Web Store | 1.5.1 |
| `maatram-windows` | Tauri 2 / Rust Hard Lock (closes apps, blocks sites via the hosts file) | 0.1.0 |
| `maatram-hardlock` | Empty duplicate. Decide: delete or use | n/a |

## Website (`maatram`)
- `index` (script `index.src.js`): landing page.
- `timers`: Pomodoro 25/5 and Deep Work 90/15.
- `app-gate`: friction gate, Hard Lock 5–90 min, sakura tree and garden, Premium Blocking
  (top 10 games), link code.
- `study-room`: up to 5 people per room code, synced over MQTT `broker.emqx.io`.
- `stats`: manual daily log in `localStorage`, weekly chart.
- `leaderboard`: monthly and all-time boards.
- `wellness/`: meal plan and 4 daily checks, all data on the device.
- `sports`: event listings by signed-in users.
- `download`, `login`, `auth-bridge`, plus the blog and legal pages.

Shared files:
- `theme.src.js`: Neon and Glass themes, the ⚡ Performance switch.
- `gate.js`: guest bar on pages that award points.
- `firebase-config.js`: public web config.
- `focuz-bot.js` and `focuz-kb.js`: the AI help bot.
- `sakura.js`, `speed-insights.js` (Clarity and Vercel analytics).

Gate friction:
- Toll for each open of an app, rising through the day.
- Dwell timer that doubles with each approved open in the past hour.
- Intent prompt (why, and for how long).
- Peer veto from study-room members.
- "Worth it?" receipt on the next open.
- Walking away pays points back.

### API (Vercel Node)
- `api/link.js` handles linked devices: one lock shared by the website, phone and Chrome.
  - Link code: 8 characters matching `^[A-HJ-NP-Z2-9]{8}$`.
  - `GET ?code=` returns `{end, minutes, by, now}`.
  - `POST {code, minutes, by: web|phone|chrome}` starts or extends a lock.
  - Stored in Firestore `links/{code}`. The end time comes from the server clock.
  - A lock can only be extended. The API returns 409 if a longer lock already runs.
  - Devices poll once a minute.
- `api/focuz.js` streams Focuz bot answers.
  - Providers in order: `GEMINI_API_KEY`, then `NVIDIA_API_KEY`, then the AI Gateway.
  - If all fail, the bot uses the offline FAQ.

## Points
Points are written from several pages. Change a value everywhere, plus the README table.

| Event | Points |
|---|---|
| Hard Lock completed | +10 per 5 min |
| Study room session over 10 min | +10 |
| Walk away from the gate | +2 (max 3/day) |
| Open a social app | −10 |
| Toll, opens 1–4 of an app per day | −5 / −15 / −30 / −50 |
| 3 strikes in a study room | −30, seat ended |
| Pomodoro / Deep Work | +25 / +100 |
| Wellness check | +25 each (max +100/day) |
| Week under your average | +50 |

Rules enforce these limits:
- Gains paced at most 1 point per 6 s, stamped with `awardAt == request.time`.
- At most ±100 per write.
- At most 3000 per month. Never below 0.
- Monthly scores are archived as `m_YYYY-MM`. Lifetime points keep counting.

## Firebase (`maatram-859f4`, Google sign-in only)
- Collections: `users/{uid}`, `events/{id}` (sports), `links/{code}`. Everything else is denied.
- User document writable keys: `name`, `photo`, `points`, `lifetime`, `lastLogin`, `cycle`,
  `awardAt`. Never an email or contact field.
- `photo` must be a `*.googleusercontent.com` URL.
- Only maatram97@gmail.com can take down sports listings.
- **Rules deploy only from the Firebase console: paste, then Publish.** A git push does not
  deploy them.
- A missing field in rules throws an error. Always use `.get('f', default)`.
- New domains go in Firebase authorized domains, or sign-in fails with
  `auth/unauthorized-domain`.

## Android
### Capacitor app
- `www/` holds copies of the web pages. `native.js` is the bridge.
- Native code: `AppBlockerPlugin`, `AppBlockerService` (Shield) and `FrictionActivity`.
- The lock is saved in `SharedPreferences`.
- Sign-in: Chrome opens `auth-bridge.html`, which returns `maatram://auth?idt=`. The app then
  calls `signInWithCredential`. A paste-code fallback exists.
- Release check: `preflight.py`.

### Kotlin Hard Lock
- `BlockerService`: sends blocked apps home, and during a lock also bounces Settings and the
  installer.
- `AdminReceiver`: blocks uninstall.
- `BootReceiver`: keeps the lock across reboots.
- `LockManager`: max 90 min, cannot be cancelled.
- Other files: `Link`, `Games`, `Garden`, `SakuraArt`, `PlantWidget`, `Motivation`.
- Builds run in GitHub Actions. Signing secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
  `KEY_ALIAS`, `KEY_PASSWORD`. Without them each build gets a new key, and updates fail with
  "App not installed".

### Phone setup (both apps)
1. On Android 13+, allow restricted settings for the app.
2. Turn on the accessibility service.
3. On Xiaomi, Redmi and POCO, turn on Autostart.

## Chrome extension
- MV3. Permissions: `declarativeNetRequest`, `storage`, `alarms`, `idle`.
- `externally_connectable` is limited to maatram.co.in. Messages such as `GET_STATUS` keep
  App Gate in sync with the extension.
- Blocks Instagram, YouTube, TikTok, Snapchat, X and Facebook, plus sites the user adds (asks
  permission one site at a time).
- Counts active minutes on those sites for Stats.
- When the extension changes, also update `maatram/chrome-extension/` and the zip on
  `download`.

## Windows
- Rust code: `main.rs` (lock logic, watchdog, tray) and `logic.rs` (unit-tested blocklists and
  hosts file).
- UI: `ui/index.html`.
- Needs admin rights. Writes `MAATRAM` lines into the hosts file.
- A watchdog restarts the app if it is killed, and a sign-in task restarts it after reboot.
  Max lock 90 min.
- Emergency undo: run `Maatram-Restore.bat` as admin. Uninstalling also cleans up.
- Builds run in Actions on `windows-latest`. A git tag creates a release.
- Known limits: DNS-over-HTTPS bypasses the hosts file. The app is unsigned, so Windows warns
  "Unknown publisher".

## Rules
- No framework and no build step. Every page must open from `file://`.
- Edit `*.src.js`, then run `npx terser X.src.js -c -m -o X.js`. Never edit `index.js` or
  `theme.js` directly.
- No new dependencies without a stated reason. No secrets in repos. The Firebase web key is
  public by design.
- Test accessibility-service changes on a real device.
- Check pages at 375, 768 and 1280 px, and with reduced motion.
- Tests: `npm i`, then `node test-{site,download,security,csp,gate,points,sports,focuz-bot}.js`.
- Vercel deploys automatically from `main`. IndexNow and sports-update workflows run in
  Actions.
- When a cached link changes, bump its `?v=N`. Commit messages: `fix: ...` / `feat: ...`.

## Open items (2026-10-11)
- `CONTRIBUTING.md` mentions `test-roles.js`, which no longer exists.
- `maatram-hardlock` repo is empty.
- Hard Lock Android is still alpha. Windows is still v0.1.

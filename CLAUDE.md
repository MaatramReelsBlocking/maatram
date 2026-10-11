# Maatram context

## Reply rules
- Answer first and keep it short. No filler or recap.
- Show only the lines that changed, never whole files.
- Read or search only what the task needs.
- Ask only when blocked. Otherwise choose the simplest option and state the choice.
- Never invent facts. Mark gaps as `[[NEEDS: x]]`.

## Cowork
- Work inside the folder the user selects. Save deliverables there; do not paste them into chat.
- Plan multi-step jobs as a short checklist first, then run the whole checklist without
  stopping at each step.
- Batch independent steps.
- Confirm before deleting, publishing, or sending email or posts.

## About
- maatram.co.in is a free, MIT-licensed focus and screen-time app for students. It works by
  adding friction, points and peers.
- Built by 5 students in class 10B at SSVM School of Excellence, Coimbatore. No ads, no iOS
  app.
- Contact: maatram97@gmail.com. Instagram @maatram_official97, X @maatram_97.

## Repos (GitHub org MaatramReelsBlocking)
- `maatram`: website on Vercel. Also holds the `api/` functions, a copy of the extension,
  the APK v1.1 and the extension zip.
- `maatram-android`: Capacitor 6 app `com.maatram.app` with the Java Shield accessibility
  service.
- `maatram-hard-lock`: Kotlin and Compose app `com.maatram.hardlock`, v2.4.4-alpha.
- `maatram-chrome-extension`: MV3 extension on the Chrome Web Store, v1.5.1.
- `maatram-windows`: Tauri and Rust app, v0.1. Closes blocked apps and blocks sites through
  the hosts file.
- `maatram-hardlock`: empty.

## Website pages
- `index`: landing page.
- `timers`: Pomodoro 25/5 and Deep Work 90/15.
- `app-gate`: gate, Hard Lock (5–90 min), sakura tree, top-10 games, link code.
- `study-room`: 5 people per room, synced over MQTT (`broker.emqx.io`).
- `stats`: logs kept in localStorage.
- `leaderboard`.
- `wellness/`: data stays on the device.
- `sports`.
- `login` and `auth-bridge`.

## API
- `api/link`: one lock shared by web, phone and Chrome.
  - Link code: 8 characters matching `[A-HJ-NP-Z2-9]`.
  - `GET ?code=` returns the lock. `POST {code, minutes, by}` starts or extends it.
  - Stored in Firestore `links/`. Locks can only be extended (409 otherwise).
  - Devices poll once a minute.
- `api/focuz`: AI bot. Tries Gemini, then NVIDIA, then the AI Gateway, then an offline FAQ.

## Points
| Event | Points |
|---|---|
| Hard Lock | +10 per 5 min |
| Study room session over 10 min | +10 |
| Walk away from the gate | +2 (max 3 a day) |
| Open a social app | −10 |
| Toll, opens 1–4 of an app per day | −5 / −15 / −30 / −50 |
| 3 strikes in a study room | −30 |
| Pomodoro / Deep Work | +25 / +100 |
| Wellness check | +25 each (max 100 a day) |
| Week under your average | +50 |

- Firestore rules limit gains to 1 point per 6 s, ±100 per write and 3000 per month,
  and points never go below 0.
- If you change a value, change it on every page and in the README.

## Firebase (`maatram-859f4`, Google sign-in only)
- Collections: `users`, `events`, `links`.
- User doc keys: `name`, `photo`, `points`, `lifetime`, `lastLogin`, `cycle`, `awardAt`.
  No email field.
- **Rules deploy only when published in the Firebase console.**
- In rules, read fields with `.get('f', default)`. A missing field throws.

## Android
- Capacitor app sign-in: `auth-bridge` in Chrome, then `maatram://auth?idt=`, then
  `signInWithCredential`.
- Hard Lock app: an accessibility service blocks apps and the Settings screen. Device Admin
  stops uninstalls, and the lock survives reboots.
  - Locks last at most 90 min and cannot be cancelled.
  - Builds run in GitHub Actions. They need the `KEYSTORE_*` secrets, otherwise updates fail
    with "App not installed".
- Phone setup: on Android 13+ allow restricted settings, then turn on accessibility. On
  Xiaomi, also turn on Autostart.

## Chrome extension and Windows
- Extension:
  - Permissions: `declarativeNetRequest`, `storage`, `alarms`, `idle`.
  - Only maatram.co.in can connect to it (`GET_STATUS`).
  - When the extension changes, update `maatram/chrome-extension/` and the zip too.
- Windows:
  - Needs admin rights.
  - A watchdog restarts the app if it is killed.
  - Emergency undo: run `Maatram-Restore.bat`.
  - Browsers using DNS-over-HTTPS bypass the hosts-file block.

## Dev rules
- No framework. Pages must open from `file://`.
- Edit `*.src.js`, then run `npx terser X.src.js -c -m -o X.js`.
- No new dependencies and no secrets in the repo.
- Test accessibility changes on a real device.
- Check pages at 375, 768 and 1280 px.
- Tests: `node test-{site,download,security,csp,gate,points,sports,focuz-bot}.js`
- Vercel deploys automatically from `main`.
- When a cached link changes, bump its `?v=N`.

## Open items
- `CONTRIBUTING.md` mentions `test-roles.js`, which no longer exists.
- `maatram-hardlock` is empty.

## Agent tools
Some links arrived shortened. Each one marked NEEDS still needs its full URL.
- RUBRIC, command centre for AI agents: https://www.getrubric.app/
- Savvy Progress: github.com/JohnnyVizz/claude-… [[NEEDS: full URL]]
- Claude Skins: github.com/hellosverre/claude… [[NEEDS: full URL]]
- You Should Know: listed as a built-in Claude Code plugin with no repo. Enable it with
  `/plugin enable cc-plugin-you-should-know@builtin`.
- Filetree: github.com/data-goblin/claude… [[NEEDS: full URL]]
- Cache Tax: https://github.com/karanb192/cache-tax
- Blast Radius, an Anthropic sample: github.com/anthropics/claude-… [[NEEDS: full URL]]
- Reflect: github.com/BayramAnnakov/clau… [[NEEDS: full URL]]
- Terminal Browser: github.com/zenbu-labs/termina… [[NEEDS: full URL]]
- Replay Theater, an Anthropic sample: github.com/anthropics/claude-… [[NEEDS: full URL]]

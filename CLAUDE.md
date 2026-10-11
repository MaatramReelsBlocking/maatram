# Maatram

## Rules (cost)
- Keep each answer to about 300 words or fewer. Code goes in a diff or snippet, never a
  whole file.
- Read only the files the task names. Search with grep, not full reads. Don't explore.
- No subagents, no web search, and no re-reading unless asked.
- If a task needs more than 3 tool calls, list the steps and ask first.
- Don't invent facts. Write `[[NEEDS:x]]` when something is missing.
- Cowork: save output in the chosen folder and confirm before deleting or sending anything.

## Product
- maatram.co.in: free, MIT-licensed screen-time app for students. Built by a class 10B team
  at SSVM, Coimbatore.
- Contact: maatram97@gmail.com.
- Stack: plain HTML/CSS/JS, Firebase (`maatram-859f4`, Google sign-in), hosted on Vercel.
  No build step; pages open from `file://`.
- To change `index.js` or `theme.js`, edit the `.src.js` file, then run
  `npx terser X.src.js -c -m -o X.js`.

## Repos (org MaatramReelsBlocking)
- `maatram`: the website. `api/link` keeps one lock shared across web, phone and Chrome
  (stored in Firestore `links/`; locks can only be extended). `api/focuz` runs the AI bot.
- `maatram-android`: Capacitor app with a Java Shield accessibility service.
  `auth-bridge` handles sign-in.
- `maatram-hard-lock`: Kotlin lock app, v2.4.4-alpha. Builds in Actions and needs the
  `KEYSTORE_*` secrets.
- `maatram-chrome-extension`: MV3, v1.5.1. Copy changes into `maatram/chrome-extension/` and
  the zip.
- `maatram-windows`: Tauri/Rust app that blocks sites through the hosts file. Emergency
  undo: `Maatram-Restore.bat`.
- `maatram-hardlock`: empty.

## Pages
`timers`, `app-gate` (Hard Lock 5–90 min), `study-room` (MQTT, 5 people), `stats`,
`leaderboard`, `wellness/`, `sports`, `login`.

## Points
| Event | Points |
|---|---|
| Hard Lock | +10 per 5 min |
| Study room session over 10 min | +10 |
| Walk away from the gate | +2 (3 a day) |
| Open a social app | −10 |
| Toll, opens 1–4 | −5 / −15 / −30 / −50 |
| 3 strikes | −30 |
| Pomodoro / Deep Work | +25 / +100 |
| Wellness check | +25 (max 100 a day) |
| Week under your average | +50 |

- The rules cap points: 1 point per 6 s, ±100 per write, 3000 a month, never below 0.
- Change a value on every page and in the README.

## Firebase
- Collections: `users`, `events`, `links`.
- User keys: `name`, `photo`, `points`, `lifetime`, `lastLogin`, `cycle`, `awardAt`.
- Rules only go live when you publish them in the Firebase console.
- In rules, use `.get('f', default)`. A missing field throws.

## Tests
`node test-{site,download,security,csp,gate,points,sports,focuz-bot}.js`

## Claude Code mods
These need Claude Code 2.1.287 or later. They change the interface, not the answers, and
they don't run in Cowork.
- RUBRIC, agent command centre: https://www.getrubric.app/
- Savvy Progress: https://github.com/JohnnyVizz/claude-kit/tree/main/plugins/savvy-progress
- Claude Skins: https://github.com/hellosverre/claude-skins
- You Should Know: `/plugin enable cc-plugin-you-should-know@builtin`
- Filetree: https://github.com/data-goblin/claude-code-filetree
- Cache Tax: https://github.com/karanb192/cache-tax
- Blast Radius and Replay Theater: https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods
- Reflect: https://github.com/BayramAnnakov/claude-reflect
- Terminal Browser: https://github.com/zenbu-labs/terminal-browser (needs a kitty-graphics
  terminal; telemetry is on by default)

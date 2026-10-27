# Maatram

**Action ⟹ Value.** Maatram is a student screen-time and focus platform. It helps students cut down on distracting apps, build focus habits, and study with friends, with progress tracked through a points system.

Live site: https://maatram.co.in

## What it does

- **App Gate:** Opening a distracting app (Instagram, Snapchat, TikTok, YouTube, X, Facebook, Reddit and more) triggers a short pause. Each open costs points, and repeated opens cost more. Users can also state why they are opening the app.
- **Hard Lock:** Start a timed lock (5 to 90 minutes, plus "In the Mood" blocks of 2, 3 and 4 hours) that blocks distracting sites and apps until the timer ends. Completed locks earn points.
- **Focus timers:** Pomodoro (25/5) and Deep Work (90/15) timers. The timer keeps running across pages, and finished sessions award points.
- **Study Rooms:** Up to five people join a shared room by code. Everyone's timers and app-gate strikes sync live, and the room has a chat. Study Rooms are a Premium feature.
- **Screen-time stats:** Log daily per-app usage by hand and see per-app breakdowns and weekly trends. Data is stored locally in the browser.
- **Leaderboard:** Ranks users by productivity points. Only real users appear.
- **Roles:** Sign in with Google, then choose a persona: Student, Teacher or Parent. Teachers create classes with a join code, students join with that code, and parents link to a child's account. Parental controls are display settings only and do not restrict a device.
- **Wellness (in progress):** A guided plan flow covering goals, activity level and food preferences, producing a weekly meal plan. Users under 18 get no calorie targets or weight goals.

## Platforms

| Platform | Location | Notes |
|---|---|---|
| Website (PWA-style mobile layout) | This repo, deployed on Vercel | Plain HTML, CSS and JavaScript. Two themes: Neon and Minimal Glass. Performance mode for older devices. |
| Android app | `android/` (Capacitor 6, package `com.maatram.app`) | Wraps the website. Adds Maatram Shield, a native accessibility service that blocks apps during Hard Lock and runs the friction gate. |
| Chrome extension | `chrome-extension/` | Maatram Hard Lock on the Chrome Web Store. Blocks distracting sites while a lock is active. Store link: https://chromewebstore.google.com/detail/maatram-hard-lock/igcfbmdadjlibodcpaibklgeijdacmen |
| Android Hard Lock (standalone) | Separate repo: `maatram-hard-lock` | Kotlin app, Hard Lock only. APK built with GitHub Actions. |
| Windows Hard Lock | Separate repo: `maatram-windows` | Tauri app with a Rust backend and HTML front end. Linux (AppImage, .deb, .rpm) and macOS (.dmg) builds are planned. |

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript. Motion for animation.
- **Auth and database:** Firebase Authentication (Google sign-in) and Cloud Firestore. Security rules live in `firestore.rules`.
- **Study Room sync:** MQTT over WebSocket through a public broker. No custom backend.
- **Hosting:** Vercel, with auto-deploy from the `main` branch on GitHub.
- **Android:** Capacitor 6 with the app, haptics, keyboard, splash-screen and status-bar plugins.

## Running it locally

**Website**

1. Clone the repo.
2. Serve the folder with any static server. For example: `npx serve .`
3. Open the local URL in a browser.

Some features need a Firebase project. Add your own Firebase web config in the page scripts, then publish `firestore.rules` in the Firebase console. Google sign-in only works on authorized domains.

**Android app**

1. From the `android/` folder's parent, run `npm install`, then `npx cap sync android`.
2. Open the `android/` folder in Android Studio and run the app.
3. To use Google sign-in, add the app's package name and SHA-1 fingerprint (from `./gradlew signingReport`) to your Firebase project.

To share a build with others, make a release-signed APK. Debug builds are blocked by Google Play Protect on many phones.

**Maatram Shield (Android)**

After installing, go to Settings → Accessibility → Maatram Shield and turn it on. On Android 13 and later, sideloaded apps may first need "Allow restricted settings" from the app's info page.

## Project layout

```
index.html          landing page with intro animation
timers.html         Pomodoro and Deep Work timers
app-gate.html       App Gate and Hard Lock
study-room.html     shared study rooms
stats.html          screen-time logging and charts
leaderboard.html    points ranking
login.html          Google sign-in
roles.html          persona selection and classes
survey.html         user survey (ratings.html shows results)
premium.html        plans page (payments not yet live)
admin.html          admin tools
socials.html        social links and contact
how-it-works.html, about.html, faq.html, privacy.html   public pages
firestore.rules     Firestore security rules
theme.js, gate.js   shared theme and route-gate scripts
android/            Capacitor Android project
chrome-extension/   Maatram Hard Lock extension source
```

## Points

- Hard Lock: +10 per 5 minutes completed.
- Study Room session of 10 minutes or more: +10.
- Opening a social app through App Gate: −10 (the friction gate uses a separate escalating toll).
- Three strikes in a study room: points reduced.
- Weekly bonus when weekly screen time is below your average.
- Points are clamped per session and floored at zero.

## Contact

- Email: maatram97@gmail.com
- Instagram: @maatram_official97
- X: @maatram_97
- Reddit: u/Maatram97
- LinkedIn: maatram.exe
- GitHub: MaatramReelsBlocking/maatram

## Team

Ram Saravanan, Ashwanth Kumar, Ridhun S. and Vivan V R.

## License

<!-- Confirm license and repo visibility before publishing. -->

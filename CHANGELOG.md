# Changelog

All notable changes across **XercaiiGlobe** (API, web, and VS Code extension) since the last published extension release (**0.5.2**).

---

## 2026-05-28

### Extension — 0.5.8

- **Fix language resetting to "Unknown"** — moving focus to the integrated terminal, an Output panel, a webview/preview, or alt-tabbing away made VS Code report no active editor, which sent a heartbeat with `language: "Unknown"` and reset the "Currently Coding" language on your profile. The tracker now falls back to a visible text editor, so your language/file stays correct until you actually close the file.

---

## 2026-04-12

### Web — new pages & navigation

- **`/extensions` page** — download the `.vsix`, link to GitHub repo/releases, and view in-repo notes. Added a **"Extension"** nav item (Puzzle icon) in the navbar.
- **Leaderboards remodel** — cleaner layout matching the rest of the site; added **"Season"** period tab (UTC quarter); removed unused "top three" podium section. Global + Friends tabs, period chips, footer count.
- **Dashboard — referrals** — "Invite friends" card with **copy link** (shows "Copied!" feedback), your referral code, invite credit count, and a one-time **"Apply code"** input. Neutral button styles, dark input backgrounds.

### Web — globe

- **Live filters** — filter active users on the globe by **language** and/or **editor**. Rendered as a **button** (filter icon) in the bottom-right controls next to "Show offline users"; opens a dropdown with two `<select>` menus. Only visible when authenticated.

### Web — profiles

- **"Currently building" pin** — editable title + optional URL on your **edit profile** page (`/profile/{id}`), displayed read-only on your **public profile** (`/u/{username}`). Styled to match the "Profile Customization" section (same header weight, icon style, button styles). No colored border/gradient — consistent with other profile cards.
- **Spacing fix** — added a small `mt-2` / `mt-1.5` gap between the "Currently editing in {project}" line and the file/language badges in the **currently coding** sections (profile page, public profile, and globe sidebar).
- **Mutual friends** — when viewing another user's globe sidebar panel, a "X mutual friends · Alice, Bob…" line appears beneath the username (authenticated only).

### Web — DMs

- **Voice recording waveform** — while recording, a live **equalizer bar visualization** (frequency levels) animates in the composer area.
- **Voice preview** — after stopping the recording, a **playback preview** with play/pause and a discard (trash) button appears instead of auto-sending. You can listen, re-record, or send.
- **Voice bubble fix** — the `<audio>` element in sent message bubbles is now **constrained to the bubble width** and uses a dark-inverted theme so it doesn't show as an oversized white rectangle.

### API

- **Migration 011** — `building_wip_title`, `building_wip_url`, `referral_code` (unique), `invite_credits`, `referred_by_id` columns on `users`.
- **Referral system** — `PATCH /users/{id}` accepts `apply_referral_code` (one-time, +10 credits to inviter); auto-generates referral codes on login.
- **Season leaderboard** — `period=season` returns data from the start of the current UTC quarter.
- **Mutual friends** — `GET /friends/mutual/{user_id}` returns count + up to 12 mutual friends.
- **DM voice upload** — `POST /messages/dm/upload-voice` with magic-byte validation (webm/ogg/mp3).
- **Per-project analytics** — `GET /users/me/analytics/by-project`.
- **Editor/OS analytics** — `GET /users/me/analytics/editor-os`.

### Extension (0.5.3 → 0.5.6)

- **0.5.3** — `path_folders` field in heartbeats: folder breadcrumb from workspace root to the active file's parent (up to 32 segments). Gated by `showProjectName`.
- **0.5.4** — `project_tree` field: full workspace directory listing (max 520 nodes, depth 14), skips `node_modules`/`.git`/etc., omits `.env`/`.pem`/key files. 40-second cache per workspace folder. Server-side preference (`show_full_project_tree_public`) applied from heartbeat responses without extra requests. `initSocket` now completes before heartbeat loop starts.
- **0.5.5** — Packaging release: version bump, `User-Agent` update, new `.vsix` built and committed for the `/extensions` page download link.
- **0.5.6** — Same extension code as **0.5.5**; semver + `User-Agent` + fresh `.vsix` only (not a separate marketplace/GitHub **release**).

---

For **0.5.2** and older extension-only notes, see [`RELEASE_NOTES.md`](./RELEASE_NOTES.md).

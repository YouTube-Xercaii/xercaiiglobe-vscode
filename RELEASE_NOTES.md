# XercaiiGlobe — release notes

Release notes for **users and contributors**: what changed across the **website**, **API**, and **VS Code / Cursor extension**, and why it matters.

**Extension version:** **v0.5.8** (May 28, 2026)  
**Last published extension baseline:** **v0.5.2** (April 9, 2026)  
Everything in the sections below is **new since v0.5.2** — web, API, and extension together.

---

## Release overview

This is a major platform update, not just an extension patch. Since the last published extension (**0.5.2**), DevGlobe gained:

- A full **signed-out marketing landing** with live community stats, leaderboards preview, and plugin showcase
- A complete **Communities** product (Discord-style servers, channels, voice, bots, moderation)
- **Performance work** across profiles, developers directory, dashboard, analytics, and globe
- A stronger **friends & messaging** experience (full-page layout, voice DMs, calls, mutual friends)
- A **plugin/editor ecosystem** with live release status, waitlists, admin publishing, and per-editor install guides
- **Richer profiles**, **dashboard analytics**, **projects/showcase**, **auth/settings**, and **admin** tooling

Attach **`xercaiiglobe-0.5.8.vsix`** to the GitHub release when publishing.

---

## Signed-out landing & marketing

### New default experience when you’re not signed in

- **`/`** now shows a **marketing landing page** for guests; signed-in users still land on the **live globe**
- **`/globe`** — guest-explorable map route (spinning preview globe, marker clustering)
- **Hero section** — preview globe, “How it works” steps (install plugin → keep coding → show on the globe), CTAs to sign in and explore
- **“The community, in numbers”** — live dashboard-style stats with online-now gauge and green/red trend deltas
- **Leaderboard preview** — weekly global top builders snippet linking to **`/leaderboards`**
- **“Ready to Light Up”** — plugin tile grid (16 on landing, full list at **`/plugins`**)
- **New static pages:** **`/features`**, **`/faq`**, site footer with navigation
- **Copy protection** on landing, globe, leaderboards, and activity views (`select-none`)
- **Sign-out redirect** — signing out returns you to **`/`** (the landing page), not whatever page you were on
- Scroll and navigation polish: removed jittery scroll-snap, faster first paint, warmed caches

---

## Communities

### Full Discord-style communities product

**Hub & discovery**

- **`/communities`** — your servers, discover tab, cross-device sync (migrated from localStorage to API with cold-start retry)
- **`/communities/new`** — creation wizard with default channels, server tag (A–Z, up to 8 chars) + icon badge
- **`/communities/join`** — invite-link join flow

**Server room (`/communities/[slug]`)**

- Real **text chat** with paginated history, edit/delete, reactions (live across channels), optimistic UI
- **Text + voice channels**, **categories**, drag-reorder channels, channel settings modal
- **Private channels** and **`view_channel`** permission hiding
- **Role system** — create, reorder (drag), per-role and per-channel permissions (Discord-style hierarchy)
- **Members list** grouped by role; mobile members drawer; bots shown in members
- **Presence & typing** — live online indicators and typing relay (Redis-backed across API workers)
- **Attachments & embeds** in messages; **mentions** including **`@everyone`** / **`@here`** with permission gates
- **Slash command picker**; built-in bots (welcome, automod, help) + **custom bots** at **`/communities/bots`**
- **WebRTC voice channels** — voice overlay, last-channel memory, voice ring indicator
- **Moderation** — kicks, bans, reports, moderation UI, server settings, welcome screen, custom server icon
- **Hub/server menus** — context menus, server dropdown, blocks management, popovers
- **DMs from server context**; community **server tags as profile flair** on adopted tags
- **Privacy toggles** for community-related settings synced with API

---

## Performance & speed

### “Show last visit instantly, refresh in background”

- **Developers directory (`/developers`)** — cache-first listing; no more 10-second low-opacity wait; click-through works immediately while data refreshes
- **Communities hub** — cached server list with background refresh
- **Profiles** — request dedupe, SWR caches, bundled profile insights, calmer prefetch, faster shell paint
- **Globe side panel** — cache warm + prefetch fixes; faster live activity fetch
- **Dashboard (`/dashboard`)** — instant load from 24h local cache; background stats refresh
- **Detailed Analytics (`/dashboard/analytics`)** — instant cached charts; daily range changes only refetch the daily series (not all four charts); no more 5–10s “Updating chart…” stalls
- **Currently Coding box** on profiles — loads from cache immediately instead of skeleton placeholders for several seconds
- **API-side** — faster stats, directory, communities, and activity queries; session/heartbeat DB indexes; wrapped streak N+1 fix

---

## Friends, DMs & calls

- **Full-page `/friends`** layout with CustomSelect sorting
- **`/messages/[userId]`** — layout/height fixes, image messages, **code snippets in DMs**
- **Voice DMs** — live waveform while recording, playback preview before send, properly styled audio bubbles
- **Mutual friends** — count + names on globe sidebar and public profiles
- **Call UI polish** — web-initiated calls sync with extension; Redis-backed signaling for multi-worker deploys
- **DM privacy** — `dms_enabled`, allow/block non-friend DMs (settings + API enforcement)
- **Typing indicators** in DMs (`dm_typing` / `dm_peer_typing`)

---

## Profiles & identity

- **Live profile updates** over WebSocket (`user_profile_updated`)
- **Tech stack editor** on edit profile; Devicon-backed language/editor icons sitewide
- **“Currently building” pin** — editable title + URL on edit profile, read-only on **`/u/{username}`**
- **Project path modal** — folder breadcrumb from extension `path_folders` heartbeats
- **Full project tree modal** — opt-in workspace tree from extension `project_tree` heartbeats (privacy toggle on profile)
- **Community/server tag flair** on profiles when you adopt a server tag
- **Cosmetics** — avatar effects, accent shop, badges, equip flow; **`/dashboard/cosmetics`**
- **My Data backup card** — JSON export/import of account data
- **Achievements v2** — 19 new achievements tied to projects, snippets, comments, votes, level-ups
- **Email digest** preference persistence in settings (weekly recap UI; delivery pipeline still pending)
- **Share modal** on profiles; developer spotlight layout at **`/developers/[userId]`**
- **Spotify sync** and session-vs-heartbeat stats on profile insights

---

## Dashboard & analytics

- **`/dashboard`** — coding stats summary, **Coding Duels** (accept/decline/cancel), **Coding Goals** widget, referral invite card (copy link, apply code, credits)
- **`/dashboard/analytics`** — summary cards (total time, daily average, current/longest streak, peak day, days active, top language %, busiest hour), **Weekly Momentum** banner, **Coding Time** area chart, **Languages Over Time** stacked chart, **Most Active Hours** heatmap, **Session Lengths** bar chart, **Coding by Weekday** bar chart
- **`/dashboard/api-keys`** — dedicated API key page (reveal/hide/copy/regenerate, account ID, connected live editors)
- Dashboard links to **Editor extensions** → full **`/plugins`** page (not just VS Code)
- **Referrals** — auto-generated codes, one-time apply, +10 credits to inviter
- **Per-project analytics** and **editor/OS analytics** endpoints powering future UI

---

## Plugin & editor ecosystem

- **`/plugins`** — searchable directory (VS Code, Cursor, Zed, Neovim, Windsurf, JetBrains suite, Claude Code, Codex, and more); unified neutral tile grid
- **`/plugins/[slug]`** — per-editor install page with **Live / Coming soon** status (polls admin publish without refresh), **Notify me** waitlist, **editor-specific install steps** (not generic VS Code steps for Claude Code, JetBrains, etc.)
- **`/plugins/request`** — request support for a missing editor (name + reason → admin review queue)
- **`/extensions`** — download `.vsix`, GitHub links, in-repo notes; navbar **Extension** item
- **Admin → Editors tab** — publish unreleased editors, edit blurb/install markdown, review support requests (accept/decline → notification)
- **Waitlist notifications** — when an editor goes live, users who clicked **Notify me** get an in-app notification

---

## Globe & developers directory

- **Live filters** — filter globe markers by **language**, **editor**, and **platform** (authenticated)
- **Guest globe** at **`/globe`** with spin + clustering; signed-in globe stays at **`/`**
- **Color vs dark basemap** preference in **`/settings`**
- **Mobile burger menu** for globe controls; heatmap UI polish on activity views
- **Developers directory (`/developers`)** — glass filter popover (language, editor, platform, online), Online/Offline pills matching globe sidebar
- **Inline project popup** on globe markers; improved color-map paint when idle
- **Community insights stats** endpoint powering landing “community in numbers” aggregates

---

## Leaderboards, activity & notifications

- **`/leaderboards`** remodel — Global + Friends tabs, period chips (including **Season** = UTC quarter), cleaner layout, avatar polish
- **`/activity`** — Active Developers live list with filters
- **`/notifications`** — deep links for all notification kinds (friends, achievements, editor releases, community invites, etc.); mobile panel fixes
- **`/wrapped`** — weekly recap experience page

---

## Projects, showcase & snippets

- **Redesigned `/showcase`** with project detail **`/projects/[slug]`** — makers, media, updates, votes, share
- **Create/edit** — **`/projects/new`**, **`/projects/[slug]/edit`** with logo upload, maker autocomplete, comments
- **Snippets** — **`/snippets/new`**, **`/snippets/[snippetId]`**, edit page, **`/showcase/snippets`** gallery
- Persistent logo/media uploads (survive redeploys); upvote sync; showcase filters row

---

## Auth, settings & legal

- **NextAuth** — Google, GitHub, Credentials (+ existing Discord); **`/auth/signin`**, **`/auth/callback`**
- **Welcome-auth modal** for gated CTAs; **`/welcome`** onboarding checklist
- **`/settings`** — globe theme (color/dark), globe visibility (public / anonymous fuzz / hide), community tag settings, email digest, danger zone
- **`/tos`** and **`/privacy`** legal pages
- **Delete account** — typed username confirmation; split danger zone styling
- Login by **username or email**; OAuth auto-fills empty social links
- Site theme locked to **dark** (light/system removed for consistent chrome)

---

## Admin panel

- **`/admin`** tabs: **Overview**, **Blog**, **Users**, **Editors**, **Maintenance**
- **Ban system** + modal; **maintenance mode** toggle
- **Delete user accounts** with username confirmation (full data removal)
- **Staff guard** — platform admins protected from ban/delete by non-admins
- **Blog admin** — non-scrolling editor, cover preview, reactions UI
- **Editors admin** — publish flow, waitlist counts, support request review
- UI polish: readable search, solid input backgrounds, softer borders

---

## API backend (highlights)

- **Communities REST + Socket.IO** — full server/channel/message/role/bot/voice backend with Redis presence
- **Editor release system** — `editor_meta`, waitlists, support requests, publish notifications
- **Notifications system** — CRUD, preferences, hooks across friends, achievements, blog, communities, editors
- **Referrals, season leaderboard, mutual friends, DM voice upload** — migration 011+ fields and endpoints
- **Profile insights**, **community-insights stats**, **account JSON export/import**
- **Security hardening** — JWT room joins, rate limits, CORS tighten, DM privacy enforcement
- **Performance** — batched stats/directory queries, message auth lightening, DB indexes

---

## VS Code / Cursor extension (v0.5.3 → v0.5.8)

### v0.5.8 — Fix language resetting to “Unknown”

When focus moved to the **terminal**, **Output**, a **webview**, **Settings**, or another app, VS Code reported no active editor and heartbeats sent **`language: "Unknown"`**. The tracker now **falls back to a visible text editor** so **Currently Coding** stays correct until you close the file.

### v0.5.7 — Broader editor detection & language names

- **`getEditorName()`** recognizes Windsurf, Antigravity, Claude Code, VS Code Insiders, JetBrains IDEs, Zed, and more (see table in older notes)
- **`language.ts`** — **80+** `languageId` → display name mappings (e.g. `typescriptreact` → **TypeScript React**)

### v0.5.4–0.5.6 — Project tree heartbeats & packaging

- **`path_folders`** breadcrumb in heartbeats (powers web folder path modal)
- **`project_tree`** opt-in full workspace scan (520 nodes max, skips secrets/`node_modules`; 40s cache)
- **`liveTreePrefs`** — `show_full_project_tree_public` from heartbeat response (no restart needed)
- **`initSocket()` awaited before heartbeats** — prefs and call socket ready on first ping
- **0.5.5 / 0.5.6** — VSIX packaging for **`/extensions`** download page

### v0.5.3 — Stay online without an active editor

- Heartbeats continue when the window is focused but no editor is active (welcome page, settings UI)
- Window focus + workspace folder change listeners with immediate heartbeats

---

## v0.5.2 — April 9, 2026 *(last published Marketplace release)*

### API key saved everywhere VS Code looks

Signing in or pasting an API key now writes to **User**, **Workspace**, and **Workspace Folder** configuration scopes via **`setApiKeyEverywhere()`**, so multi-root workspaces and folder-level overrides all see the same key. **Sign out** clears all scopes with **`clearApiKeyEverywhere()`**.

---

## v0.5.0 — April 8, 2026

### What changed

This release is mostly about **correct production URLs** on Render. The old defaults used hostnames like `XercaiiGlobe-web.onrender.com` / `XercaiiGlobe-api.onrender.com`, which do not match how the live services are actually named. That broke **Open Dashboard**, confused **new installs**, and made the default API base wrong unless you had already overridden settings.

#### Web app (dashboard)

- **`XercaiiGlobe: Open Dashboard`** (Command Palette) and the sidebar **Open Dashboard** action now open:
  - `https://devglobe-web.onrender.com/dashboard`
- **Sign in with Discord / get API key** (`auth.ts`) uses the same web origin:
  - `https://devglobe-web.onrender.com`  
  so the browser lands on the real dashboard where keys are shown.

#### API (heartbeats, REST, Socket.IO base)

- Default **`xercaiiglobe.apiUrl`** is now:
  - `https://devglobe-api.onrender.com`
- That default is defined in:
  - Extension **settings** (`package.json` `contributes.configuration`)
  - **Runtime fallback** when the setting has never been written (`config.ts`)

The extension still appends `/api/v1` for REST and uses the configured base for Socket.IO (see `api.ts`, `socket.ts`)—only the **hostname** changed, not the API shape.

#### Telemetry string

- Outgoing HTTP requests use  
  **`User-Agent: XercaiiGlobe-VSCode/0.5.0`**  
  (was stuck on an old `0.1.0`-style string), so support and logs can tell which extension build is talking to the API.

### Configuration & migration

| Situation | What to do |
|-----------|------------|
| **Fresh install** | You get the `devglobe-*` URLs automatically. Sign in from the sidebar, paste your API key, done. |
| **You already set `xercaiiglobe.apiUrl`** | Your saved value **wins**. If you still point at an old hostname, update it to `https://devglobe-api.onrender.com` (no trailing slash required). |
| **Open Dashboard still wrong** | You’re on ≥ 0.5.0; the command is hardcoded to `devglobe-web`. If an old build is installed, update the extension from the Marketplace / VSIX. |
| **Custom domain later** | Change **Settings → XercaiiGlobe → Api Url** (and we’ll adjust defaults again in a future release once the stack moves). |

### Files touched in this release (for maintainers)

- `package.json` — version `0.5.0`, default `apiUrl`
- `src/extension.ts` — Open Dashboard URI
- `src/auth.ts` — `FRONTEND_URL` for sign-in flow
- `src/config.ts` — fallback when setting is unset
- `src/api.ts` — `User-Agent`
- `README.md`, `CHANGELOG.md` — user-facing summary

---

## v0.4.6

### Problem

Calls could be **started from the website** while the extension only listened for certain Socket.IO paths. The VS Code/Cursor side sometimes **never entered “in call” state**, so code-share buttons, `xercaiiglobe.inCall`, and status UI did not match the web app.

### What we did

- **`call_accepted`** (and related signaling) is also delivered via the user’s **personal Socket.IO room**, not only the narrow call flow the extension assumed.
- **`callHandler.ts`** listens for `call_accepted`, reconciles **`call_room`** when the payload includes it (or derives a stable room id from sorted user ids), sets **`setSocketCallRoom`**, and avoids **double-processing** if the extension already thought it was in a call.
- Result: **web-initiated calls** and **extension-initiated calls** both converge on the same in-call state, so **Share Code**, status bar, and sidebar stay consistent.

---

## v0.4.5

### Faster offline / presence

- When you **stop tracking**, **sign out**, **disable the extension’s tracking toggle**, or otherwise go away, the service gets a **faster, more reliable offline signal** so the globe does not keep showing you as “live” longer than it should.

### Heartbeat failure visibility

Heartbeats run on a **3-second** interval while you’re authenticated and “active” (see `heartbeat.ts`).

- **First heartbeat after connect** that fails triggers an **information/warning** so you know immediately that the API key or network may be wrong—otherwise you might code for an hour and never show up on the globe.
- After **several consecutive failures** (with a counter and a “don’t spam” flag), you get a stronger **warning** that heartbeats are failing repeatedly and activity may not appear.

Together, this cuts down on “it works on my machine but the globe says I’m dead” confusion.

---

## v0.4.4

### Editor name in heartbeats

- Heartbeat payloads include an **`editor`** field built from `vscode.env.appName`:
  - **Cursor** when the app name matches Cursor
  - **VSCodium** when it matches VSCodium
  - **VS Code** otherwise  
- That flows through **`getEditorName()`** in `heartbeat.ts` into **`buildPayload()`**, so dashboards and analytics can distinguish **stock VS Code vs forks** instead of lumping everyone together.

### Heartbeat refactor

- Heartbeat scheduling, failure counting, and immediate “bootstrap” heartbeat (`sendImmediateHeartbeat`) were **cleaned up** for readability and safer edge cases (no behavior change intended beyond clearer structure and the editor labeling above).

---

## v0.4.3

### Stability pass: calls + activity

Focused fixes so **call room detection**, **mute sync**, **code sharing**, and **live activity** on the globe **stay aligned** between:

- the **browser** (dashboard / call UI), and  
- the **extension** (Socket.IO listeners, local call state, share toggles).

This was a **integration hardening** release: fewer desyncs mid-call, fewer cases where the UI thought you were sharing but the peer did not, and better behavior when switching context during an active session.

---

## v0.4.2

### Code share receiver

- When your **peer** shares code, the extension can **receive** and surface that stream (including **webview**-based viewing paths in the handler stack) so the feature is not “send-only.”

### Mute / deafen sync

- **`call_peer_mute_state`** updates local state and **status bar** affordances so you can see when the other side is muted, in line with the web experience.

### Desktop-only code sharing

- **Starting** code share checks **`vscode.env.uiKind`**: on non-desktop hosts (e.g. some web VS Code scenarios), starting share is **blocked** with a clear message, while **stopping** share if already active remains safe.
- Rationale: screen/editor capture and extension APIs are not reliable in all **web** shells; better to refuse than to fail silently.

### Call state for web-started calls (early fix)

- Related fix: **extension call state** detection was improved so **dashboard-started** calls still allow **Toggle Code Sharing** once the room is known (follow-up refined further in **0.4.6**).

---

## v0.4.1

### Make code sharing discoverable during calls

Before this release, code sharing existed but was easy to miss. **0.4.1** added obvious entry points:

#### Status bar

- A **`$(broadcast)`** status bar item appears while **`xercaiiglobe.inCall`** is true.
- Click toggles **Share Code** / **Stop sharing**; active sharing uses a more visible **warning-style** treatment so you don’t forget you’re broadcasting.

#### Editor title bar

- **Editor/title** menu contribution: share toggle in the **editor toolbar** during calls (`when`: `xercaiiglobe.inCall`).

#### Context keys

- **`xercaiiglobe.inCall`** is set/cleared on join/leave so **menus, keybindings, and UI** can conditionally show call-only actions.

#### Command

- **`XercaiiGlobe: Toggle Code Sharing`** remains the palette entry; the new UI is shortcuts to the same behavior.

---

## v0.4.0 — major feature baseline

### Voice calling (WebRTC)

- **Peer-to-peer voice** with other XercaiiGlobe users, coordinated from the **web dashboard** and signaled through the **server**.
- The extension participates in **signaling** and **notifications**: incoming call prompts, accept/reject flows, call end, and messaging like “X joined the call.”

### Live code sharing

- Share the **active editor** (or focused file context, per implementation) with your **call peer** in near real time.
- Tied to a stable **`call_room`** id shared between web and extension.

### Socket.IO

- Persistent **Socket.IO** connection after auth (`socket.ts`, `extension.ts` **`initSocket`**):
  - **Incoming calls** (`call_incoming`, etc.)
  - **Call lifecycle** (`call_accepted`, end/decline paths)
  - **Mute / speaking**-related events for UI sync
  - **Code share** start/update/stop events

### New command

- **`XercaiiGlobe: Toggle Code Sharing`** — palette-accessible share toggle (later augmented by status bar + editor chrome in **0.4.1**).

### Docs shipped with 0.4.x line

- **README** and **CHANGELOG** were updated to describe calling, sharing, and setup so the Marketplace page matches behavior.

---

## Earlier than v0.4.0

High-level history (offline behavior, language tracking, OS name in heartbeats, branding rename **DevGlobe → XercaiiGlobe**, etc.) lives in **`CHANGELOG.md`** and older git tags (**v0.3.0**, **v0.2.0**, **v0.1.x**).

If you need a **single artifact** for GitHub Releases, use **this file** (sections above **v0.5.2**) for the full platform changelog and attach **`xercaiiglobe-0.5.8.vsix`** built from `npm run package`.

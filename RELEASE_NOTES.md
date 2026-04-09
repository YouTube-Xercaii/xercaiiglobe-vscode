# XercaiiGlobe VS Code / Cursor extension — release notes

Release notes are written for **users and contributors**: what changed, why it matters, and where to look in the product or settings.

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

If you need a **single artifact** for GitHub Releases, use **this file** for the narrative and attach the **`.vsix`** built from `npm run package` for the matching tag.

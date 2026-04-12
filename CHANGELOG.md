# Changelog

All notable changes to the XercaiiGlobe VS Code extension.

## [0.5.4] — 2026-04-08

### Added
- **Heartbeats: `project_tree`** — When your account has **workspace file tree** sharing enabled on the website, sends a capped, periodically refreshed listing of files and folders under the open workspace (skips `node_modules`, `.git`, etc., and omits sensitive names like `.env`). Heartbeat responses echo `show_full_project_tree_public` so the extension picks up the toggle without an extra request.

### Changed
- HTTP `User-Agent`: `XercaiiGlobe-VSCode/0.5.4`.
- Tracking startup **awaits** socket initialization (`getMe` + connect) before the heartbeat loop and first heartbeat so the extension connects earlier when `/auth/me` succeeds.

## [0.5.3] — 2026-04-11

### Added
- **Heartbeats: `path_folders`** — Sends workspace-relative folder names from the project root down to the current file’s parent (for the website “project path” modal). Only when **Share project name** is enabled and the document is a saved file inside a workspace folder.

### Changed
- HTTP `User-Agent`: `XercaiiGlobe-VSCode/0.5.3`.

## [0.5.2] — 2026-04-09

### Fixed
- **API key mismatch between User and Workspace in Settings** — VS Code applies **Workspace** (and per-folder) settings on top of **User**. After **Sign In** or **Set API Key**, only the User value was updated. If the Workspace tab still held an older or empty `xercaiiglobe.apiKey`, that copy could override what you just entered: heartbeats could 401, the globe could show you offline, and regenerating keys in the dashboard would not help until you manually edited Workspace settings. This release writes the same key everywhere VS Code can store it so the tabs stay aligned.
- **Sign In / Set API Key** now persist `apiKey` to **User**, **Workspace**, and **each workspace folder** (e.g. `.vscode/settings.json` in multi-root setups).

### Changed
- **Sign Out** clears `apiKey` at those same scopes (removes overrides with `undefined`), not only User, so an old workspace value cannot remain after you sign out.
- HTTP `User-Agent`: `XercaiiGlobe-VSCode/0.5.2`.

## [0.5.1] — 2026-04-09

### Fixed
- **Heartbeats after “Open Folder”** — When no file editor is active (welcome/settings/empty tab), the extension still syncs workspace name and sends heartbeats so you stay online on the globe while the window is focused.
- **Workspace API key override** — If `.vscode/settings.json` sets `xercaiiglobe.apiKey` to an empty string, your **User** API key is used again instead of sending unauthorized requests.
- **Duplicate trackers** — Re‑initializing tracking (sign-in, set API key, toggle tracking) disposes the previous listeners so events are not stacked.

### Changed
- HTTP `User-Agent`: `XercaiiGlobe-VSCode/0.5.1`.

## [0.5.0] — 2026-04-09

### Fixed
- **Open Dashboard** opens `https://devglobe-web.onrender.com/dashboard` (correct Render web hostname).
- **Default API URL** is `https://devglobe-api.onrender.com` in `package.json`, `config.ts`, and sign-in flow base URL.

### Changed
- HTTP `User-Agent` for API requests: `XercaiiGlobe-VSCode/0.5.0`.

Releases **0.4.2** through **0.4.6** (calls, code share, heartbeats, editor detection) are summarized in `RELEASE_NOTES.md`.

---

Versions **below 0.5.0** are kept below for reference. **They do not include release dates** (the project’s active development timeline starts March 2026). For a fuller narrative of older builds, see `RELEASE_NOTES.md`.

## [0.4.1]

### Added
- **Code Share status bar button** — Shows a `$(broadcast)` icon in the status bar during active calls for quick toggle
- **Editor title icon** — "Share This File" button appears in the editor title bar when in a call
- **Context keys** — `xercaiiglobe.inCall` context key for conditional UI visibility

### Fixed
- Status bar button now correctly shows/hides based on call state

## [0.4.0]

### Added
- **Voice calling** — Real-time peer-to-peer voice calls with other XercaiiGlobe users via WebRTC
- **Live code sharing** — Share your active editor content with your call peer in real time
- **Socket.IO integration** — Persistent WebSocket connection for call signaling, speaking state, and mute sync
- **Call notifications** — Incoming call toasts, call accept/reject, and call end handling
- **Mute / Deafen sync** — Your mute and deafen state is reflected to your peer in real time
- **Speaking detection** — Voice activity visualised with a speaking ring around avatars
- New commands: `Toggle Code Sharing`

## [0.1.0]

### Added
- Initial release
- Automatic coding activity tracking
- Heartbeat sender (every 30 seconds)
- Discord OAuth sign-in flow
- Status bar indicator (Active / Idle / Offline)
- Privacy controls for file name and project name
- Commands: Sign In, Sign Out, Set API Key, Toggle Tracking, Open Dashboard, Show Status

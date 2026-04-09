# XercaiiGlobe VS Code / Cursor extension — release notes

## v0.5.0 — April 8, 2026

### Production URLs (Render)

- **Open Dashboard** (command palette and sidebar) now opens  
  `https://devglobe-web.onrender.com/dashboard`  
  instead of the old `XercaiiGlobe-web.onrender.com` hostname that could fail to resolve.
- **Default API URL** in settings and internal fallbacks is now  
  `https://devglobe-api.onrender.com`  
  (matches the live API). Sign-in still sends you to the dashboard on the same web host so you can copy your API key.
- **HTTP User-Agent** for API calls updated to `XercaiiGlobe-VSCode/0.5.0`.

If you already changed `xercaiiglobe.apiUrl` manually, your value is unchanged. When you move to a `.com` domain, update **Settings → XercaiiGlobe → Api Url** (and we’ll ship another default in a future release).

---

## Everything since v0.4.0

Summary of all extension changes after tag **v0.4.0** through **v0.5.0**.

### v0.5.0 (this release)

- Correct default **web** and **API** hostnames for Open Dashboard, sign-in browser flow, and new installs (see above).

### v0.4.6

- **Calls started from the website** — Better detection when a call is initiated from the web app so the extension picks up signaling via the personal user room and stays in sync.

### v0.4.5

- **Faster offline / presence** — Quicker departure detection when you stop coding or disconnect.
- **Heartbeat reliability UX** — Alerts when heartbeats fail repeatedly or on the first failure so you know activity might not show on the globe (API key / network).

### v0.4.4

- **Editor identification** — Heartbeats report **Cursor** and **VSCodium** correctly when you’re not on stock VS Code.
- **Heartbeat pipeline** — Internal refactor for clearer, more maintainable heartbeat behavior.

### v0.4.3

- **Call room & code share** — Fixes around call room detection, mute sync, code sharing, and **live activity** so the extension and globe stay aligned during calls.

### v0.4.2

- **Code share receiver** — Peers can receive shared editor content with improved handling.
- **Mute sync UI** — Mute/deafen state better reflected between extension and web.
- **Desktop-only code sharing** — Code sharing is limited to desktop VS Code / Cursor (not web-based editors) to avoid unsupported environments.

### v0.4.1

- **Discoverable code sharing** — Status bar `$(broadcast)` control, editor title action, and `xercaiiglobe.inCall` context so sharing during a call is easier to find and toggle.

### v0.4.0 (baseline)

- **Voice calling** — WebRTC voice with other XercaiiGlobe users; extension participates in signaling.
- **Live code sharing** — Share the active editor with a call peer in real time.
- **Socket.IO** — Persistent connection for call events, speaking hints, mute sync, and related realtime features.
- **Call UX** — Incoming call notifications, accept/reject, call end, optional prompts around sharing.
- **Command** — `XercaiiGlobe: Toggle Code Sharing`.

---

Older history (pre–v0.4.0) remains in `CHANGELOG.md`.

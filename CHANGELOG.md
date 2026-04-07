# Changelog

All notable changes to the XercaiiGlobe VS Code extension.

## [0.4.1] — 2025-01-24

### Added
- **Code Share status bar button** — Shows a `$(broadcast)` icon in the status bar during active calls for quick toggle
- **Editor title icon** — "Share This File" button appears in the editor title bar when in a call
- **Context keys** — `xercaiiglobe.inCall` context key for conditional UI visibility

### Fixed
- Status bar button now correctly shows/hides based on call state

## [0.4.0] — 2025-01-24

### Added
- **Voice calling** — Real-time peer-to-peer voice calls with other XercaiiGlobe users via WebRTC
- **Live code sharing** — Share your active editor content with your call peer in real time
- **Socket.IO integration** — Persistent WebSocket connection for call signaling, speaking state, and mute sync
- **Call notifications** — Incoming call toasts, call accept/reject, and call end handling
- **Mute / Deafen sync** — Your mute and deafen state is reflected to your peer in real time
- **Speaking detection** — Voice activity visualised with a speaking ring around avatars
- New commands: `Toggle Code Sharing`

## [0.1.0] — 2025-01-01

### Added
- Initial release
- Automatic coding activity tracking
- Heartbeat sender (every 30 seconds)
- Discord OAuth sign-in flow
- Status bar indicator (Active / Idle / Offline)
- Privacy controls for file name and project name
- Commands: Sign In, Sign Out, Set API Key, Toggle Tracking, Open Dashboard, Show Status

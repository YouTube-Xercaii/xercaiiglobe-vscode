# XercaiiGlobe — VS Code Extension

> Show your coding activity on a real-time 3D globe 🌍

## Features

- **Sidebar panel** — View your status, set your API key, and manage tracking right from the Activity Bar
- **Automatic activity tracking** — Detects when you're coding, switching files, or idle
- **Real-time heartbeats** — Sends your coding activity every 30 seconds
- **Privacy controls** — Toggle file name and project name sharing
- **Status bar indicator** — See your tracking status at a glance
- **One-click auth** — Sign in with Discord via the XercaiiGlobe website

## How It Works

1. Install the extension
2. Click the **XercaiiGlobe** icon in the Activity Bar (left sidebar)
3. Click **Set API Key** and paste your key from the XercaiiGlobe Dashboard
4. Start coding — you'll appear on the globe!

> Don't have an API key yet? Click **Sign In with Discord** in the sidebar to create your account first.

## Commands

| Command | Description |
| --- | --- |
| `XercaiiGlobe: Sign In` | Open the browser to sign in and get your API key |
| `XercaiiGlobe: Sign Out` | Clear your API key and stop tracking |
| `XercaiiGlobe: Set API Key` | Manually set or update your API key |
| `XercaiiGlobe: Toggle Activity Tracking` | Enable or disable tracking |
| `XercaiiGlobe: Open Dashboard` | Open the XercaiiGlobe web dashboard |
| `XercaiiGlobe: Show Status` | Display current extension status |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `xercaiiglobe.apiKey` | `""` | Your XercaiiGlobe API key |
| `xercaiiglobe.apiUrl` | `https://...` | API server URL |
| `xercaiiglobe.trackingEnabled` | `true` | Enable/disable activity tracking |
| `xercaiiglobe.showFileName` | `true` | Share the file name you're editing |
| `xercaiiglobe.showProjectName` | `true` | Share the workspace/project name |

## Status Bar

The extension adds a status indicator to your VS Code status bar:

- 🌍 **Active** (green) — Tracking and sending heartbeats
- 🌍 **Idle** (yellow) — VS Code is open but you haven't typed recently
- 🌍 **Offline** (grey) — Not authenticated or tracking disabled

## Privacy

- **File names** can be hidden (sends "private" instead)
- **Project names** can be hidden (sends "private" instead)
- **Location** is approximate (~11km accuracy, city-level only)
- **IP addresses** are never shared with other users

## License

MIT

import * as vscode from "vscode";
import { isAuthenticated, getConfig } from "./config";
import { TrackingStatus } from "./types";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "xercaiiglobe.sidebarView";

  private _view?: vscode.WebviewView;
  private _status: TrackingStatus = "offline";

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "setApiKey": {
          await vscode.commands.executeCommand("xercaiiglobe.setApiKey");
          this.refresh();
          break;
        }
        case "signIn": {
          await vscode.commands.executeCommand("xercaiiglobe.login");
          this.refresh();
          break;
        }
        case "signOut": {
          await vscode.commands.executeCommand("xercaiiglobe.logout");
          this.refresh();
          break;
        }
        case "openDashboard": {
          await vscode.commands.executeCommand("xercaiiglobe.openDashboard");
          break;
        }
        case "toggleTracking": {
          await vscode.commands.executeCommand("xercaiiglobe.toggleTracking");
          this.refresh();
          break;
        }
      }
    });
  }

  public setStatus(status: TrackingStatus): void {
    this._status = status;
    this.refresh();
  }

  public refresh(): void {
    if (this._view) {
      this._view.webview.html = this._getHtml();
    }
  }

  private _getHtml(): string {
    const authed = isAuthenticated();
    const config = getConfig();
    const status = this._status;

    const statusColor =
      status === "active"
        ? "#22c55e"
        : status === "idle"
        ? "#eab308"
        : "#6b7280";
    const statusLabel =
      status === "active"
        ? "Active"
        : status === "idle"
        ? "Idle"
        : "Offline";
    const maskedKey = authed
      ? config.apiKey.substring(0, 6) + "••••••••••••"
      : "Not set";

    return  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 12px;
    }

    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.08));
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-text {
      font-weight: 500;
    }

    .key-display {
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, rgba(255,255,255,0.08));
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      color: ${authed ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)"};
      word-break: break-all;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      margin-bottom: 6px;
      transition: opacity 0.15s;
    }
    .btn:hover {
      opacity: 0.85;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
    }
    .info-label {
      color: var(--vscode-descriptionForeground);
    }
    .info-value {
      font-weight: 500;
    }

    .divider {
      height: 1px;
      background: var(--vscode-widget-border, rgba(255,255,255,0.08));
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <!-- Status -->
  <div class="section">
    <div class="section-title">Status</div>
    <div class="status-card">
      <div class="status-dot" style="background: ${statusColor}; box-shadow: 0 0 6px ${statusColor};"></div>
      <span class="status-text">${statusLabel}</span>
    </div>
  </div>

  <!-- API Key -->
  <div class="section">
    <div class="section-title">API Key</div>
    <div class="key-display">${maskedKey}</div>
    <div style="margin-top: 8px;">
      <button class="btn btn-primary" onclick="send('setApiKey')">
        ${authed ? "🔑 Update API Key" : "🔑 Set API Key"}
      </button>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Quick Actions -->
  <div class="section">
    <div class="section-title">Quick Actions</div>
    ${
      !authed
        ? `<button class="btn btn-primary" onclick="send('signIn')">🔗 Sign In with Discord</button>`
        : ""
    }
    <button class="btn btn-secondary" onclick="send('openDashboard')">📊 Open Dashboard</button>
    ${
      authed
        ? `<button class="btn btn-secondary" onclick="send('toggleTracking')">
            ${config.trackingEnabled ? "⏸ Pause Tracking" : "▶️ Resume Tracking"}
          </button>`
        : ""
    }
    ${
      authed
        ? `<button class="btn btn-danger" onclick="send('signOut')">Sign Out</button>`
        : ""
    }
  </div>

  <div class="divider"></div>

  <!-- Settings Info -->
  <div class="section">
    <div class="section-title">Settings</div>
    <div class="info-row">
      <span class="info-label">Tracking</span>
      <span class="info-value">${config.trackingEnabled ? "✅ On" : "❌ Off"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Share file name</span>
      <span class="info-value">${config.showFileName ? "✅ Yes" : "❌ No"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Share project name</span>
      <span class="info-value">${config.showProjectName ? "✅ Yes" : "❌ No"}</span>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function send(type) {
      vscode.postMessage({ type });
    }
  </script>
</body>
</html>`;
  }
}

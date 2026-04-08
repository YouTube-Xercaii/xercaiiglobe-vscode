import * as vscode from "vscode";
import * as os from "os";
import { sendHeartbeat } from "./api";
import { isActive, getCurrentFile, getCurrentLanguage, getCurrentProject } from "./tracker";
import { isAuthenticated } from "./config";
import { HeartbeatPayload } from "./types";

function getOSName(): string {
  const platform = os.platform();
  switch (platform) {
    case "win32": return "Windows";
    case "darwin": return "macOS";
    case "linux": return "Linux";
    default: return platform;
  }
}

function getEditorName(): string {
  const appName = vscode.env.appName || "";
  if (/cursor/i.test(appName)) { return "Cursor"; }
  if (/codium/i.test(appName)) { return "VSCodium"; }
  return "VS Code";
}

const HEARTBEAT_INTERVAL_MS = 3 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _consecutiveFailures = 0;
let _failureWarningShown = false;

function buildPayload(): HeartbeatPayload | null {
  const file = getCurrentFile();
  const language = getCurrentLanguage();
  if (!file && !language) { return null; }

  return {
    file: file || "unknown",
    language: language || "Unknown",
    editor: getEditorName(),
    project: getCurrentProject() || "Unknown",
    timestamp: new Date().toISOString(),
    os_name: getOSName(),
  };
}

export function startHeartbeatLoop(): void {
  if (heartbeatTimer) {
    return;
  }

  _consecutiveFailures = 0;
  _failureWarningShown = false;

  heartbeatTimer = setInterval(async () => {
    if (!isAuthenticated() || !isActive()) { return; }

    const payload = buildPayload();
    if (!payload) { return; }

    const result = await sendHeartbeat(payload);
    if (result) {
      _consecutiveFailures = 0;
    } else {
      _consecutiveFailures++;
      if (_consecutiveFailures >= 5 && !_failureWarningShown) {
        _failureWarningShown = true;
        vscode.window.showWarningMessage(
          "XercaiiGlobe: Heartbeats are failing repeatedly. Your activity may not appear on the globe. Check your API key and network connection."
        );
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeatLoop(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export async function sendImmediateHeartbeat(): Promise<void> {
  if (!isAuthenticated() || !isActive()) { return; }

  const payload = buildPayload();
  if (!payload) { return; }

  const result = await sendHeartbeat(payload);
  if (!result) {
    vscode.window.showWarningMessage(
      `XercaiiGlobe (${getEditorName()}): First heartbeat failed — your activity may not appear on the globe. Check your API key and network connection.`
    );
  }
}

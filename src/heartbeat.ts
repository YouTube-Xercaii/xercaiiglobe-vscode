import * as vscode from "vscode";
import * as os from "os";
import { sendHeartbeat } from "./api";
import {
  isActive,
  getCurrentFile,
  getCurrentLanguage,
  getCurrentProject,
  getPathFolders,
} from "./tracker";
import { getConfig, isAuthenticated } from "./config";
import { HeartbeatPayload } from "./types";
import { wantsFullProjectTree, applyHeartbeatPrefs } from "./liveTreePrefs";
import { getWorkspaceProjectTreeForActiveEditor } from "./projectTree";

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
  const appName = (vscode.env.appName || "").trim();
  const lower = appName.toLowerCase();
  if (!appName) {
    return "VS Code";
  }
  if (/cursor/i.test(appName)) {
    return "Cursor";
  }
  if (/codium|vscodium/i.test(appName)) {
    return "VSCodium";
  }
  if (/windsurf/i.test(appName)) {
    return "Windsurf";
  }
  if (/antigravity/i.test(appName)) {
    return "Antigravity";
  }
  if (/claude/i.test(appName)) {
    return "Claude Code";
  }
  if (/code\s*-\s*insiders/i.test(lower) || /insiders/i.test(lower) && /code/i.test(lower)) {
    return "VS Code Insiders";
  }
  if (/visual studio code|(^|\s)vscode(\s|$)/i.test(lower)) {
    return "VS Code";
  }
  if (/webstorm/i.test(appName)) {
    return "WebStorm";
  }
  if (/pycharm/i.test(appName)) {
    return "PyCharm";
  }
  if (/intellij/i.test(appName)) {
    return "IntelliJ IDEA";
  }
  if (/goland/i.test(appName)) {
    return "Goland";
  }
  if (/phpstorm/i.test(appName)) {
    return "PhpStorm";
  }
  if (/rider/i.test(appName)) {
    return "Rider";
  }
  if (/rubymine/i.test(appName)) {
    return "RubyMine";
  }
  if (/rustrover/i.test(appName)) {
    return "RustRover";
  }
  if (/clion/i.test(appName)) {
    return "CLion";
  }
  if (/datagrip/i.test(appName)) {
    return "DataGrip";
  }
  if (/fleet/i.test(appName)) {
    return "Fleet";
  }
  if (/android studio/i.test(appName)) {
    return "Android Studio";
  }
  if (/xcode/i.test(appName)) {
    return "Xcode";
  }
  if (/sublime/i.test(appName)) {
    return "Sublime Text";
  }
  if (/atom(\s|$)/i.test(appName)) {
    return "Atom";
  }
  if (/zed/i.test(appName)) {
    return "Zed";
  }
  if (/eclipse/i.test(appName)) {
    return "Eclipse";
  }
  if (/visual studio(?!\s+code)/i.test(appName) && !/vscode/i.test(lower)) {
    return "Visual Studio";
  }
  return appName;
}

const HEARTBEAT_INTERVAL_MS = 3 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _consecutiveFailures = 0;
let _failureWarningShown = false;

async function buildPayload(): Promise<HeartbeatPayload | null> {
  const file = getCurrentFile();
  const language = getCurrentLanguage();
  if (!file && !language) { return null; }

  const payload: HeartbeatPayload = {
    file: file || "unknown",
    language: language || "Unknown",
    editor: getEditorName(),
    project: getCurrentProject() || "Unknown",
    timestamp: new Date().toISOString(),
    os_name: getOSName(),
  };
  const pathFolders = getPathFolders();
  if (pathFolders !== undefined) {
    payload.path_folders = pathFolders;
  }
  if (wantsFullProjectTree() && getConfig().showProjectName) {
    try {
      const tree = await getWorkspaceProjectTreeForActiveEditor();
      if (tree !== undefined) {
        payload.project_tree = tree;
      }
    } catch {
      /* tree scan is best-effort */
    }
  }
  return payload;
}

export function startHeartbeatLoop(): void {
  if (heartbeatTimer) {
    return;
  }

  _consecutiveFailures = 0;
  _failureWarningShown = false;

  heartbeatTimer = setInterval(async () => {
    if (!isAuthenticated() || !isActive()) { return; }

    const payload = await buildPayload();
    if (!payload) { return; }

    const result = await sendHeartbeat(payload);
    if (result) {
      applyHeartbeatPrefs(result);
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

  const payload = await buildPayload();
  if (!payload) { return; }

  const result = await sendHeartbeat(payload);
  if (result) {
    applyHeartbeatPrefs(result);
  }
  if (!result) {
    vscode.window.showWarningMessage(
      `XercaiiGlobe (${getEditorName()}): First heartbeat failed — your activity may not appear on the globe. Check your API key and network connection.`
    );
  }
}

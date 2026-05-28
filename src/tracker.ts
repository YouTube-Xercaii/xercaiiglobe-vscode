import * as vscode from "vscode";
import * as path from "path";
import { getConfig } from "./config";
import { getLanguageDisplayName } from "./language";
import { setStatus } from "./statusBar";
import { sendImmediateHeartbeat } from "./heartbeat";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const NO_EDITOR_FILE = "(no file open)";
const NO_EDITOR_LANGUAGE = "Unknown";

let lastActivity = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let _isActive = false;
let _currentFile = "";
let _currentLanguage = "";
let _currentProject = "";
let listenerDisposable: vscode.Disposable | undefined;

export function isActive(): boolean {
  return _isActive;
}

export function getCurrentFile(): string {
  return _currentFile;
}

export function getCurrentLanguage(): string {
  return _currentLanguage;
}

export function getCurrentProject(): string {
  return _currentProject;
}

const MAX_PATH_SEGMENTS = 32;

/**
 * Workspace-relative folder segments from the root down to the active file's parent.
 * Used by heartbeats for the web "project path" modal. Undefined when not applicable.
 */
export function getPathFolders(): string[] | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  const doc = editor.document;
  if (doc.uri.scheme !== "file") {
    return undefined;
  }
  const wf = vscode.workspace.getWorkspaceFolder(doc.uri);
  if (!wf) {
    return undefined;
  }
  const config = getConfig();
  if (!config.showProjectName) {
    return undefined;
  }

  let rel: string;
  try {
    rel = vscode.workspace.asRelativePath(doc.uri, false);
  } catch {
    return undefined;
  }
  if (!rel) {
    return undefined;
  }
  const normalized = rel.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((p) => p.length > 0);
  if (parts.length < 2) {
    return [];
  }
  parts.pop();
  if (parts.length === 0) {
    return [];
  }
  return parts.slice(0, MAX_PATH_SEGMENTS);
}

function recordActivity(): void {
  lastActivity = Date.now();

  if (!_isActive) {
    _isActive = true;
    setStatus("active");
  }

  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  idleTimer = setTimeout(() => {
    _isActive = false;
    setStatus("idle");
  }, IDLE_TIMEOUT_MS);
}

function updateEditorInfo(editor?: vscode.TextEditor): void {
  if (!editor) {
    return;
  }

  const config = getConfig();
  const doc = editor.document;

  if (config.showFileName) {
    _currentFile = path.basename(doc.fileName);
  } else {
    _currentFile = "private";
  }

  _currentLanguage = getLanguageDisplayName(doc.languageId);

  if (config.showProjectName) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    _currentProject = workspaceFolder?.name ?? "Unknown";
  } else {
    _currentProject = "private";
  }
}

/**
 * When there is no active editor (welcome page, settings UI, empty window after
 * "Open Folder"), still publish workspace context so heartbeats run and the
 * globe shows you online while the window is focused.
 */
export function syncActivityFromContext(): void {
  // Prefer the active editor, but fall back to any visible text editor. This
  // stops the language/file from being reset to "Unknown" when focus moves to
  // a non-editor surface (integrated terminal, Output panel, a webview/preview,
  // Settings tab) while your file is still open — VS Code reports
  // `activeTextEditor` as undefined in those cases.
  const editor =
    vscode.window.activeTextEditor ??
    vscode.window.visibleTextEditors.find((e) => e.document.uri.scheme === "file") ??
    vscode.window.visibleTextEditors[0];
  if (editor) {
    updateEditorInfo(editor);
    if (vscode.window.state.focused) {
      recordActivity();
    }
    return;
  }

  const config = getConfig();
  if (config.showFileName) {
    _currentFile = NO_EDITOR_FILE;
  } else {
    _currentFile = "private";
  }
  _currentLanguage = NO_EDITOR_LANGUAGE;
  if (config.showProjectName) {
    const folders = vscode.workspace.workspaceFolders;
    _currentProject = folders?.[0]?.name ?? "Unknown";
  } else {
    _currentProject = "private";
  }

  if (vscode.window.state.focused) {
    recordActivity();
  } else {
    setStatus("idle");
  }
}

export function registerTrackerListeners(): void {
  listenerDisposable?.dispose();

  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        recordActivity();
        updateEditorInfo(editor);
        sendImmediateHeartbeat();
      } else {
        syncActivityFromContext();
        sendImmediateHeartbeat();
      }
    })
  );

  disposables.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (
        e.contentChanges.length > 0 &&
        e.document === vscode.window.activeTextEditor?.document
      ) {
        recordActivity();
      }
    })
  );

  disposables.push(
    vscode.window.onDidChangeWindowState((state) => {
      if (state.focused) {
        syncActivityFromContext();
        sendImmediateHeartbeat();
      }
    })
  );

  disposables.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      syncActivityFromContext();
      sendImmediateHeartbeat();
    })
  );

  listenerDisposable = vscode.Disposable.from(...disposables);

  syncActivityFromContext();
  if (vscode.window.state.focused) {
    sendImmediateHeartbeat();
  }
}

export function stopTracking(): void {
  listenerDisposable?.dispose();
  listenerDisposable = undefined;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  _isActive = false;
  _currentFile = "";
  _currentLanguage = "";
  _currentProject = "";
}

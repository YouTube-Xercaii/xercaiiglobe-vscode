import * as vscode from "vscode";
import * as path from "path";
import { getConfig } from "./config";
import { getLanguageDisplayName } from "./language";
import { setStatus } from "./statusBar";
import { sendImmediateHeartbeat } from "./heartbeat";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

let lastActivity = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let _isActive = false;
let _currentFile = "";
let _currentLanguage = "";
let _currentProject = "";

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

export function registerTrackerListeners(): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        recordActivity();
        updateEditorInfo(editor);

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
        recordActivity();
        updateEditorInfo(vscode.window.activeTextEditor);
      }
    })
  );

  updateEditorInfo(vscode.window.activeTextEditor);
  if (vscode.window.activeTextEditor) {
    recordActivity();
  }

  return disposables;
}

export function stopTracking(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  _isActive = false;
  _currentFile = "";
  _currentLanguage = "";
  _currentProject = "";
}

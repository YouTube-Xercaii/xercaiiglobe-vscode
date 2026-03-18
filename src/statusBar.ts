import * as vscode from "vscode";
import { TrackingStatus } from "./types";

let statusBarItem: vscode.StatusBarItem | null = null;

export function createStatusBar(): vscode.StatusBarItem {
  if (statusBarItem) {
    return statusBarItem;
  }
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = "xercaiiglobe.showStatus";
  statusBarItem.show();
  setStatus("offline");
  return statusBarItem;
}

export function setStatus(status: TrackingStatus): void {
  if (!statusBarItem) {
    return;
  }

  switch (status) {
    case "active":
      statusBarItem.text = "$(globe) XercaiiGlobe: Active";
      statusBarItem.color = "#22c55e";
      statusBarItem.tooltip = "XercaiiGlobe is tracking your coding activity";
      break;
    case "idle":
      statusBarItem.text = "$(globe) XercaiiGlobe: Idle";
      statusBarItem.color = "#eab308";
      statusBarItem.tooltip = "XercaiiGlobe is waiting for activity";
      break;
    case "offline":
      statusBarItem.text = "$(globe) XercaiiGlobe: Offline";
      statusBarItem.color = "#6b7280";
      statusBarItem.tooltip =
        "XercaiiGlobe is not connected. Run 'XercaiiGlobe: Sign In' to start.";
      break;
  }
}

export function getStatusBar(): vscode.StatusBarItem | null {
  return statusBarItem;
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
  statusBarItem = null;
}

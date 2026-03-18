import * as vscode from "vscode";
import { signIn, signOut, setApiKey } from "./auth";
import { getConfig, isAuthenticated } from "./config";
import { resetClient } from "./api";
import { createStatusBar, setStatus, disposeStatusBar } from "./statusBar";
import { registerTrackerListeners, stopTracking } from "./tracker";
import {
  startHeartbeatLoop,
  stopHeartbeatLoop,
  sendImmediateHeartbeat,
} from "./heartbeat";
import { SidebarProvider } from "./sidebarProvider";

let sidebarProvider: SidebarProvider;

export function activate(context: vscode.ExtensionContext): void {

  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("xercaiiglobe.login", async () => {
      await signIn();
      initTracking(context);
    }),

    vscode.commands.registerCommand("xercaiiglobe.logout", async () => {
      await signOut();
      stopHeartbeatLoop();
      stopTracking();
      setStatus("offline");
      sidebarProvider.setStatus("offline");
    }),

    vscode.commands.registerCommand("xercaiiglobe.toggleTracking", async () => {
      const config = getConfig();
      const newValue = !config.trackingEnabled;
      const cfg = vscode.workspace.getConfiguration("xercaiiglobe");
      await cfg.update("trackingEnabled", newValue, vscode.ConfigurationTarget.Global);

      if (newValue) {
        initTracking(context);
        vscode.window.showInformationMessage("XercaiiGlobe: Tracking enabled.");
      } else {
        stopHeartbeatLoop();
        stopTracking();
        setStatus("offline");
        sidebarProvider.setStatus("offline");
        vscode.window.showInformationMessage("XercaiiGlobe: Tracking disabled.");
      }
    }),

    vscode.commands.registerCommand("xercaiiglobe.openDashboard", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://devglobe-web.onrender.com/dashboard")
      );
    }),

    vscode.commands.registerCommand("xercaiiglobe.showStatus", () => {
      const config = getConfig();
      const authed = isAuthenticated();
      const items: string[] = [
        `Authenticated: ${authed ? "Yes" : "No"}`,
        `Tracking: ${config.trackingEnabled ? "Enabled" : "Disabled"}`,
        `API URL: ${config.apiUrl}`,
        `Show file name: ${config.showFileName ? "Yes" : "No"}`,
        `Show project name: ${config.showProjectName ? "Yes" : "No"}`,
      ];
      vscode.window.showInformationMessage(
        `XercaiiGlobe Status:\n${items.join(" | ")}`
      );
    }),

    vscode.commands.registerCommand("xercaiiglobe.setApiKey", async () => {
      await setApiKey();
      initTracking(context);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("xercaiiglobe")) {
        resetClient();
        sidebarProvider.refresh();

        const config = getConfig();
        if (!config.trackingEnabled || !isAuthenticated()) {
          stopHeartbeatLoop();
          stopTracking();
          setStatus("offline");
          sidebarProvider.setStatus("offline");
        }
      }
    })
  );

  if (isAuthenticated() && getConfig().trackingEnabled) {
    initTracking(context);
  } else {
    setStatus("offline");
    sidebarProvider.setStatus("offline");
  }
}

function initTracking(context: vscode.ExtensionContext): void {
  if (!isAuthenticated()) {
    setStatus("offline");
    sidebarProvider.setStatus("offline");
    return;
  }

  if (!getConfig().trackingEnabled) {
    setStatus("offline");
    sidebarProvider.setStatus("offline");
    return;
  }

  const disposables = registerTrackerListeners();
  disposables.forEach((d) => context.subscriptions.push(d));

  startHeartbeatLoop();

  sendImmediateHeartbeat();

  setStatus("active");
  sidebarProvider.setStatus("active");
}

export function deactivate(): void {
  stopHeartbeatLoop();
  stopTracking();
  disposeStatusBar();
}

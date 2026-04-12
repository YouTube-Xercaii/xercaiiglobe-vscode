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
import { sendOffline, getMe } from "./api";
import { refreshLiveTreePreferenceFromUser } from "./liveTreePrefs";
import { invalidateProjectTreeCache } from "./projectTree";
import { SidebarProvider } from "./sidebarProvider";
import { connectExtSocket, disconnectExtSocket } from "./socket";
import { attachCallListeners, detachCallListeners, getCallRoom, updateCodeShareStatusBar, isInCall, onCallStateChanged } from "./callHandler";
import { startCodeShare, stopCodeShare, isSharingCode } from "./codeShare";

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

  onCallStateChanged(() => sidebarProvider.refresh());

  context.subscriptions.push(
    vscode.commands.registerCommand("xercaiiglobe.login", async () => {
      await signIn();
      void initTracking(context);
    }),

    vscode.commands.registerCommand("xercaiiglobe.logout", async () => {
      await sendOffline();
      await signOut();
      stopHeartbeatLoop();
      stopTracking();
      detachCallListeners();
      disconnectExtSocket();
      setStatus("offline");
      sidebarProvider.setStatus("offline");
    }),

    vscode.commands.registerCommand("xercaiiglobe.toggleTracking", async () => {
      const config = getConfig();
      const newValue = !config.trackingEnabled;
      const cfg = vscode.workspace.getConfiguration("xercaiiglobe");
      await cfg.update("trackingEnabled", newValue, vscode.ConfigurationTarget.Global);

      if (newValue) {
        void initTracking(context);
        vscode.window.showInformationMessage("XercaiiGlobe: Tracking enabled.");
      } else {
        await sendOffline();
        stopHeartbeatLoop();
        stopTracking();
        detachCallListeners();
        disconnectExtSocket();
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
      void initTracking(context);
    }),

    vscode.commands.registerCommand("xercaiiglobe.toggleCodeShare", async () => {
      // Only allow starting code sharing from desktop clients
      if (vscode.env.uiKind !== vscode.UIKind.Desktop && !isSharingCode()) {
        vscode.window.showWarningMessage("XercaiiGlobe: Code sharing is only available on desktop clients.");
        return;
      }

      if (isSharingCode()) {
        stopCodeShare();
        updateCodeShareStatusBar();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage("XercaiiGlobe: Stopped sharing code.");
      } else {
        // There can be a short race where we're marked in-call before the call_room arrives
        let room = getCallRoom();
        if (!room && isInCall()) {
          // wait up to 3s for call room to be populated
          const waited = await (async function waitForCallRoom(timeoutMs = 3000) {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
              const r = getCallRoom();
              if (r) return r;
              await new Promise((res) => setTimeout(res, 200));
            }
            return null;
          })();
          if (waited) room = waited;
        }

        if (!room) {
          vscode.window.showWarningMessage("XercaiiGlobe: You must be in a call to share code.");
          return;
        }

        startCodeShare(room);
        updateCodeShareStatusBar();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage("XercaiiGlobe: Now sharing your editor with your call peer!");
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      invalidateProjectTreeCache();
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
    void initTracking(context);
  } else {
    setStatus("offline");
    sidebarProvider.setStatus("offline");
  }
}

async function initTracking(context: vscode.ExtensionContext): Promise<void> {
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

  registerTrackerListeners();

  await initSocket();

  startHeartbeatLoop();

  await sendImmediateHeartbeat();

  setStatus("active");
  sidebarProvider.setStatus("active");
}

async function initSocket(): Promise<void> {
  try {
    const me = await getMe();
    refreshLiveTreePreferenceFromUser(me);
    if (me && me.id) {
      connectExtSocket(me.id);
      attachCallListeners();
      console.log(`[XercaiiGlobe] Socket.IO connected for user ${me.id}`);
    }
  } catch (err) {
    console.warn("[XercaiiGlobe] Failed to connect Socket.IO:", err);
  }
}

export async function deactivate(): Promise<void> {
  stopHeartbeatLoop();
  stopTracking();
  try { await sendOffline(); } catch { /* best-effort */ }
  detachCallListeners();
  disconnectExtSocket();
  disposeStatusBar();
}

/**
 * XercaiiGlobe VS Code Extension — Call Handler
 *
 * Listens for incoming call events via Socket.IO and shows VS Code
 * notifications. Also manages code sharing lifecycle for active calls.
 */

import * as vscode from "vscode";
import { getExtSocket, getSocketUserId } from "./socket";
import { startCodeShare, stopCodeShare, isSharingCode } from "./codeShare";
import type { Socket } from "socket.io-client";
// (vscode already imported above)

let _callRoom: string | null = null;
let _inCall = false;
let _listenersAttached = false;
let _codeShareStatusBar: vscode.StatusBarItem | null = null;
let _muteStatusBar: vscode.StatusBarItem | null = null;
let _codeSharePanel: vscode.WebviewPanel | null = null;
let _currentSharedUser: string | null = null;
// Track peer mute states persistently so UI reflects last-known state
const _peerMuteState: Record<string, boolean> = {};

interface CallerInfo {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

/** Attach call-related Socket.IO listeners. Call once after connecting. */
export function attachCallListeners(): void {
  if (_listenersAttached) { return; }
  _listenersAttached = true;

  const socket = getExtSocket();

  // ─── Incoming call notification ────────────────────────────
  socket.on("call_incoming", (data: {
    caller_id: string;
    caller_info: CallerInfo;
    call_room: string;
  }) => {
    const name = data.caller_info.display_name || data.caller_info.username || "Someone";
    handleIncomingCall(socket, name, data.caller_id, data.call_room);
  });

  // ─── Call accepted (we might be the caller or callee) ──────
  socket.on("call_accepted", (data: {
    callee_id: string;
    callee_info: CallerInfo;
    call_room?: string;
  }) => {
    // Always set _inCall and _callRoom, even if we are the caller
    if (data.call_room) {
      _callRoom = data.call_room;
    }
    _inCall = true;
    vscode.commands.executeCommand("setContext", "xercaiiglobe.inCall", true);
    showCodeShareStatusBar();
    const name = data.callee_info.display_name || data.callee_info.username || "Friend";
    vscode.window.showInformationMessage(
      `XercaiiGlobe: ${name} joined the call!`
    );
  });

  // ─── Peer mute state (relay from server) ─────────────────
  socket.on("call_peer_mute_state", (data: { user_id: string; is_muted: boolean; is_deafened?: boolean }) => {
    try {
      const me = getSocketUserId();
      if (data.user_id && data.user_id !== me) {
        // persist the peer mute state and update aggregated UI
        _peerMuteState[data.user_id] = Boolean(data.is_muted);
        const anyPeerMuted = Object.values(_peerMuteState).some((v) => v === true);
        if (data.is_muted) {
          vscode.window.setStatusBarMessage("XercaiiGlobe: Peer muted", 3000);
        } else {
          vscode.window.setStatusBarMessage("XercaiiGlobe: Peer unmuted", 2000);
        }
        updateMuteStatusBar(anyPeerMuted);
      }
    } catch (e) {
      console.warn("[XercaiiGlobe] call_peer_mute_state handler error", e);
    }
  });

  // ─── Peer speaking indicator ─────────────────────────────
  socket.on("call_peer_speaking", (data: { user_id: string; speaking: boolean }) => {
    try {
      const me = getSocketUserId();
      if (data.user_id && data.user_id !== me && data.speaking) {
        vscode.window.setStatusBarMessage("XercaiiGlobe: Peer speaking…", 1000);
      }
    } catch (e) {
      console.warn("[XercaiiGlobe] call_peer_speaking handler error", e);
    }
  });

  // ─── Incoming live code sharing events ────────────────────
  socket.on("code_share_started", (data: { user_id: string; file_name: string; language?: string; content?: string }) => {
    try {
      if (!data || !data.user_id) return;
      openOrUpdateCodeSharePanel(data.user_id, data.file_name, data.language || "text", data.content || "");
    } catch (e) {
      console.warn("[XercaiiGlobe] code_share_started handler error", e);
    }
  });

  socket.on("code_share_updated", (data: { user_id: string; file_name: string; language?: string; content?: string }) => {
    try {
      if (!data || !data.user_id) return;
      openOrUpdateCodeSharePanel(data.user_id, data.file_name, data.language || "text", data.content || "");
    } catch (e) {
      console.warn("[XercaiiGlobe] code_share_updated handler error", e);
    }
  });

  socket.on("code_share_stopped", (data: { user_id: string }) => {
    try {
      if (!data || !data.user_id) return;
      if (_currentSharedUser === data.user_id) {
        closeCodeSharePanel();
      }
    } catch (e) {
      console.warn("[XercaiiGlobe] code_share_stopped handler error", e);
    }
  });

  // ─── Call rejected ─────────────────────────────────────────
  socket.on("call_rejected", () => {
    cleanupCall();
    vscode.window.showInformationMessage(
      "XercaiiGlobe: Call was declined."
    );
  });

  // ─── Call ended ────────────────────────────────────────────
  socket.on("call_ended", () => {
    cleanupCall();
    vscode.window.showInformationMessage(
      "XercaiiGlobe: Call ended."
    );
  });
}

/** Show an incoming call notification with Accept/Decline. */
async function handleIncomingCall(
  socket: Socket,
  callerName: string,
  callerId: string,
  callRoom: string
): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    `📞 ${callerName} is calling you on XercaiiGlobe!`,
    { modal: false },
    "Accept",
    "Decline"
  );

  const userId = getSocketUserId();

  if (choice === "Accept") {
    _callRoom = callRoom;
    _inCall = true;
    vscode.commands.executeCommand("setContext", "xercaiiglobe.inCall", true);
    showCodeShareStatusBar();

    socket.emit("call_accept", {
      callee_id: userId,
      call_room: callRoom,
      callee_info: {}, // minimal — web app already has our info
    });

    // Ask if they want to share their editor
    const shareChoice = await vscode.window.showInformationMessage(
      "XercaiiGlobe: Share your code with your friend?",
      "Share Code",
      "No Thanks"
    );

    if (shareChoice === "Share Code" && _callRoom) {
      startCodeShare(_callRoom);
      vscode.window.showInformationMessage(
        "XercaiiGlobe: Now sharing your editor. Your friend can see what you're coding!"
      );
    }
  } else {
    // Decline or dismissed
    socket.emit("call_reject", {
      user_id: userId,
      call_room: callRoom,
      reason: "rejected",
    });
  }
}

/** Clean up call state and stop code sharing. */
function cleanupCall(): void {
  if (isSharingCode()) {
    stopCodeShare();
  }
  _callRoom = null;
  _inCall = false;
  vscode.commands.executeCommand("setContext", "xercaiiglobe.inCall", false);
  hideCodeShareStatusBar();
}

/** Detach listeners (for cleanup on deactivation). */
export function detachCallListeners(): void {
  if (!_listenersAttached) { return; }

  const socket = getExtSocket();
  socket.off("call_incoming");
  socket.off("call_accepted");
  socket.off("call_rejected");
  socket.off("call_ended");
  _listenersAttached = false;

  cleanupCall();
}

/** Whether the user is currently in a call. */
export function isInCall(): boolean {
  return _inCall;
}

/** Get the current call room, if any. */
export function getCallRoom(): string | null {
  return _callRoom;
}

/** Show a status bar item during calls prompting code share. */
function showCodeShareStatusBar(): void {
  if (!_codeShareStatusBar) {
    _codeShareStatusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      90
    );
  }
  updateCodeShareStatusBar();
  _codeShareStatusBar.show();
}

/** Update the status bar text based on sharing state. */
export function updateCodeShareStatusBar(): void {
  if (!_codeShareStatusBar) return;
  if (isSharingCode()) {
    _codeShareStatusBar.text = "$(broadcast) Sharing Code";
    _codeShareStatusBar.tooltip = "Click to stop sharing your editor";
    _codeShareStatusBar.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  } else {
    _codeShareStatusBar.text = "$(broadcast) Share Code";
    _codeShareStatusBar.tooltip = "Click to share your current editor with your call peer";
    _codeShareStatusBar.backgroundColor = undefined;
  }
  _codeShareStatusBar.command = "xercaiiglobe.toggleCodeShare";
}

/** Hide the code share status bar item. */
function hideCodeShareStatusBar(): void {
  if (_codeShareStatusBar) {
    _codeShareStatusBar.hide();
    _codeShareStatusBar.dispose();
    _codeShareStatusBar = null;
  }
}

/** Update or create a small mute-status bar item. */
function updateMuteStatusBar(isMuted: boolean): void {
  if (!_muteStatusBar) {
    _muteStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 89);
    _muteStatusBar.command = undefined;
  }

  if (isMuted) {
    _muteStatusBar.text = "$(debug-disconnect) Peer muted";
    _muteStatusBar.tooltip = "One or more peers in the call are muted";
    _muteStatusBar.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    _muteStatusBar.show();
  } else {
    _muteStatusBar.text = "$(megaphone) Peer unmuted";
    _muteStatusBar.tooltip = "No peers are muted";
    _muteStatusBar.backgroundColor = undefined;
    // show briefly then hide for visual feedback
    _muteStatusBar.show();
    setTimeout(() => {
      if (_muteStatusBar && !isMuted) {
        _muteStatusBar.hide();
      }
    }, 1500);
  }
}

/** Open or update the code-share webview panel for live viewing. */
function openOrUpdateCodeSharePanel(userId: string, fileName: string, language: string, content: string): void {
  _currentSharedUser = userId;
  if (!_codeSharePanel) {
    _codeSharePanel = vscode.window.createWebviewPanel(
      "xercaiiglobe.codeShare",
      `Live Code: ${fileName}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    _codeSharePanel.onDidDispose(() => {
      _codeSharePanel = null;
      _currentSharedUser = null;
    });
  } else {
    _codeSharePanel.title = `Live Code: ${fileName}`;
  }

  const safeContent = (content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: monospace;white-space:pre-wrap; padding:12px;}</style></head><body><div><strong>${fileName} — ${language}</strong></div><pre id="code">${safeContent}</pre><script>window.addEventListener('message',e=>{if(e.data?.content){document.getElementById('code').textContent=e.data.content}})</script></body></html>`;
  _codeSharePanel.webview.html = html;
}

function closeCodeSharePanel(): void {
  if (_codeSharePanel) {
    try { _codeSharePanel.dispose(); } catch (e) { /* ignore */ }
    _codeSharePanel = null;
  }
  _currentSharedUser = null;
}

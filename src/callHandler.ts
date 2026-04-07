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

let _callRoom: string | null = null;
let _inCall = false;
let _listenersAttached = false;

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

  // ─── Call accepted (we might be the caller) ────────────────
  socket.on("call_accepted", (data: {
    callee_id: string;
    callee_info: CallerInfo;
  }) => {
    _inCall = true;
    const name = data.callee_info.display_name || data.callee_info.username || "Friend";
    vscode.window.showInformationMessage(
      `XercaiiGlobe: ${name} joined the call!`
    );
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

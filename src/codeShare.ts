import { getCallRoom } from "./callHandler";
let _isMuted = false;
/** Toggle mute state and emit to peer. */
export function toggleMute(): void {
  _isMuted = !_isMuted;
  const socket = getExtSocket();
  const room = getCallRoom();
  if (room) {
    socket.emit(_isMuted ? "call_mute" : "call_unmute", { call_room: room });
  }
}
/**
 * XercaiiGlobe VS Code Extension — Code Share Service
 *
 * Handles broadcasting the active editor content to call peers
 * via Socket.IO during an active call.
 */

import * as vscode from "vscode";
import * as path from "path";
import { getExtSocket, getSocketUserId } from "./socket";
import { getLanguageDisplayName } from "./language";

let _sharing = false;
let _callRoom: string | null = null;
let _disposables: vscode.Disposable[] = [];
let _throttleTimer: ReturnType<typeof setTimeout> | null = null;

const THROTTLE_MS = 300; // throttle content updates

/** Start sharing the active editor's content in the given call room. */
export function startCodeShare(callRoom: string): void {
  if (_sharing) {
    stopCodeShare();
  }

  _sharing = true;
  _callRoom = callRoom;
  const userId = getSocketUserId();
  if (!userId) { return; }

  // Send the initial editor content
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    sendEditorContent(editor, "code_share_start");
  }

  // Listen for editor changes
  _disposables.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && _sharing) {
        sendEditorContent(editor, "code_share_update");
      }
    })
  );

  _disposables.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (
        _sharing &&
        e.contentChanges.length > 0 &&
        e.document === vscode.window.activeTextEditor?.document
      ) {
        throttledSendContent();
      }
    })
  );

  console.log(`[XercaiiGlobe] Code sharing started in room ${callRoom}`);
}

/** Stop sharing editor content. */
export function stopCodeShare(): void {
  if (!_sharing) { return; }

  const socket = getExtSocket();
  const userId = getSocketUserId();

  if (_callRoom && userId) {
    socket.emit("code_share_stop", {
      call_room: _callRoom,
      user_id: userId,
    });
  }

  _sharing = false;
  _callRoom = null;

  if (_throttleTimer) {
    clearTimeout(_throttleTimer);
    _throttleTimer = null;
  }

  _disposables.forEach((d) => d.dispose());
  _disposables = [];

  console.log("[XercaiiGlobe] Code sharing stopped");
}

/** Whether code sharing is currently active. */
export function isSharingCode(): boolean {
  return _sharing;
}

/** Send the editor content via socket event (throttled for updates). */
function sendEditorContent(
  editor: vscode.TextEditor,
  event: "code_share_start" | "code_share_update"
): void {
  const socket = getExtSocket();
  const userId = getSocketUserId();
  if (!userId || !_callRoom) { return; }

  const doc = editor.document;
  const fileName = path.basename(doc.fileName);
  const language = getLanguageDisplayName(doc.languageId);
  const content = doc.getText();

  // Cap content at 100KB to avoid flooding Socket.IO
  const cappedContent = content.length > 100_000
    ? content.substring(0, 100_000) + "\n// ... (truncated)"
    : content;

  socket.emit(event, {
    call_room: _callRoom,
    user_id: userId,
    file_name: fileName,
    language,
    content: cappedContent,
  });
}

/** Throttled version of sendEditorContent for text document changes. */
function throttledSendContent(): void {
  if (_throttleTimer) {
    clearTimeout(_throttleTimer);
  }

  _throttleTimer = setTimeout(() => {
    _throttleTimer = null;
    const editor = vscode.window.activeTextEditor;
    if (editor && _sharing) {
      sendEditorContent(editor, "code_share_update");
    }
  }, THROTTLE_MS);
}

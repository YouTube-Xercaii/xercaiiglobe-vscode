/**
 * XercaiiGlobe VS Code Extension — Socket.IO client
 *
 * Connects to the XercaiiGlobe server for real-time call notifications
 * and live code sharing during calls.
 */

import { io, Socket } from "socket.io-client";
import { getConfig } from "./config";

let socket: Socket | null = null;
let _userId: string | null = null;
let _callRoom: string | null = null;

/** Get or create the singleton Socket.IO client. */
export function getExtSocket(): Socket {
  if (!socket) {
    const config = getConfig();
    const baseUrl = config.apiUrl.replace(/\/+$/, "");

    socket = io(baseUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("[XercaiiGlobe Socket] Connected");
      if (_userId) {
        socket!.emit("join_user_room", { user_id: _userId });
        socket!.emit("join_activity");
      }
      if (_callRoom) {
        socket!.emit("rejoin_call_room", { call_room: _callRoom });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[XercaiiGlobe Socket] Disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      console.warn(`[XercaiiGlobe Socket] Connection error: ${err.message}`);
    });
  }

  return socket;
}

/** Connect and join the user's personal room + activity room. */
export function connectExtSocket(userId: string): void {
  _userId = userId;
  const s = getExtSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit("join_user_room", { user_id: userId });
  s.emit("join_activity");
}

/** Disconnect the socket. */
export function disconnectExtSocket(): void {
  if (socket) {
    socket.emit("leave_activity");
    socket.disconnect();
    socket = null;
    _userId = null;
    _callRoom = null;
  }
}

/** Get the current user ID (if connected). */
export function getSocketUserId(): string | null {
  return _userId;
}

/** Join (or leave) the call room so we receive mute-state and code-share events. */
export function setSocketCallRoom(room: string | null): void {
  _callRoom = room;
  if (socket && socket.connected && room) {
    socket.emit("rejoin_call_room", { call_room: room });
  }
}

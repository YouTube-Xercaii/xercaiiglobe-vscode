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
      // Re-join personal room on reconnect
      if (_userId) {
        socket!.emit("join_user_room", { user_id: _userId });
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

/** Connect and join the user's personal room. */
export function connectExtSocket(userId: string): void {
  _userId = userId;
  const s = getExtSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit("join_user_room", { user_id: userId });
}

/** Disconnect the socket. */
export function disconnectExtSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    _userId = null;
  }
}

/** Get the current user ID (if connected). */
export function getSocketUserId(): string | null {
  return _userId;
}

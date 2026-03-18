import { sendHeartbeat } from "./api";
import { isActive, getCurrentFile, getCurrentLanguage, getCurrentProject } from "./tracker";
import { isAuthenticated } from "./config";
import { HeartbeatPayload } from "./types";

const HEARTBEAT_INTERVAL_MS = 3 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatLoop(): void {
  if (heartbeatTimer) {
    return;
  }

  heartbeatTimer = setInterval(async () => {
    if (!isAuthenticated()) {
      return;
    }

    if (!isActive()) {
      return;
    }

    const file = getCurrentFile();
    const language = getCurrentLanguage();
    const project = getCurrentProject();

    if (!file && !language) {
      return;
    }

    const payload: HeartbeatPayload = {
      file: file || "unknown",
      language: language || "Unknown",
      editor: "VS Code",
      project: project || "Unknown",
      timestamp: new Date().toISOString(),
    };

    await sendHeartbeat(payload);
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeatLoop(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export async function sendImmediateHeartbeat(): Promise<void> {
  if (!isAuthenticated() || !isActive()) {
    return;
  }

  const payload: HeartbeatPayload = {
    file: getCurrentFile() || "unknown",
    language: getCurrentLanguage() || "Unknown",
    editor: "VS Code",
    project: getCurrentProject() || "Unknown",
    timestamp: new Date().toISOString(),
  };

  await sendHeartbeat(payload);
}

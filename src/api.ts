import axios, { AxiosInstance, AxiosError } from "axios";
import { getConfig } from "./config";
import { HeartbeatPayload, HeartbeatResponse, UserInfo } from "./types";

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  const config = getConfig();
  if (!client) {
    client = axios.create({
      baseURL: config.apiUrl.replace(/\/+$/, "") + "/api/v1",
      timeout: 10_000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XercaiiGlobe-VSCode/0.1.0",
      },
    });
  }

  client.defaults.baseURL = config.apiUrl.replace(/\/+$/, "") + "/api/v1";
  client.defaults.headers.common["X-API-Key"] = config.apiKey;
  return client;
}

export function resetClient(): void {
  client = null;
}

export async function sendHeartbeat(
  payload: HeartbeatPayload
): Promise<HeartbeatResponse | null> {
  try {
    const res = await getClient().post<HeartbeatResponse>(
      "/heartbeats",
      payload
    );
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 401) {
      console.warn("[XercaiiGlobe] Unauthorized — check your API key.");
    } else {
      console.warn("[XercaiiGlobe] Heartbeat failed:", axiosErr.message);
    }
    return null;
  }
}

export async function getMe(): Promise<UserInfo | null> {
  try {
    const res = await getClient().get<UserInfo>("/auth/me");
    return res.data;
  } catch {
    return null;
  }
}

export async function sendOffline(): Promise<void> {
  try {
    await getClient().delete("/heartbeats");
  } catch {
  }
}

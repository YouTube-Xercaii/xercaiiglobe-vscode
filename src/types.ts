export interface HeartbeatPayload {
  file: string;
  language: string;
  editor: string;
  project: string;
  timestamp: string;
  os_name?: string;
}

export interface HeartbeatResponse {
  status: string;
  session_id?: string;
}

export interface XercaiiGlobeConfig {
  apiKey: string;
  apiUrl: string;
  trackingEnabled: boolean;
  showFileName: boolean;
  showProjectName: boolean;
}

export interface UserInfo {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  api_key?: string;
  is_active: boolean;
  country_name?: string;
  city?: string;
}

export type TrackingStatus = "active" | "idle" | "offline";

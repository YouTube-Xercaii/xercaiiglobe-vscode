export interface HeartbeatPayload {
  file: string;
  language: string;
  editor: string;
  project: string;
  timestamp: string;
  os_name?: string;
  /** Folders from workspace root to file parent (optional). */
  path_folders?: string[];
  /** Full workspace tree when user enabled sharing on the website. */
  project_tree?: ProjectTreeNode[];
}

export interface ProjectTreeNode {
  name: string;
  type: "file" | "folder";
  children?: ProjectTreeNode[];
}

export interface HeartbeatResponse {
  status: string;
  session_id?: string;
  show_full_project_tree_public?: boolean;
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
  show_full_project_tree_public?: boolean;
}

export type TrackingStatus = "active" | "idle" | "offline";

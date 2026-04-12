import type { UserInfo } from "./types";
import type { HeartbeatResponse } from "./types";

let showFullProjectTree = false;

export function refreshLiveTreePreferenceFromUser(me: UserInfo | null): void {
  if (me && typeof me.show_full_project_tree_public === "boolean") {
    showFullProjectTree = me.show_full_project_tree_public;
  }
}

export function applyHeartbeatPrefs(res: HeartbeatResponse): void {
  if (typeof res.show_full_project_tree_public === "boolean") {
    showFullProjectTree = res.show_full_project_tree_public;
  }
}

export function wantsFullProjectTree(): boolean {
  return showFullProjectTree;
}

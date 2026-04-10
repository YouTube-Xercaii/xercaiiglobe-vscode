import * as vscode from "vscode";
import { XercaiiGlobeConfig } from "./types";

const SECTION = "xercaiiglobe";

/**
 * Merged settings can hide a User-level API key when the workspace sets
 * `"xercaiiglobe.apiKey": ""` (common in generated .vscode/settings.json).
 * Fall back to the global value only in that case so sign-in still works.
 */
function resolveApiKey(): string {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  const merged = (cfg.get<string>("apiKey", "") || "").trim();
  if (merged.length > 0) {
    return merged;
  }
  const ins = cfg.inspect<string>("apiKey");
  const explicitEmptyAtWorkspace =
    ins?.workspaceValue === "" || ins?.workspaceFolderValue === "";
  if (explicitEmptyAtWorkspace && ins?.globalValue) {
    const g = String(ins.globalValue).trim();
    if (g.length > 0) {
      return g;
    }
  }
  return "";
}

export function getConfig(): XercaiiGlobeConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    apiKey: resolveApiKey(),
    apiUrl: cfg.get<string>("apiUrl", "https://devglobe-api.onrender.com"),
    trackingEnabled: cfg.get<boolean>("trackingEnabled", true),
    showFileName: cfg.get<boolean>("showFileName", true),
    showProjectName: cfg.get<boolean>("showProjectName", true),
  };
}

export async function updateSetting<K extends keyof XercaiiGlobeConfig>(
  key: K,
  value: XercaiiGlobeConfig[K],
  global = true
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  await cfg.update(key, value, global ? vscode.ConfigurationTarget.Global : undefined);
}

export function isAuthenticated(): boolean {
  return getConfig().apiKey.length > 0;
}

export async function clearApiKey(): Promise<void> {
  await updateSetting("apiKey", "");
}

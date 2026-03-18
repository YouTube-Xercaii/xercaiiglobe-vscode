import * as vscode from "vscode";
import { XercaiiGlobeConfig } from "./types";

const SECTION = "xercaiiglobe";

export function getConfig(): XercaiiGlobeConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    apiKey: cfg.get<string>("apiKey", ""),
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

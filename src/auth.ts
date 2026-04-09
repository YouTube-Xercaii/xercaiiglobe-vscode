import * as vscode from "vscode";
import { getConfig, updateSetting, clearApiKey } from "./config";
import { getMe, resetClient } from "./api";

const FRONTEND_URL = "https://devglobe-web.onrender.com";

export async function signIn(): Promise<void> {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  const opened = await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));

  if (!opened) {
    vscode.window.showErrorMessage(
      "XercaiiGlobe: Could not open the browser. Please visit the dashboard manually to get your API key."
    );
    return;
  }

  const apiKey = await vscode.window.showInputBox({
    title: "XercaiiGlobe — Enter API Key",
    prompt:
      "Paste the API key from your XercaiiGlobe dashboard (starts with xg_)",
    placeHolder: "xg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value) {
        return "API key is required";
      }
      if (!value.startsWith("xg_")) {
        return 'API key must start with "xg_"';
      }
      if (value.length < 10) {
        return "API key is too short";
      }
      return null;
    },
  });

  if (!apiKey) {
    return;
  }

  await updateSetting("apiKey", apiKey);
  resetClient();

  const user = await getMe();
  if (user) {
    vscode.window.showInformationMessage(
      `XercaiiGlobe: Signed in as ${user.username}. Your coding activity will appear on the globe!`
    );
  } else {
    vscode.window.showWarningMessage(
      "XercaiiGlobe: API key saved, but could not verify it. Check your settings."
    );
  }
}

export async function setApiKey(): Promise<void> {
  const currentKey = getConfig().apiKey;

  const apiKey = await vscode.window.showInputBox({
    title: "XercaiiGlobe — Set API Key",
    prompt: "Paste your XercaiiGlobe API key",
    placeHolder: "xg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    value: currentKey,
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value) {
        return "API key is required";
      }
      if (!value.startsWith("xg_")) {
        return 'API key must start with "xg_"';
      }
      return null;
    },
  });

  if (!apiKey) {
    return;
  }

  await updateSetting("apiKey", apiKey);
  resetClient();
  vscode.window.showInformationMessage("XercaiiGlobe: API key updated.");
}

export async function signOut(): Promise<void> {
  await clearApiKey();
  resetClient();
  vscode.window.showInformationMessage("XercaiiGlobe: Signed out.");
}

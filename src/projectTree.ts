import * as vscode from "vscode";
import { getConfig } from "./config";
import type { ProjectTreeNode } from "./types";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".turbo",
  "Pods",
  ".gradle",
]);

const TREE_TTL_MS = 40_000;
const MAX_NODES = 520;
const MAX_DEPTH = 14;

let cachedTree: ProjectTreeNode[] | undefined;
let cacheUntil = 0;
let cacheKey = "";
let refreshInFlight: Promise<ProjectTreeNode[] | undefined> | null = null;

export function invalidateProjectTreeCache(): void {
  cachedTree = undefined;
  cacheUntil = 0;
  cacheKey = "";
  refreshInFlight = null;
}

function workspaceKeyForActiveEditor(): string | undefined {
  const editor =
    vscode.window.activeTextEditor ??
    vscode.window.visibleTextEditors.find((e) => e.document.uri.scheme === "file") ??
    vscode.window.visibleTextEditors[0];
  if (!editor || editor.document.uri.scheme !== "file") {
    return undefined;
  }
  const wf = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!wf || !getConfig().showProjectName) {
    return undefined;
  }
  return wf.uri.fsPath;
}

/** Cached tree only — never blocks on disk IO (safe for immediate heartbeats). */
export function getWorkspaceProjectTreeCachedOnly(): ProjectTreeNode[] | undefined {
  const key = workspaceKeyForActiveEditor();
  if (!key) {
    return undefined;
  }
  const now = Date.now();
  if (cachedTree !== undefined && cacheKey === key && now < cacheUntil) {
    return cachedTree;
  }
  return undefined;
}

/** Refresh tree in the background; heartbeats attach the result on later ticks. */
export function scheduleWorkspaceProjectTreeRefresh(): void {
  if (refreshInFlight) {
    return;
  }
  refreshInFlight = getWorkspaceProjectTreeForActiveEditor().finally(() => {
    refreshInFlight = null;
  });
}

function skipSensitiveFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower === ".env" || lower.startsWith(".env.")) {
    return true;
  }
  if (lower.endsWith(".pem")) {
    return true;
  }
  if (name === "id_rsa" || name === "id_ed25519" || name === "id_ecdsa") {
    return true;
  }
  return false;
}

async function readDirTree(
  uri: vscode.Uri,
  depth: number,
  counter: { n: number }
): Promise<ProjectTreeNode[]> {
  if (depth > MAX_DEPTH || counter.n >= MAX_NODES) {
    return [];
  }
  let entries: [string, vscode.FileType][];
  try {
    entries = await vscode.workspace.fs.readDirectory(uri);
  } catch {
    return [];
  }

  entries.sort((a, b) => {
    const da = a[1] === vscode.FileType.Directory ? 0 : 1;
    const db = b[1] === vscode.FileType.Directory ? 0 : 1;
    if (da !== db) {
      return da - db;
    }
    return a[0].localeCompare(b[0]);
  });

  const nodes: ProjectTreeNode[] = [];
  for (const [name, ft] of entries) {
    if (counter.n >= MAX_NODES) {
      break;
    }
    if (ft === vscode.FileType.Directory) {
      if (SKIP_DIRS.has(name)) {
        continue;
      }
      counter.n++;
      const childUri = vscode.Uri.joinPath(uri, name);
      const children = await readDirTree(childUri, depth + 1, counter);
      nodes.push({ name, type: "folder", children });
    } else if (ft === vscode.FileType.File) {
      if (skipSensitiveFile(name)) {
        continue;
      }
      counter.n++;
      nodes.push({ name, type: "file" });
    }
  }
  return nodes;
}

/**
 * Workspace root listing (files + folders) for the folder that contains the active editor.
 * Cached ~40s per workspace folder to limit IO.
 */
export async function getWorkspaceProjectTreeForActiveEditor(): Promise<
  ProjectTreeNode[] | undefined
> {
  const key = workspaceKeyForActiveEditor();
  if (!key) {
    return undefined;
  }
  const wfUri = vscode.Uri.file(key);
  const now = Date.now();
  if (cachedTree !== undefined && cacheKey === key && now < cacheUntil) {
    return cachedTree;
  }

  const counter = { n: 0 };
  const children = await readDirTree(wfUri, 0, counter);
  cachedTree = children;
  cacheKey = key;
  cacheUntil = now + TREE_TTL_MS;
  return children;
}

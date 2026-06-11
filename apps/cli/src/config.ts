/**
 * Local config — persisted at ~/.questpage/config.json.
 *
 * Holds the API base URL and the active credential (either a JWT session token
 * obtained via device-code login, or an API key pasted via `life login`).
 *
 * The file is chmod 0600 on POSIX so other local users can't read the token.
 */

import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface LifeConfig {
  /** Base URL of the QuestPage API. Default: http://localhost:3000 (dev). */
  apiUrl: string;
  /** Active credential, set by `life login`. */
  auth?: {
    /** "apikey" → token is a `lk_…` API key. "session" → token is a JWT from device flow. */
    kind: 'apikey' | 'session';
    token: string;
    /** Cached fields for quick `life status` output. */
    user?: { id: number; email: string; name: string };
    /** ISO date when the credential was saved. */
    issuedAt: string;
  };
}

const DEFAULT_API_URL = process.env.QUESTPAGE_API_URL ?? process.env.LIFEOS_API_URL ?? 'http://localhost:3000';

const CONFIG_DIR = join(homedir(), '.questpage');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<LifeConfig> {
  const envToken = process.env.QUESTPAGE_API_KEY ?? process.env.QUESTPAGE_TOKEN;
  let envAuth: LifeConfig['auth'] = undefined;
  if (envToken) {
    envAuth = {
      kind: 'apikey',
      token: envToken,
      issuedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LifeConfig>;
    return {
      apiUrl: process.env.QUESTPAGE_API_URL ?? parsed.apiUrl ?? DEFAULT_API_URL,
      auth: envAuth ?? parsed.auth,
    };
  } catch {
    return {
      apiUrl: process.env.QUESTPAGE_API_URL ?? DEFAULT_API_URL,
      auth: envAuth,
    };
  }
}

export async function saveConfig(cfg: LifeConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
  // Best-effort chmod — silently no-op on Windows
  try { await chmod(CONFIG_PATH, 0o600); } catch { /* ignore */ }
}

export async function clearAuth(): Promise<void> {
  const cfg = await loadConfig();
  delete cfg.auth;
  await saveConfig(cfg);
}

export function configPath(): string {
  return CONFIG_PATH;
}

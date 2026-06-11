/**
 * Tiny fetch wrapper that injects auth headers and unwraps errors.
 *
 *   const api = createApi(cfg);
 *   const me = await api.get('/api/v1/me');
 *
 * No SDK dependency — this CLI is intentionally portable. If you want a
 * richer typed surface, swap to @questpage/sdk on top of the same fetch logic.
 */

import { startSpinner } from './output.js';
import type { LifeConfig } from './config.js';

export interface ApiClient {
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
  delete<T = unknown>(path: string): Promise<T>;
  raw(path: string, init?: RequestInit): Promise<Response>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApi(cfg: LifeConfig): ApiClient {
  const base = cfg.apiUrl.replace(/\/+$/, '');

  function headers(): HeadersInit {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'questpage-cli',
    };
    if (cfg.auth) {
      if (cfg.auth.kind === 'apikey') {
        h['X-API-Key'] = cfg.auth.token;
      } else {
        h['Authorization'] = `Bearer ${cfg.auth.token}`;
      }
    }
    return h;
  }

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const spinner = startSpinner('Connecting to QuestPage server');
    const url = base + path;
    const init: RequestInit = { method, headers: headers() };
    if (body !== undefined) init.body = JSON.stringify(body);

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      spinner.stop('Network error', true);
      throw new ApiError(
        0,
        `Network error contacting ${base}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const ct = res.headers.get('content-type') ?? '';
    const text = await res.text();
    const parsed = ct.includes('json') && text ? safeParseJson(text) : text;

    if (!res.ok) {
      spinner.stop(`Request failed: ${res.status}`, true);
      const msg =
        typeof parsed === 'string'
          ? parsed.slice(0, 240)
          : (parsed as { message?: string })?.message ?? `${res.status} ${res.statusText}`;
      throw new ApiError(res.status, msg, parsed);
    }
    
    spinner.stop();
    return parsed as T;
  }

  return {
    get: (p) => call('GET', p),
    post: (p, body) => call('POST', p, body),
    patch: (p, body) => call('PATCH', p, body),
    delete: (p) => call('DELETE', p),
    raw: (p, init) => fetch(base + p, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } }),
  };
}

function safeParseJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

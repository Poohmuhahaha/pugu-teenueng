import { ask, askSecret } from '../prompts.js';
import { saveConfig, type LifeConfig } from '../config.js';
import { createApi, ApiError } from '../api.js';
import { c } from '../colors.js';
import { info, ok, err } from '../output.js';
import type { Ctx } from '../cli.js';

export async function runLogin(args: string[], ctx: Ctx): Promise<void> {
  const wantDevice = args.includes('--device') || args.includes('-d');
  if (wantDevice) {
    await deviceLogin(ctx);
    return;
  }
  await apiKeyLogin(ctx);
}

async function apiKeyLogin(ctx: Ctx): Promise<void> {
  const existing = await ctx.config();
  info('Paste a Workspace Seal. Create one in Admin → Workspace Seals, or run `life keys new` after a first sign-in.');
  const apiUrl = await ask(c.dim('API URL'), existing.apiUrl);
  const token = (await askSecret('Workspace Seal:')).trim();
  if (!token) { err('aborted: empty key'); return; }
  if (!token.startsWith('lk_') || !token.includes('.')) {
    err('that does not look like a Pugu Workspace Seal (expected `lk_<prefix>.<secret>`)');
    return;
  }

  const cfg: LifeConfig = {
    apiUrl,
    auth: { kind: 'apikey', token, issuedAt: new Date().toISOString() },
  };
  const api = createApi(cfg);

  try {
    type Me = { user: { id: number; email: string; name: string } };
    const me = await api.get<Me>('/api/v1/me');
    if (cfg.auth) cfg.auth.user = me.user;
    await saveConfig(cfg);
    ok(`signed in as ${c.bold(me.user.email)} ${c.dim(`(#${me.user.id})`)}`);
  } catch (e) {
    if (e instanceof ApiError) {
      err(`API rejected the key: ${e.message}`);
    } else {
      err(e instanceof Error ? e.message : String(e));
    }
  }
}

interface DeviceCode {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface DevicePoll {
  status: 'pending' | 'approved' | 'denied' | 'expired';
  token?: string;
  user?: { id: number; email: string; name: string };
}

async function deviceLogin(ctx: Ctx): Promise<void> {
  const existing = await ctx.config();
  const apiUrl = await ask(c.dim('API URL'), existing.apiUrl);

  const tmpCfg: LifeConfig = { apiUrl };
  const api = createApi(tmpCfg);

  let start: DeviceCode;
  try {
    start = await api.post<DeviceCode>('/api/auth/device/start');
  } catch (e) {
    err(`API does not support device-code auth on this instance: ${e instanceof Error ? e.message : String(e)}`);
    info('Falling back to API-key login. Run `life login` (without --device).');
    return;
  }

  info(`Open this URL in your browser:`);
  process.stdout.write(`  ${c.cyan(c.underline(start.verification_uri_complete))}\n`);
  info(`If asked, confirm this code: ${c.bold(start.user_code)}`);
  info(`Waiting for approval (expires in ${Math.round(start.expires_in / 60)} min)…`);

  void openBrowser(start.verification_uri_complete);

  const deadline = Date.now() + start.expires_in * 1000;
  const interval = Math.max(start.interval, 2) * 1000;

  while (Date.now() < deadline) {
    await sleep(interval);
    try {
      const poll = await api.post<DevicePoll>('/api/auth/device/poll', { device_code: start.device_code });
      if (poll.status === 'pending') continue;
      if (poll.status === 'denied') { err('access denied in browser'); return; }
      if (poll.status === 'expired') { err('device code expired — retry login'); return; }
      if (poll.status === 'approved' && poll.token) {
        const cfg: LifeConfig = {
          apiUrl,
          auth: {
            kind: 'session',
            token: poll.token,
            user: poll.user,
            issuedAt: new Date().toISOString(),
          },
        };
        await saveConfig(cfg);
        ok(`signed in as ${c.bold(poll.user?.email ?? '?')} via device code`);
        return;
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        const body = e.body as { code?: string } | undefined;
        if (body?.code === 'authorization_pending') continue;
        if (body?.code === 'slow_down') { await sleep(2000); continue; }
      }
      throw e;
    }
  }
  err('timed out waiting for browser approval');
}

async function openBrowser(url: string): Promise<void> {
  const { spawn } = await import('node:child_process');
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch { /* swallow — printed URL is the source of truth */ }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

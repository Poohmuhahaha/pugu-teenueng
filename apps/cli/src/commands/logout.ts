import { clearAuth } from '../config.js';
import { ok } from '../output.js';
import type { Ctx } from '../cli.js';

export async function runLogout(_args: string[], _ctx: Ctx): Promise<void> {
  await clearAuth();
  ok('cleared stored credentials');
}

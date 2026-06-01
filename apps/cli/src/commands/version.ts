import { out } from '../output.js';
import type { Ctx } from '../cli.js';

const VERSION = '0.1.0';

export async function runVersion(_args: string[], _ctx: Ctx): Promise<void> {
  out.write(`life ${VERSION}\n`);
}

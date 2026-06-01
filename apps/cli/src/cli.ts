/**
 * Life Command — main entrypoint.
 *
 * Two modes:
 *   - `life <command> [args]`       — runs the command and exits
 *   - `life` (no args, TTY only)    — interactive REPL with command dispatch
 *
 * Commands live in src/commands/<name>.ts. Each exports a `run(args, ctx)`
 * function returning Promise<void>.
 */

import { loadConfig } from './config.js';
import { createApi } from './api.js';
import { c } from './colors.js';
import { banner, info, err, line, out } from './output.js';
import { createRepl } from './prompts.js';

import { runHelp } from './commands/help.js';
import { runLogin } from './commands/login.js';
import { runLogout } from './commands/logout.js';
import { runStatus } from './commands/status.js';
import { runVersion } from './commands/version.js';
import { runWorkspaces } from './commands/workspaces.js';
import { runTypes } from './commands/types.js';
import { runLs } from './commands/ls.js';
import { runCat } from './commands/cat.js';
import { runNew } from './commands/new.js';
import { runCapture } from './commands/capture.js';
import { runSearch } from './commands/search.js';
import { runKeys } from './commands/keys.js';

export interface Ctx {
  /** Re-read on every invocation so config edits between REPL commands take effect. */
  config(): ReturnType<typeof loadConfig>;
  /** Fresh API client bound to the *current* config. */
  api(): Promise<ReturnType<typeof createApi>>;
}

type Handler = (args: string[], ctx: Ctx) => Promise<void>;

const COMMANDS: Record<string, Handler> = {
  help: runHelp,
  version: runVersion,
  '--version': runVersion,
  '-v': runVersion,
  '--help': runHelp,
  '-h': runHelp,
  login: runLogin,
  logout: runLogout,
  status: runStatus,
  whoami: runStatus,
  workspaces: runWorkspaces,
  ws: runWorkspaces,
  types: runTypes,
  ls: runLs,
  list: runLs,
  cat: runCat,
  show: runCat,
  new: runNew,
  create: runNew,
  capture: runCapture,
  search: runSearch,
  keys: runKeys,
};

function buildCtx(): Ctx {
  return {
    config: () => loadConfig(),
    async api() {
      const cfg = await loadConfig();
      return createApi(cfg);
    },
  };
}

async function dispatch(args: string[], ctx: Ctx): Promise<boolean> {
  if (args.length === 0) return false;
  const [cmd, ...rest] = args;
  const handler = COMMANDS[cmd];
  if (!handler) {
    err(`unknown command: ${cmd}`);
    info(`run ${c.cyan('life help')} for the full command list`);
    process.exitCode = 1;
    return true;
  }
  try {
    await handler(rest, ctx);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  }
  return true;
}

export async function main(argv: string[]): Promise<void> {
  const ctx = buildCtx();

  // One-shot mode
  if (argv.length > 0) {
    await dispatch(argv, ctx);
    return;
  }

  // Interactive REPL
  if (!process.stdin.isTTY) {
    // No TTY + no args → print help and exit cleanly. Avoids hanging in CI.
    await runHelp([], ctx);
    return;
  }

  banner();
  const rl = createRepl(c.bold('life ') + c.dim('› '));
  rl.prompt();

  rl.on('line', async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }
    if (trimmed === 'exit' || trimmed === 'quit' || trimmed === '.exit') {
      rl.close();
      return;
    }
    // Lightweight argv split — respects double-quoted strings so
    // `capture "buy milk"` parses as one arg.
    const tokens = splitArgs(trimmed);
    const handled = await dispatch(tokens, ctx);
    if (handled) line();
    rl.prompt();
  });

  rl.on('close', () => {
    out.write(c.dim('\nbye\n'));
    process.exit(0);
  });
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) {
      if (cur) { out.push(cur); cur = ''; }
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

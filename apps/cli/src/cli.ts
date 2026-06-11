/**
 * Quest Command — main entrypoint.
 *
 * Two modes:
 *   - `quest <command> [args]`       — runs the command and exits (via Commander)
 *   - `quest` (no args, TTY only)    — interactive REPL with command dispatch
 *
 * Commands live in src/commands/<name>.ts.
 */

import { Command } from 'commander';
import { exec } from 'node:child_process';
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

function buildCtx(): Ctx {
  return {
    config: () => loadConfig(),
    async api() {
      const cfg = await loadConfig();
      return createApi(cfg);
    },
  };
}

export function openDocs(): void {
  const docPath = "D:/PROJECTS/website/questpage/docs/proof_of_concept_proposal.pdf";
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  
  info(`Opening documentation: ${docPath}`);
  
  if (process.platform === 'win32') {
    exec(`cmd.exe /c start "" "${docPath}"`, (error) => {
      if (error) {
        err(`Failed to open docs: ${error.message}`);
        process.exitCode = 1;
      }
    });
  } else {
    exec(`${start} "${docPath}"`, (error) => {
      if (error) {
        err(`Failed to open docs: ${error.message}`);
        process.exitCode = 1;
      }
    });
  }
}

async function runHandler(handler: (args: string[], ctx: Ctx) => Promise<void>, args: string[], ctx: Ctx) {
  try {
    await handler(args, ctx);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  }
}

export async function main(argv: string[]): Promise<void> {
  const ctx = buildCtx();

  // One-shot mode with CLI arguments
  if (argv.length > 0) {
    const program = new Command();
    program
      .name('quest')
      .description('QuestPage CLI — the command line tool for QuestPage')
      .version('0.1.0');

    // /help command
    program
      .command('/help')
      .description('Open the project documentation PDF')
      .action(() => {
        openDocs();
      });

    // login command
    program
      .command('login [token]')
      .description('Log into QuestPage (using token or device authentication)')
      .option('-d, --device', 'Use device confirmation flow')
      .action(async (token, options) => {
        const args = [];
        if (token) args.push(token);
        if (options.device) args.push('--device');
        await runHandler(runLogin, args, ctx);
      });

    // logout command
    program
      .command('logout')
      .description('Log out and clear stored credentials')
      .action(async () => {
        await runHandler(runLogout, [], ctx);
      });

    // status command
    program
      .command('status')
      .alias('whoami')
      .description('Show active user status and workspace info')
      .action(async () => {
        await runHandler(runStatus, [], ctx);
      });

    // workspaces command
    program
      .command('workspaces [sub...]')
      .alias('ws')
      .description('List workspaces or switch active workspace')
      .action(async (sub) => {
        await runHandler(runWorkspaces, sub || [], ctx);
      });

    // types command
    program
      .command('types')
      .description('List available quest types in the active workspace')
      .action(async () => {
        await runHandler(runTypes, [], ctx);
      });

    // ls command
    program
      .command('ls <type>')
      .alias('list')
      .description('List entries of a specific quest type')
      .option('-p, --page <page>', 'Page number')
      .option('-s, --size <size>', 'Page size')
      .option('-f, --fields <fields>', 'Comma-separated fields to display')
      .action(async (type, options) => {
        const args = [type];
        if (options.page) args.push(`--page=${options.page}`);
        if (options.size) args.push(`--size=${options.size}`);
        if (options.fields) args.push(`--fields=${options.fields}`);
        await runHandler(runLs, args, ctx);
      });

    // cat command
    program
      .command('cat <type> <id>')
      .alias('show')
      .description('Show a single entry by type and ID')
      .action(async (type, id) => {
        await runHandler(runCat, [type, id], ctx);
      });

    // new command
    program
      .command('new <type>')
      .alias('create')
      .description('Create a new entry of a specific type interactively')
      .action(async (type) => {
        await runHandler(runNew, [type], ctx);
      });

    // capture command
    program
      .command('capture <text>')
      .description('Quickly capture an entry')
      .option('-t, --type <type>', 'Quest type to use')
      .action(async (text, options) => {
        const args = [text];
        if (options.type) args.push(`--type=${options.type}`);
        await runHandler(runCapture, args, ctx);
      });

    // search command
    program
      .command('search <query>')
      .description('Search entries across the active workspace')
      .action(async (query) => {
        await runHandler(runSearch, [query], ctx);
      });

    // keys command
    program
      .command('keys [sub...]')
      .description('Manage API keys (Workspace Seals)')
      .action(async (sub) => {
        await runHandler(runKeys, sub || [], ctx);
      });

    // help subcommand
    program
      .command('help')
      .description('Display help text')
      .action(async () => {
        await runHandler(runHelp, [], ctx);
      });

    // Handle unknown commands
    program.on('command:*', () => {
      err(`Unknown command: ${program.args.join(' ')}`);
      info('Run quest --help or quest help for usage information');
      process.exit(1);
    });

    try {
      // Parse process.argv (Commander expects standard node argv format)
      // Since argv passed from life.js is process.argv.slice(2), we prepend
      // dummy elements so Commander can parse correctly
      program.parse(['node', 'quest', ...argv]);
    } catch (e) {
      err(e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
    return;
  }

  // Interactive REPL Mode
  if (!process.stdin.isTTY) {
    await runHelp([], ctx);
    return;
  }

  banner();
  const rl = createRepl(c.bold('quest ') + c.dim('› '));
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
    const tokens = splitArgs(trimmed);
    const [cmd, ...rest] = tokens;
    
    if (cmd === '/help') {
      openDocs();
    } else {
      const COMMANDS: Record<string, typeof runHelp> = {
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
      const handler = COMMANDS[cmd];
      if (!handler) {
        err(`unknown command: ${cmd}`);
        info(`run ${c.cyan('help')} for the full command list`);
      } else {
        try {
          await handler(rest, ctx);
        } catch (e) {
          err(e instanceof Error ? e.message : String(e));
        }
      }
    }
    line();
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

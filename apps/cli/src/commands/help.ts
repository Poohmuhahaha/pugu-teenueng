import { c } from '../colors.js';
import { out } from '../output.js';
import type { Ctx } from '../cli.js';

export async function runHelp(_args: string[], _ctx: Ctx): Promise<void> {
  out.write(
    [
      '',
      c.bold('Dashboard Command') + c.dim(' — QuestPage CLI'),
      '',
      c.dim('USAGE'),
      `  ${c.cyan('quest')} ${c.dim('<command> [args]')}`,
      `  ${c.cyan('quest')}                ${c.dim('# interactive REPL')}`,
      '',
      c.dim('AUTHENTICATION'),
      `  ${c.cyan('login')}                ${c.dim('paste a Workspace Seal (qs_…)')}`,
      `  ${c.cyan('login --device')}       ${c.dim('open browser, confirm device, get a session')}`,
      `  ${c.cyan('logout')}               ${c.dim('clear stored credentials')}`,
      `  ${c.cyan('status')}               ${c.dim('show the active user + tavern')}`,
      '',
      c.dim('TAVERNS'),
      `  ${c.cyan('workspaces')}           ${c.dim('list taverns you belong to')}`,
      `  ${c.cyan('ws use <id|slug>')}     ${c.dim('switch active tavern')}`,
      '',
      c.dim('QUEST BOARDS & ENTRIES'),
      `  ${c.cyan('types')}                ${c.dim('list quest types in the active tavern')}`,
      `  ${c.cyan('ls <type>')}            ${c.dim('list entries (pagination: --page=2 --size=50)')}`,
      `  ${c.cyan('cat <type> <id>')}      ${c.dim('show a single entry')}`,
      `  ${c.cyan('new <type>')}           ${c.dim('create an entry interactively')}`,
      `  ${c.cyan('capture "<text>"')}     ${c.dim('quick-capture as a note (--type=<slug> to override)')}`,
      `  ${c.cyan('search "<query>"')}     ${c.dim('full-text search across the tavern')}`,
      '',
      c.dim('ADMINISTRATION'),
      `  ${c.cyan('keys')}                 ${c.dim('list, create, revoke Workspace Seals')}`,
      '',
      c.dim('UTILITY'),
      `  ${c.cyan('help')}                 ${c.dim('this screen')}`,
      `  ${c.cyan('version')}              ${c.dim('print version')}`,
      `  ${c.cyan('exit')}                 ${c.dim('quit the REPL')}`,
      '',
      c.dim('ENVIRONMENT'),
      `  ${c.dim('QUESTPAGE_API_URL')}     ${c.dim('override the API base (default: http://localhost:3000)')}`,
      `  ${c.dim('NO_COLOR=1')}           ${c.dim('disable ANSI colours')}`,
      '',
      `  ${c.dim('Docs: https://questpage.app/docs/')}`,
      '',
    ].join('\n'),
  );
}

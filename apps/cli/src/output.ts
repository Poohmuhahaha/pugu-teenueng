/**
 * Print helpers — banner, info / warn / error blocks, ASCII tables.
 */

import { c, width as ansiWidth } from './colors.js';

export const out = process.stdout;

export function banner(): void {
  // ASCII brand mark — keeps the CLI feeling crafted without a heavy figlet dep.
  const lines = [
    '',
    c.bold('  ⬤  Life Command'),
    `  ${c.dim('LifeOS CLI · v0.1.0')}`,
    '',
    c.dim('  type'),
    `    ${c.cyan('help')}     ${c.dim('— list commands')}`,
    `    ${c.cyan('login')}    ${c.dim('— authenticate (API key or device flow)')}`,
    `    ${c.cyan('status')}   ${c.dim('— show current user + workspace')}`,
    `    ${c.cyan('exit')}     ${c.dim('— quit')}`,
    '',
  ];
  out.write(lines.join('\n') + '\n');
}

export function info(msg: string): void {
  out.write(`${c.cyan('→')} ${msg}\n`);
}
export function ok(msg: string): void {
  out.write(`${c.green('✓')} ${msg}\n`);
}
export function warn(msg: string): void {
  out.write(`${c.yellow('!')} ${msg}\n`);
}
export function err(msg: string): void {
  process.stderr.write(`${c.red('✗')} ${msg}\n`);
}

export function line(): void {
  out.write('\n');
}

/**
 * Render a small ASCII table. Inputs:
 *   headers: array of column titles
 *   rows: array-of-arrays; each row's cells are converted with String()
 *
 * Wraps automatically at the terminal width by truncating overflowing cells.
 */
export function table(headers: string[], rows: Array<Array<string | number | null | undefined>>): void {
  if (rows.length === 0) {
    out.write(c.dim('  (no rows)\n'));
    return;
  }
  const stringRows = rows.map((r) => r.map((v) => (v === null || v === undefined ? '' : String(v))));
  const widths = headers.map((h, i) =>
    Math.max(ansiWidth(h), ...stringRows.map((r) => ansiWidth(r[i] ?? ''))),
  );

  const termWidth = process.stdout.columns ?? 100;
  const totalNeeded = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 3 + 2;
  if (totalNeeded > termWidth) {
    // Shave the widest column iteratively until we fit
    const slack = totalNeeded - termWidth;
    let remaining = slack;
    while (remaining > 0) {
      const maxI = widths.indexOf(Math.max(...widths));
      const cut = Math.min(remaining, widths[maxI] - 6);
      if (cut <= 0) break;
      widths[maxI] -= cut;
      remaining -= cut;
    }
  }

  const fmt = (cells: string[], style: (s: string) => string = (s) => s) =>
    cells
      .map((cell, i) => {
        const w = widths[i];
        const padded = trunc(cell, w).padEnd(w + (cell.length - ansiWidth(cell)));
        return style(padded);
      })
      .join(c.dim(' │ '));

  out.write('  ' + fmt(headers, c.dim) + '\n');
  out.write('  ' + c.dim(widths.map((w) => '─'.repeat(w)).join('─┼─')) + '\n');
  for (const r of stringRows) {
    out.write('  ' + fmt(r) + '\n');
  }
}

function trunc(s: string, w: number): string {
  if (ansiWidth(s) <= w) return s;
  if (w <= 1) return '…';
  return s.slice(0, w - 1) + '…';
}

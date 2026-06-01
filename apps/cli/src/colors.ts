/**
 * Minimal ANSI colour helpers.
 *
 * Auto-disabled when stdout is not a TTY (CI logs, file redirects). That way
 * `life ls notes > out.txt` produces clean text without escape codes.
 *
 * Respects NO_COLOR env (https://no-color.org/) and FORCE_COLOR (Node convention).
 */

const isTTY = !!process.stdout.isTTY;
const noColor = !!process.env.NO_COLOR;
const forceColor = !!process.env.FORCE_COLOR;
export const useColor = forceColor || (isTTY && !noColor);

function wrap(open: number, close: number) {
  return (s: string): string => (useColor ? `\x1b[${open}m${s}\x1b[${close}m` : s);
}

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  underline: wrap(4, 24),

  black: wrap(30, 39),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  white: wrap(37, 39),
  gray: wrap(90, 39),

  bgRed: wrap(41, 49),
  bgGreen: wrap(42, 49),
  bgYellow: wrap(43, 49),
  bgBlue: wrap(44, 49),
};

/** Strip ANSI codes — useful for measuring printable width. */
export function strip(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

export function width(s: string): number {
  return strip(s).length;
}

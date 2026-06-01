/**
 * Tiny interactive prompts using node:readline. No deps.
 *
 *   const email = await ask('Email: ');
 *   const ok = await confirm('Proceed?', false);
 *   const choice = await pick('Pick one:', ['a', 'b', 'c']);
 *   const secret = await askSecret('Token: ');  // input not echoed
 */

import { createInterface, type Interface as RLInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { c } from './colors.js';

export async function ask(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const display = defaultValue
      ? `${question}${c.dim(` (${defaultValue})`)} `
      : `${question} `;
    return await new Promise<string>((resolve) => {
      rl.question(display, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * Ask without echoing — used for paste-an-API-key.
 * Implementation: temporarily disables stdout writes by monkey-patching
 * the readline interface output. Works on Node + Bun. Falls back to
 * visible input if stdin is not a TTY.
 */
export async function askSecret(question: string): Promise<string> {
  if (!input.isTTY) return ask(question);
  output.write(`${question} `);

  return new Promise<string>((resolve) => {
    const wasRaw = input.isRaw;
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf-8');

    let acc = '';
    const onData = (key: string) => {
      // Enter / Return
      if (key === '\r' || key === '\n') {
        finish();
        return;
      }
      // Ctrl-C → bail
      if (key === '') {
        finish();
        process.exit(130);
      }
      // Backspace
      if (key === '' || key === '\b') {
        if (acc.length > 0) {
          acc = acc.slice(0, -1);
          output.write('\b \b');
        }
        return;
      }
      acc += key;
      output.write('•');
    };

    function finish() {
      input.removeListener('data', onData);
      input.setRawMode(wasRaw);
      input.pause();
      output.write('\n');
      resolve(acc);
    }
    input.on('data', onData);
  });
}

export async function confirm(question: string, defaultYes = false): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = (await ask(`${question} ${c.dim(hint)}`)).toLowerCase();
  if (!answer) return defaultYes;
  return answer === 'y' || answer === 'yes';
}

export async function pick<T extends string>(question: string, options: T[]): Promise<T> {
  output.write(`${question}\n`);
  options.forEach((opt, i) => output.write(`  ${c.dim(`${i + 1}.`)} ${opt}\n`));
  while (true) {
    const raw = await ask(c.dim('Choice'));
    const idx = parseInt(raw, 10);
    if (Number.isFinite(idx) && idx >= 1 && idx <= options.length) {
      return options[idx - 1];
    }
    // Allow typing the label too
    const byLabel = options.find((o) => o.toLowerCase() === raw.toLowerCase());
    if (byLabel) return byLabel;
    output.write(c.yellow(`Pick a number 1–${options.length} or type the label.\n`));
  }
}

/** REPL-friendly: returns a long-lived interface the caller drives manually. */
export function createRepl(promptText: string): RLInterface {
  return createInterface({ input, output, prompt: promptText });
}

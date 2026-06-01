#!/usr/bin/env node
/**
 * Life Command — entrypoint shim.
 *
 * Runs the compiled CLI from dist/. Works under Node (npm install -g, npx),
 * Bun (bunx), and Deno (`deno install --allow-net --allow-read --allow-write --allow-env`).
 * Deno can also execute the TypeScript source directly via src/cli.ts — see README.
 */
import { main } from '../dist/cli.js';

main(process.argv.slice(2)).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('\x1b[31mfatal:\x1b[0m', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});

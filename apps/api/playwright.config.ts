import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // tests are inherently serial (signup → CRUD)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    extraHTTPHeaders: {},
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        // Works for both pnpm (`npm run dev`) and deno workspaces — the api package
        // exposes a `dev` task that resolves to `vite dev` either way. CI usually
        // wants to point at an already-running server via E2E_NO_SERVER=1 instead.
        command: process.env.E2E_DEV_CMD ?? 'npx vite dev --port 3000',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NODE_ENV: 'test',
        },
      },
});

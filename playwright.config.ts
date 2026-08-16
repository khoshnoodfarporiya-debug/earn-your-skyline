import { defineConfig, devices } from "@playwright/test";

/**
 * Browser regression coverage.
 *
 * Deliberately small: one browser, one viewport pair, and only the things that
 * cannot be asserted in `npm run check` — scroll position, focus movement,
 * layout shift, console output. Everything about the simulation is tested far
 * more cheaply in the Node suite and does not belong here.
 *
 * The dev server is reused if one is already up, so running this alongside a
 * preview does not fight for port 3500.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3500",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3500",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

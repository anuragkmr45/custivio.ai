import { defineConfig, devices } from "@playwright/test";

const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 5177);
const frontendBaseUrl = process.env.E2E_FRONTEND_BASE_URL ?? `http://127.0.0.1:${frontendPort}`;
const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3002";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
        url: frontendBaseUrl,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          VITE_API_BASE_URL: apiBaseUrl,
        },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

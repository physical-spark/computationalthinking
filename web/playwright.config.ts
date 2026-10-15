import { defineConfig } from "@playwright/test";
const webPort = process.env.CT_WEB_PORT || "5173";
const runnerPort = process.env.CT_RUNNER_PORT || "5174";
const apiPort = process.env.CT_API_PORT || "8001";
const webOrigin = `http://localhost:${webPort}`;
const database = process.env.CT_BROWSER_DATABASE || "sqlite:///.cache/e2e.db";
export default defineConfig({
  testDir: "tests",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: webOrigin,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command: `cd .. && mkdir -p .cache && uv run alembic upgrade head && uv run uvicorn backend.main:app --host 127.0.0.1 --port ${apiPort}`,
      env: {
        DATABASE_URL: database,
        COOKIE_SECURE: "false",
        SESSION_SECRET: "ci-browser-only-012345678901234567890",
        APP_ORIGIN: webOrigin,
      },
      url: `http://localhost:${apiPort}/healthz`,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev",
      env: { VITE_RUNNER_ORIGIN: `http://localhost:${runnerPort}` },
      url: webOrigin,
      reuseExistingServer: false,
    },
    {
      command: `cd ../runner && npx vite preview --host 127.0.0.1 --port ${runnerPort} --strictPort`,
      url: `http://localhost:${runnerPort}`,
      reuseExistingServer: false,
    },
  ],
});

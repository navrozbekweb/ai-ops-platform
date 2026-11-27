import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Haqiqiy AI yo'li uchun: soxta Anthropic serveri va unga ulangan ikkinchi ilova nusxasi.
const FAKE_AI_PORT = 3101;
const LIVE_PORT = 3102;
const SECRET = "e2e-test-secret-with-more-than-thirty-two-characters";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Ixtiyoriy: tayyor Chromium bo'lsa, shu yo'l ishlatiladi (CI/sandbox uchun).
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/uz/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { SESSION_SECRET: SECRET, MOCK_AUTH_ENABLED: "true" },
    },
    {
      command: "node e2e/fake-anthropic.mjs",
      url: `http://localhost:${FAKE_AI_PORT}/last`,
      reuseExistingServer: !process.env.CI,
      env: { FAKE_ANTHROPIC_PORT: String(FAKE_AI_PORT) },
    },
    {
      command: `npx next start -p ${LIVE_PORT}`,
      url: `http://localhost:${LIVE_PORT}/uz/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        SESSION_SECRET: SECRET,
        MOCK_AUTH_ENABLED: "true",
        ANTHROPIC_API_KEY: "test-key",
        ANTHROPIC_BASE_URL: `http://localhost:${FAKE_AI_PORT}`,
      },
    },
  ],
});

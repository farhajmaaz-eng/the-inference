import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// Use the distro browser in Termux/proot; never download an incompatible bundle.
const executablePath =
  process.env.CHROMIUM_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 30_000 },
  reporter: "list",
  use: {
    baseURL: process.env.NEWSROOM_BASE_URL || "http://localhost:3000",
    browserName: "chromium",
    launchOptions: {
      executablePath,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    },
    trace: "off",
  },
});

const { defineConfig } = require("@playwright/test");
const path = require("node:path");

process.env.NO_PROXY = [process.env.NO_PROXY, "127.0.0.1", "localhost"].filter(Boolean).join(",");
process.env.no_proxy = process.env.NO_PROXY;

const chromePath =
  process.env.CHROME_PATH ||
  path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chrome-win64/chrome-win64/chrome.exe"
  );

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:54321",
    browserName: "chromium",
    launchOptions: {
      executablePath: chromePath,
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: ".\\node_modules\\.bin\\vite.cmd --host 127.0.0.1 --port 54321",
    url: "http://127.0.0.1:54321",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});

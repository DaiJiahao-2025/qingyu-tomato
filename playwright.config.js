const { defineConfig } = require("@playwright/test");
const path = require("node:path");

const localLibs = path.join(__dirname, ".browsers/libs/usr/lib/x86_64-linux-gnu");
process.env.LD_LIBRARY_PATH = [localLibs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    launchOptions: {
      executablePath: path.join(__dirname, ".browsers/chrome-linux64/chrome"),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});

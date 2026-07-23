import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup-env.ts"],
    // 测试共享同一个 MySQL 测试库，串行执行避免相互干扰
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});

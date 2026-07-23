const path = require("path");
const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");

module.exports = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      // 后端 API（server/，默认 3000 端口）
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
  },
});

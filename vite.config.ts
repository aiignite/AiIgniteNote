import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3100,
    open: true,
    proxy: {
      "/api/anthropic": {
        target: "https://open.bigmodel.cn",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      "/api/coding": {
        target: "https://open.bigmodel.cn",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
});

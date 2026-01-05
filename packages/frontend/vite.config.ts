import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, statSync } from "fs";
import { resolve, extname } from "path";

// 自定义插件：提供 DrawIO 文件访问
function drawIOPlugin() {
  // 使用 public 文件夹中的 drawio，而不是 node_modules
  const drawioPath = resolve(__dirname, "public/drawio");

  return {
    name: "drawio-middleware",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // 处理 /drawio/ 请求
        if (req.url?.startsWith("/drawio/")) {
          let filePath = req.url.replace("/drawio/", "");
          // 移除查询参数
          if (filePath.includes("?")) {
            filePath = filePath.split("?")[0];
          }

          const fullPath = resolve(drawioPath, filePath);

          if (existsSync(fullPath) && statSync(fullPath).isFile()) {
            const ext = extname(filePath).slice(1);
            const content = readFileSync(fullPath);

            const contentTypes: Record<string, string> = {
              html: "text/html; charset=utf-8",
              htm: "text/html; charset=utf-8",
              js: "application/javascript; charset=utf-8",
              mjs: "application/javascript; charset=utf-8",
              css: "text/css; charset=utf-8",
              svg: "image/svg+xml",
              png: "image/png",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              gif: "image/gif",
              ico: "image/x-icon",
              json: "application/json",
              xml: "application/xml",
              woff: "font/woff",
              woff2: "font/woff2",
              ttf: "font/ttf",
              eot: "application/vnd.ms-fontobject",
            };

            res.setHeader(
              "Content-Type",
              contentTypes[ext] || "application/octet-stream",
            );
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "no-cache");
            res.end(content);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), drawIOPlugin()],
  server: {
    port: 3100,
    host: true,
    open: false, // 禁止自动打开浏览器
  },
  resolve: {
    alias: {
      "@": "/src",
      "@ainote/shared": "/packages/shared/src",
    },
  },
  optimizeDeps: {
    include: [
      // 预构建 Monaco 编辑器
      "monaco-editor",
      "@monaco-editor/react",
    ],
    exclude: ["@monaco-editor/react/lib"], // 排除一些不必要的预构建
  },
  assetsInclude: ["**/*.html"],
  // 启用 publicDir，这样 public/drawio 文件夹会被 Vite 自动处理
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Monaco Editor 单独打包
          "monaco-editor": ["monaco-editor"],
        },
      },
    },
  },
});

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
    // 生产构建优化
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 优化代码分割
        manualChunks: {
          // 将 Monaco Editor 单独打包
          "monaco-editor": ["monaco-editor"],
          // React相关库
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI组件库
          "ui-vendor": ["antd", "@ant-design/icons"],
          // 编辑器相关
          "editor-vendor": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extensions"],
          // 工具库
          "utils-vendor": ["lodash-es", "dayjs", "zustand"],
        },
        // 文件命名策略
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[ext]/[name]-[hash].${ext}`;
        },
      },
    },
    // Terser压缩选项
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});

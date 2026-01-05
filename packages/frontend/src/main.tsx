import React, { useEffect, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initializeDatabase } from "./db";
import { useSettingsStore } from "./store/settingsStore";
import { ThemeProvider, useTheme } from "./styles/theme";
import { GlobalStyle } from "./styles/global";
import { Spin } from "antd";
import "./main.css";

// 加载组件
function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}

// 应用初始化组件
function AppInit({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsStore();
  const { setTheme } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // 异步初始化数据库
    initializeDatabase()
      .then(() => {
        console.log("[AppInit] 数据库初始化完成");
        setDbReady(true);
      })
      .catch((error) => {
        console.error("[AppInit] 数据库初始化失败:", error);
        // 即使失败也继续,让用户可以进入应用
        setDbReady(true);
      });

    // 应用主题 - 根据settings设置
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  // 数据库还没准备好，显示加载状态
  if (!dbReady) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

// 渲染应用
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ConfigProvider locale={zhCN}>
          <AntdApp>
            <ThemeProvider theme="light">
              <GlobalStyle />
              <AppInit>
                <Suspense fallback={<PageLoader />}>
                  <App />
                </Suspense>
              </AppInit>
            </ThemeProvider>
          </AntdApp>
        </ConfigProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}

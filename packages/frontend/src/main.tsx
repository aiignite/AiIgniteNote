import React, { useEffect, Suspense } from "react";
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

  useEffect(() => {
    // 初始化数据库
    initializeDatabase().catch(console.error);

    // 应用主题 - 根据settings设置
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

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

import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import MainLayout from "./components/Layout/MainLayout";

// 懒加载页面组件
const NotePage = lazy(() => import("./pages/NotePage"));
const ModelManagementPage = lazy(() => import("./pages/ModelManagementPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const RecycleBinPage = lazy(() => import("./pages/RecycleBinPage"));

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

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 默认路由重定向到笔记页面 */}
        <Route path="/" element={<Navigate to="/notes" replace />} />

        {/* 主布局路由 */}
        <Route path="/notes" element={<MainLayout />}>
          <Route index element={<NotePage />} />
        </Route>

        {/* 模型管理页面 */}
        <Route path="/models" element={<MainLayout />}>
          <Route index element={<ModelManagementPage />} />
        </Route>

        {/* 设置页面 */}
        <Route path="/settings" element={<MainLayout />}>
          <Route index element={<SettingsPage />} />
        </Route>

        {/* 回收站页面 */}
        <Route path="/trash" element={<MainLayout />}>
          <Route index element={<RecycleBinPage />} />
        </Route>

        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

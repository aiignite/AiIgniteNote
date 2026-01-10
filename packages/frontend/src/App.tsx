import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import MainLayout from "./components/Layout/MainLayout";
import { useAuthStore } from "./store/authStore";
import { useThemeApply, useSystemThemeListener } from "./hooks/useTheme";
import LoginPage from "./pages/LoginPage";

// 懒加载页面组件
const NotePage = lazy(() => import("./pages/NotePage"));
const RecycleBinPage = lazy(() => import("./pages/RecycleBinPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ModelManagementPage = lazy(() => import("./pages/ModelManagementPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

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

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => (state as any)._hasHydrated);

  // 等待 zustand persist 恢复完成
  if (!_hasHydrated) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  // 应用主题设置
  useThemeApply();
  useSystemThemeListener();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 默认路由重定向 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/notes" replace />
            </ProtectedRoute>
          }
        />

        {/* 主布局路由 - 需要认证 */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NotePage />} />
          <Route path="favorites" element={<NotePage />} />
          <Route path="category/:categoryId" element={<NotePage />} />
          <Route path="tag/:tagId" element={<NotePage />} />
          <Route path=":noteId" element={<NotePage />} />
        </Route>

        {/* 设置页面 - 嵌入到主页内容区 */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SettingsPage />} />
        </Route>

        {/* 回收站页面 */}
        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RecycleBinPage />} />
        </Route>

        {/* 模型管理页面 */}
        <Route
          path="/models"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ModelManagementPage />} />
        </Route>

        {/* 帮助页面 */}
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HelpPage />} />
        </Route>

        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

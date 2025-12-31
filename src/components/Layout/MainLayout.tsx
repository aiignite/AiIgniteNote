import { useState, useEffect } from "react";
import { Layout, theme } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AIAssistantSidebar from "../AIAssistant/AIAssistantSidebar";
import { useNoteStore } from "../../store/noteStore";
import { useModelStore } from "../../store/modelStore";
import { initializeDatabase } from "../../db";
import { useGlobalKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import styled from "styled-components";

const { Content } = Layout;

const LayoutContainer = styled(Layout)`
  @media (max-width: 768px) {
    .ant-layout-sider {
      position: fixed !important;
      left: 0;
      top: 0;
      height: 100vh;
      z-index: 1000;
    }
  }
`;

const ContentLayout = styled(Layout)<{
  $aiWidth: number;
  $sidebarWidth: number;
}>`
  margin-left: ${(props) => props.$sidebarWidth}px;
  margin-right: ${(props) => props.$aiWidth}px;
  transition:
    margin-left 0.2s,
    margin-right 0.3s ease;
  height: 100vh;

  @media (max-width: 1200px) {
    margin-right: 0 !important;
  }

  @media (max-width: 768px) {
    margin-left: 0 !important;
  }
`;

function MainLayout() {
  const location = useLocation();
  const [aiAssistantVisible, setAiAssistantVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiAssistantWidth, setAiAssistantWidth] = useState(380);
  const { loadNotes, loadCategories } = useNoteStore();
  const { loadConfigs } = useModelStore();

  // 启用全局快捷键
  useGlobalKeyboardShortcuts();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 根据路由决定是否显示AI助手
  const showAIAssistant = ["/notes"].includes(location.pathname);

  // 移动端适配：小屏幕时不显示AI助手侧边栏
  const isSmallScreen = window.innerWidth < 1200;
  const isMobile = window.innerWidth < 768;

  const sidebarWidth = sidebarCollapsed ? 80 : 240;

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await loadNotes();
      await loadCategories();
      await loadConfigs(); // 加载模型配置
    };
    init();
  }, [loadNotes, loadCategories, loadConfigs]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && aiAssistantVisible) {
        setAiAssistantVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [aiAssistantVisible]);

  return (
    <LayoutContainer style={{ height: "100vh" }}>
      {/* 左侧边栏 */}
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

      {/* 中间内容区 */}
      <ContentLayout
        $aiWidth={
          showAIAssistant && aiAssistantVisible && !isSmallScreen
            ? aiAssistantWidth
            : 0
        }
        $sidebarWidth={sidebarWidth}
      >
        <Header
          toggleAIAssistant={() => setAiAssistantVisible(!aiAssistantVisible)}
          aiAssistantVisible={showAIAssistant && aiAssistantVisible}
        />
        <Content
          style={{
            margin: 0,
            padding: isMobile ? 0 : 0,
            background: colorBgContainer,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </Content>
      </ContentLayout>

      {/* 右侧AI助手 */}
      {showAIAssistant && (
        <AIAssistantSidebar
          visible={aiAssistantVisible && !isSmallScreen}
          onClose={() => setAiAssistantVisible(false)}
          onWidthChange={(width) => setAiAssistantWidth(width)}
        />
      )}
    </LayoutContainer>
  );
}

export default MainLayout;

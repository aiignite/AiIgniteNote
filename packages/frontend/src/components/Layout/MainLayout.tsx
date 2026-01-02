import { useState, useEffect } from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AIAssistantSidebar from "../AIAssistant/AIAssistantSidebar";
import { useNoteStore } from "../../store/noteStore";
import { useModelStore } from "../../store/modelStore";
import { initializeDatabase } from "../../db";
import { useGlobalKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import styled, { keyframes } from "styled-components";
import { COLORS, NOISE_TEXTURE, TRANSITION } from "../../styles/design-tokens";

// ============================================
// 动画
// ============================================
const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ============================================
// Styled Components
// ============================================

const LayoutContainer = styled(Layout)`
  min-height: 100vh;
  background: ${COLORS.background};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: ${NOISE_TEXTURE};
    pointer-events: none;
    z-index: 1;
  }
`;

const MainGrid = styled.div<{
  $sidebarWidth: number;
  $aiWidth: number;
  $sidebarCollapsed: boolean;
  $aiVisible: boolean;
}>`
  display: grid;
  grid-template-columns: ${(props) =>
      props.$sidebarCollapsed ? "64px" : `${props.$sidebarWidth}px`} 1fr ${(
      props,
    ) => (props.$aiVisible ? `${props.$aiWidth}px` : "0px")};
  height: 100vh;
  transition: grid-template-columns ${TRANSITION.normal};
  position: relative;
  z-index: 2;

  @media (max-width: 1200px) {
    grid-template-columns: ${(props) =>
        props.$sidebarCollapsed ? "64px" : `${props.$sidebarWidth}px`} 1fr 0px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 0px 1fr 0px;
  }
`;

const SidebarWrapper = styled.div<{ $collapsed: boolean }>`
  background: ${COLORS.paperDark};
  border-right: 1px solid ${COLORS.subtle};
  height: 100vh;
  overflow: hidden;
  animation: ${slideInLeft} 0.4s ease-out;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    width: ${(props) => (props.$collapsed ? "64px" : "240px")} !important;
    z-index: 1000;
    box-shadow: 4px 0 24px rgba(26, 24, 20, 0.15);
  }
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: ${COLORS.background};
  animation: ${fadeIn} 0.5s ease-out;
`;

const HeaderWrapper = styled.div`
  flex-shrink: 0;
  border-bottom: 1px solid ${COLORS.subtle};
  background: ${COLORS.paper};
  backdrop-filter: blur(8px);
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 3px;

    &:hover {
      background: ${COLORS.inkMuted};
    }
  }
`;

const AIWrapper = styled.div<{ $visible: boolean }>`
  height: 100vh;
  overflow: hidden;
  border-left: 1px solid ${COLORS.subtle};
  background: ${COLORS.paper};
  animation: ${slideInRight} 0.4s ease-out;

  @media (max-width: 1200px) {
    display: none;
  }
`;

// ============================================
// Main Component
// ============================================

function MainLayout() {
  const location = useLocation();
  const [aiAssistantVisible, setAiAssistantVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiAssistantWidth, setAiAssistantWidth] = useState(380);
  const { loadNotes, loadCategories } = useNoteStore();
  const { loadConfigs } = useModelStore();

  // 启用全局快捷键
  useGlobalKeyboardShortcuts();

  const sidebarWidth = 240;

  // 根据路由决定是否显示AI助手（在笔记页面、设置页面、回收站页面都显示）
  const showAIAssistant = ["/notes", "/settings", "/trash"].some((path) =>
    location.pathname.startsWith(path),
  );

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await loadNotes();
      await loadCategories();
      await loadConfigs();
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

  const isSmallScreen = window.innerWidth < 1200;

  return (
    <LayoutContainer>
      <MainGrid
        $sidebarWidth={sidebarWidth}
        $aiWidth={aiAssistantWidth}
        $sidebarCollapsed={sidebarCollapsed}
        $aiVisible={showAIAssistant && aiAssistantVisible && !isSmallScreen}
      >
        {/* 左侧边栏 */}
        <SidebarWrapper $collapsed={sidebarCollapsed}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
          />
        </SidebarWrapper>

        {/* 中间内容区 */}
        <ContentArea>
          <HeaderWrapper>
            <Header
              toggleAIAssistant={() =>
                setAiAssistantVisible(!aiAssistantVisible)
              }
              aiAssistantVisible={showAIAssistant && aiAssistantVisible}
            />
          </HeaderWrapper>
          <ContentWrapper>
            <Outlet />
          </ContentWrapper>
        </ContentArea>

        {/* 右侧AI助手 */}
        {showAIAssistant && (
          <AIWrapper
            $visible={aiAssistantVisible && !isSmallScreen}
            style={{
              width:
                aiAssistantVisible && !isSmallScreen
                  ? `${aiAssistantWidth}px`
                  : "0px",
            }}
          >
            <AIAssistantSidebar
              visible={aiAssistantVisible && !isSmallScreen}
              onClose={() => setAiAssistantVisible(false)}
              onWidthChange={(width) => setAiAssistantWidth(width)}
            />
          </AIWrapper>
        )}
      </MainGrid>
    </LayoutContainer>
  );
}

export default MainLayout;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Layout, Button, Drawer } from "antd";
import { CloseOutlined, RobotOutlined } from "@ant-design/icons";
import ChatInterface from "./ChatInterface";
import QuickActions from "./QuickActions";
import { useAIStore } from "../../store/aiStore";
import styled from "styled-components";

const { Sider } = Layout;

const SidebarContainer = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  transition: background 0.3s ease;
  position: relative;
`;

const ResizeHandle = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: background 0.2s;

  &:hover {
    background: #1890ff;
  }

  &:active {
    background: #1890ff;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  user-select: none;
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;

const SidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

export interface AIAssistantRef {
  getWidth: () => number;
}

interface AIAssistantSidebarProps {
  visible: boolean;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
}

function AIAssistantSidebar(
  { visible, onClose, onWidthChange }: AIAssistantSidebarProps,
  ref: React.ForwardedRef<AIAssistantRef>,
) {
  const { currentConversation, createConversation, loadConversations } =
    useAIStore();
  const [showQuickActions] = useState(true);
  const [width, setWidth] = useState(380);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 暴露 ref 方法
  useImperativeHandle(
    ref,
    () => ({
      getWidth: () => width,
    }),
    [width],
  );

  useEffect(() => {
    if (visible) {
      loadConversations();
    }
  }, [visible, loadConversations]);

  // 如果没有当前对话，创建一个新对话
  useEffect(() => {
    if (visible && !currentConversation) {
      createConversation();
    }
  }, [visible, currentConversation, createConversation]);

  // 处理拖动调整大小
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const handleMouseMove = (e: MouseEvent) => {
        if (sidebarRef.current) {
          const newWidth = window.innerWidth - e.clientX;

          if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
            setWidth(newWidth);
            // 通知父组件宽度变化
            onWidthChange?.(newWidth);
          }
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onWidthChange],
  );

  // 小屏幕使用抽屉
  const isSmallScreen = window.innerWidth < 1200;

  // 如果不可见且是大屏幕，不渲染任何内容
  if (!visible && !isSmallScreen) {
    return null;
  }

  if (isSmallScreen) {
    return (
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RobotOutlined style={{ color: "#1890ff" }} />
            <span>AI助手</span>
          </div>
        }
        placement="right"
        width={320}
        open={visible}
        onClose={onClose}
        styles={{
          body: { padding: 0 },
        }}
      >
        <SidebarContent>
          {showQuickActions && <QuickActions />}
          <ChatInterface />
        </SidebarContent>
      </Drawer>
    );
  }

  // 大屏幕使用侧边栏
  return (
    <Sider
      width={width}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        color: "var(--text-tertiary)",
        zIndex: 1000,
      }}
    >
      <SidebarContainer ref={sidebarRef} $width={width}>
        {/* 拖动调整大小的手柄 */}
        <ResizeHandle onMouseDown={handleMouseDown} />

        {/* 头部 */}
        <SidebarHeader>
          <SidebarTitle>
            <RobotOutlined style={{ color: "#1890ff", fontSize: 18 }} />
            <span>AI助手</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                fontWeight: "normal",
              }}
            >
              ({width}px)
            </span>
          </SidebarTitle>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </SidebarHeader>

        {/* 内容 */}
        <SidebarContent>
          {showQuickActions && <QuickActions />}
          <ChatInterface />
        </SidebarContent>
      </SidebarContainer>
    </Sider>
  );
}

export default forwardRef(AIAssistantSidebar);

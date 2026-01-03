import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button, Drawer } from "antd";
import { CloseOutlined, ThunderboltOutlined } from "@ant-design/icons";
import ChatInterface from "./ChatInterface";
import { useAIStore } from "../../store/aiStore";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
} from "../../styles/design-tokens";

// ============================================
// 动画
// ============================================
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

// ============================================
// Styled Components
// ============================================

const SidebarContainer = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.paper};
  border-left: 1px solid ${COLORS.subtle};
  position: relative;
  animation: ${slideInRight} 0.3s ease-out;
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
  transition: background ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.accent};
  }

  &:active {
    background: ${COLORS.accent};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} ${SPACING.lg};
  border-bottom: 1px solid ${COLORS.subtle};
  user-select: none;
  background: ${COLORS.paper};
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

const SidebarIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.ink};
  color: ${COLORS.paper};
  border-radius: ${BORDER.radius.md};
  font-size: ${TYPOGRAPHY.fontSize.md};
`;

const SidebarName = styled.span`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
`;

const CloseButton = styled(Button)`
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: ${BORDER.radius.sm};
  border: none;
  background: transparent;
  color: ${COLORS.inkMuted};
  transition: all ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.subtleLight};
    color: ${COLORS.ink};
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

// ============================================
// Types & Ref
// ============================================

export interface AIAssistantRef {
  getWidth: () => number;
}

interface AIAssistantSidebarProps {
  visible: boolean;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  noteId?: string;
}

// ============================================
// Main Component
// ============================================

function AIAssistantSidebar(
  { visible, onClose, onWidthChange, noteId }: AIAssistantSidebarProps,
  ref: React.ForwardedRef<AIAssistantRef>,
) {
  const { currentConversation, createConversation, loadConversations } =
    useAIStore();
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
          <div
            style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}
          >
            <SidebarIcon
              style={{
                width: 28,
                height: 28,
                fontSize: TYPOGRAPHY.fontSize.sm,
              }}
            >
              <ThunderboltOutlined />
            </SidebarIcon>
            <SidebarName>AI 助手</SidebarName>
          </div>
        }
        placement="right"
        width={320}
        open={visible}
        onClose={onClose}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: `1px solid ${COLORS.subtle}` },
        }}
      >
        <SidebarContent>
          <ChatInterface noteId={noteId} />
        </SidebarContent>
      </Drawer>
    );
  }

  // 大屏幕使用侧边栏
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        display: "flex",
        zIndex: 1000,
      }}
    >
      <SidebarContainer ref={sidebarRef} $width={width}>
        {/* 拖动调整大小的手柄 */}
        <ResizeHandle onMouseDown={handleMouseDown} />

        {/* 头部 */}
        <SidebarHeader>
          <SidebarTitle>
            <SidebarIcon>
              <ThunderboltOutlined />
            </SidebarIcon>
            <SidebarName>AI 助手</SidebarName>
            <span
              style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.inkMuted,
                fontWeight: TYPOGRAPHY.fontWeight.normal,
                fontFamily: TYPOGRAPHY.fontFamily.mono,
              }}
            >
              {width}px
            </span>
          </SidebarTitle>
          <CloseButton icon={<CloseOutlined />} onClick={onClose} />
        </SidebarHeader>

        {/* 内容 */}
        <SidebarContent>
          <ChatInterface noteId={noteId} />
        </SidebarContent>
      </SidebarContainer>
    </div>
  );
}

export default forwardRef(AIAssistantSidebar);

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import NoteList from "../components/Note/NoteList";
import NoteEditor from "../components/Note/NoteEditor";
import WelcomePage from "./WelcomePage";
import styled from "styled-components";
import { useFullscreenStore } from "../store/fullscreenStore";
import { COLORS } from "../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const PageContainer = styled.div<{ $fullscreen?: boolean }>`
  height: 100%;
  display: flex;
  width: 100%;
  position: relative;

  ${(props) =>
    props.$fullscreen &&
    `
    position: fixed;
    inset: 0;
    z-index: 9998;
    `}

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ListPanel = styled.div<{ $width: number; $hidden?: boolean }>`
  height: 100%;
  width: ${(props) => props.$width}px;
  min-width: 200px;
  max-width: 600px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;

  ${(props) =>
    props.$hidden &&
    `
    display: none;
  `}

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

const Resizer = styled.div<{ $isResizing: boolean }>`
  position: absolute;
  right: -6px;
  top: 0;
  bottom: 0;
  width: 16px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: background 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    right: 6px;
    top: 0;
    bottom: 0;
    width: 4px;
    background: transparent;
    border-right: 1px solid ${COLORS.subtle};
    transition: all 0.2s ease;
  }

  &:hover::before {
    background: #C85A3A;
    border-right-color: #C85A3A;
  }

  &:active::before {
    background: #C85A3A;
    border-right-color: #C85A3A;
  }

  ${(props) =>
    props.$isResizing &&
    `
    &::before {
      background: #C85A3A;
      border-right-color: #C85A3A;
    }
  `}

  @media (max-width: 768px) {
    display: none;
  }
`;

const EditorPanel = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  min-width: 0;
`;

function NotePage() {
  const { noteId, categoryId, tagId } = useParams<{
    noteId?: string;
    categoryId?: string;
    tagId?: string;
  }>();
  const { isFullscreen } = useFullscreenStore();
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(
    noteId,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showList, setShowList] = useState(true);

  // 列表宽度状态
  const DEFAULT_LIST_WIDTH = 320; // 默认宽度
  const MIN_LIST_WIDTH = 200; // 最小宽度
  const MAX_LIST_WIDTH = 600; // 最大宽度

  const [listWidth, setListWidth] = useState(() => {
    // 从 localStorage 读取保存的宽度
    const saved = localStorage.getItem('ainote-list-width');
    return saved ? parseInt(saved, 10) : DEFAULT_LIST_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (noteId) {
      setSelectedNoteId(noteId);
      // 移动端选择笔记后隐藏列表
      if (isMobile) {
        setShowList(false);
      }
    }
  }, [noteId, isMobile]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowList(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 拖动开始
  const handleMouseDown = (e: React.MouseEvent) => {
    // 立即设置拖动状态
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = listWidth;

    // 禁用编辑器面板的指针事件，特别是 iframe
    const editorPanel = document.querySelector('[data-editor-panel="true"]');
    if (editorPanel) {
      editorPanel.setAttribute('style', 'pointer-events: none;');
    }

    // 禁用所有 iframe 的指针事件
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.setAttribute('style', 'pointer-events: none;');
    })

    // 防止选中文本
    e.preventDefault();
    e.stopPropagation();
  };

  // 拖动中 - 使用 useCallback 确保引用稳定
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;

    // 限制宽度范围
    const clampedWidth = Math.max(
      MIN_LIST_WIDTH,
      Math.min(MAX_LIST_WIDTH, newWidth)
    );

    setListWidth(clampedWidth);
  }, [isResizing]);

  // 拖动结束 - 使用 useCallback 确保引用稳定
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;

    // 恢复编辑器面板的指针事件
    const editorPanel = document.querySelector('[data-editor-panel="true"]');
    if (editorPanel) {
      editorPanel.removeAttribute('style');
    }

    // 恢复所有 iframe 的指针事件
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.removeAttribute('style');
    });

    // 保存宽度到 localStorage
    localStorage.setItem('ainote-list-width', listWidth.toString());

    // 最后清除拖动状态
    setIsResizing(false);
  }, [isResizing, listWidth]);

  // 添加全局事件监听器
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 移动端：如果有选中的笔记，显示编辑器，否则显示列表
  if (isMobile) {
    return (
      <PageContainer>
        {showList || !selectedNoteId ? (
          <div style={{ width: "100%", height: "100%" }}>
            <NoteList
              selectedNoteId={selectedNoteId}
              onSelectNote={(id) => {
                setSelectedNoteId(id);
                setShowList(false);
              }}
              onBack={() => setShowList(true)}
            />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%" }}>
            {selectedNoteId ? (
              <NoteEditor noteId={selectedNoteId} />
            ) : (
              <WelcomePage />
            )}
          </div>
        )}
      </PageContainer>
    );
  }

  // 桌面端：可拖动调整宽度的布局
  return (
    <PageContainer $fullscreen={isFullscreen}>
      {/* 笔记列表 - 全屏时隐藏 */}
      {!isFullscreen && (
        <ListPanel $width={listWidth}>
          <NoteList
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            filterCategoryId={categoryId}
            filterTagId={tagId}
          />
          {/* 可拖动分隔条 */}
          <Resizer
            ref={resizerRef}
            $isResizing={isResizing}
            onMouseDown={handleMouseDown}
          />
        </ListPanel>
      )}

      {/* 笔记编辑器或欢迎页面 */}
      <EditorPanel data-editor-panel="true">
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} />
        ) : (
          <WelcomePage />
        )}
      </EditorPanel>
    </PageContainer>
  );
}

export default NotePage;

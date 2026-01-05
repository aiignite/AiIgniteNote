import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import NoteList from "../components/Note/NoteList";
import NoteEditor from "../components/Note/NoteEditor";
import styled from "styled-components";
import { useFullscreenStore } from "../store/fullscreenStore";

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
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;

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
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  transition: background ${props => props.$isResizing ? '0s' : '0.15s'};

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  ${(props) =>
    props.$isResizing &&
    `
    background: rgba(200, 90, 58, 0.3);
    `}

  /* 添加拖动手柄视觉提示 */
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 40px;
    background: ${props => props.$isResizing ? 'rgba(200, 90, 58, 0.5)' : 'transparent'};
    border-radius: 1px;
    transition: background 0.15s;
  }

  &:hover::after {
    background: rgba(0, 0, 0, 0.2);
  }

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
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = listWidth;

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 防止选中文本
    e.preventDefault();
  };

  // 拖动中
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;

    // 限制宽度范围
    const clampedWidth = Math.max(
      MIN_LIST_WIDTH,
      Math.min(MAX_LIST_WIDTH, newWidth)
    );

    setListWidth(clampedWidth);
  };

  // 拖动结束
  const handleMouseUp = () => {
    if (!isResizing) return;

    setIsResizing(false);

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // 保存宽度到 localStorage
    localStorage.setItem('ainote-list-width', listWidth.toString());
  };

  // 清理函数（组件卸载时移除事件监听）
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
            <NoteEditor noteId={selectedNoteId} />
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
        <>
          <ListPanel $width={listWidth}>
            <NoteList
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              filterCategoryId={categoryId}
              filterTagId={tagId}
            />
          </ListPanel>

          {/* 可拖动分隔条 */}
          <Resizer
            ref={resizerRef}
            $isResizing={isResizing}
            onMouseDown={handleMouseDown}
          />
        </>
      )}

      {/* 笔记编辑器 */}
      <EditorPanel>
        <NoteEditor noteId={selectedNoteId} />
      </EditorPanel>
    </PageContainer>
  );
}

export default NotePage;

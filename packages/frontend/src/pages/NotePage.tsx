import { useState, useEffect } from "react";
import { Row, Col } from "antd";
import { useParams } from "react-router-dom";
import NoteList from "../components/Note/NoteList";
import NoteEditor from "../components/Note/NoteEditor";
import styled from "styled-components";
import { useFullscreenStore } from "../store/fullscreenStore";

const PageContainer = styled.div<{ $fullscreen?: boolean }>`
  height: 100%;
  display: flex;
  width: 100%;

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

const StyledRow = styled(Row)`
  width: 100% !important;
  height: 100% !important;

  .ant-col {
    @media (max-width: 768px) {
      width: 100% !important;
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }
  }
`;

interface ListColProps {
  $mobileHidden?: boolean;
}

const ListCol = styled(Col)<ListColProps>`
  @media (max-width: 768px) {
    display: ${(props) => (props.$mobileHidden ? "none" : "block")};
  }
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

  return (
    <PageContainer $fullscreen={isFullscreen}>
      <StyledRow gutter={0}>
        {/* 笔记列表 - 全屏时隐藏 */}
        {!isFullscreen && (
          <ListCol
            span={6}
            $mobileHidden={!showList && isMobile}
            style={{
              height: "100%",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            <NoteList
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              filterCategoryId={categoryId}
              filterTagId={tagId}
            />
          </ListCol>
        )}

        {/* 笔记编辑器 */}
        <Col
          span={isFullscreen ? 24 : 18}
          style={{
            height: "100%",
            overflow: "hidden",
          }}
        >
          <NoteEditor noteId={selectedNoteId} />
        </Col>
      </StyledRow>
    </PageContainer>
  );
}

export default NotePage;

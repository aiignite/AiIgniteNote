import React, { useEffect, useState } from "react";
import { Tag, Input, Button, Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import {
  StarOutlined,
  StarFilled,
  SearchOutlined,
  TagOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  MoreOutlined,
  EditOutlined,
  FolderOutlined,
  DeleteOutlined,
  ExportOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNoteStore } from "../../store/noteStore";
import { LocalNote as Note, NoteFileType } from "../../types";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import styled, { css } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
} from "../../styles/design-tokens";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

// ============================================
// Styled Components
// ============================================

const ListContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.paper};
`;

const SearchSection = styled.div`
  padding: ${SPACING.lg};
  border-bottom: 1px solid ${COLORS.subtle};
  background: ${COLORS.paper};
`;

const SearchInput = styled(Input)`
  border-radius: ${BORDER.radius.md};
  border: 1px solid ${COLORS.subtle};
  height: 36px;
  font-size: ${TYPOGRAPHY.fontSize.sm};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  .ant-input {
    background: transparent;
    border: none;
  }

  .ant-input-prefix {
    color: ${COLORS.inkMuted};
    margin-right: ${SPACING.sm};
  }
`;

const ListContent = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 2px;

    &:hover {
      background: ${COLORS.inkMuted};
    }
  }
`;

const NoteItemContainer = styled.div<{ $selected: boolean }>`
  transition: all ${TRANSITION.fast};
  border-bottom: 1px solid ${COLORS.subtle};

  &:last-child {
    border-bottom: none;
  }

  ${(props) =>
    props.$selected &&
    css`
      background: ${COLORS.ink}05;
      border-left: 3px solid ${COLORS.accent};
    `}

  &:hover {
    background: ${COLORS.subtleLight};
  }
`;

const NoteItem = styled.div`
  padding: ${SPACING.md} ${SPACING.lg};
  cursor: pointer;
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.xs};
`;

const FileTypeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  font-size: ${TYPOGRAPHY.fontSize.sm};
`;

const NoteTitle = styled.div<{ $selected: boolean }>`
  flex: 1;
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${(props) => (props.$selected ? COLORS.accent : COLORS.ink)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoteActions = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  opacity: 0;
  transition: opacity ${TRANSITION.fast};

  ${NoteItemContainer}:hover & {
    opacity: 1;
  }
`;

const ActionIconButton = styled(Button)`
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

  &.starred {
    color: ${COLORS.accent};

    &:hover {
      background: ${COLORS.accent}15;
      color: ${COLORS.accent};
    }
  }
`;

const NotePreview = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkLight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: ${SPACING.xs};
  padding-left: 28px;
`;

const NoteMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding-left: 28px;
`;

const MetaTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
`;

const StyledTag = styled(Tag)`
  margin: 0;
  padding: 1px 6px;
  border-radius: ${BORDER.radius.full};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  border: 1px solid ${COLORS.subtle};
  background: ${COLORS.subtleLight};
  color: ${COLORS.inkLight};
`;

const TimeStamp = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.subtle};
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${TYPOGRAPHY.fontFamily.mono};
`;

const EmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.md};
  padding: ${SPACING.xl};
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.paperDark};
  border-radius: ${BORDER.radius.xl};
  font-size: 32px;
  color: ${COLORS.subtle};
`;

const EmptyText = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkMuted};
  margin: 0;
`;

// ============================================
// Helpers
// ============================================

// 获取文件类型对应的图标
const getFileTypeIcon = (fileType: NoteFileType) => {
  const iconStyle = { fontSize: "14px" };
  switch (fileType) {
    case NoteFileType.MARKDOWN:
      return (
        <FileMarkdownOutlined style={{ ...iconStyle, color: COLORS.accent }} />
      );
    case NoteFileType.RICH_TEXT:
      return (
        <FileTextOutlined style={{ ...iconStyle, color: COLORS.success }} />
      );
    case NoteFileType.DRAWIO:
      return (
        <ApartmentOutlined style={{ ...iconStyle, color: COLORS.warning }} />
      );
    case NoteFileType.MINDMAP:
      return <NodeIndexOutlined style={{ ...iconStyle, color: "#eb2f96" }} />;
    default:
      return <FileTextOutlined style={iconStyle} />;
  }
};

// ============================================
// Main Component
// ============================================

interface NoteListProps {
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onBack?: () => void;
  filterCategoryId?: string;
  filterTagId?: string;
}

function NoteList({
  selectedNoteId,
  onSelectNote,
  onBack,
  filterCategoryId,
  filterTagId,
}: NoteListProps) {
  const {
    notes,
    setCurrentNote,
    toggleFavorite,
    getNotesByCategory,
    getFavoriteNotes,
    updateNote,
    deleteNote,
    categories,
  } = useNoteStore();
  const { getNotesByTagId } = useNoteStore(); // 从 store 中获取按标签查询的方法
  const [searchValue, setSearchValue] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { categoryId } = useParams();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [currentNote, setCurrentNoteData] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");

  // 判断当前路由类型
  const isFavoritesRoute = location.pathname === "/notes/favorites";
  const isCategoryRoute = location.pathname.startsWith("/notes/category/");
  const isTagRoute = location.pathname.startsWith("/notes/tag/");

  // 加载笔记数据
  useEffect(() => {
    let isMounted = true;

    const loadNotesData = async () => {
      setLoading(true);
      try {
        let displayNotes: Note[] = [];

        // 优先级：收藏 > 分类 > 标签 > 所有笔记
        if (isFavoritesRoute) {
          // 收藏：优先级最高
          displayNotes = await getFavoriteNotes();
        } else if (
          (isCategoryRoute || filterCategoryId) &&
          (categoryId || filterCategoryId)
        ) {
          // 分类筛选
          displayNotes = await getNotesByCategory(
            categoryId || filterCategoryId!,
          );
        } else if ((isTagRoute || filterTagId) && filterTagId) {
          // 标签筛选
          displayNotes = await getNotesByTagId(filterTagId);
        } else {
          // 所有笔记（默认）
          displayNotes = notes.filter((note) => !note.isDeleted);
        }

        // 搜索过滤
        if (searchValue) {
          displayNotes = displayNotes.filter(
            (note) =>
              note.title.toLowerCase().includes(searchValue.toLowerCase()) ||
              note.content.toLowerCase().includes(searchValue.toLowerCase()),
          );
        }

        // 只在组件还挂载时才更新状态
        if (isMounted) {
          setFilteredNotes(displayNotes);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
        if (isMounted) {
          setFilteredNotes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotesData();

    // 清理函数，防止组件卸载后更新状态
    return () => {
      isMounted = false;
    };
  }, [
    searchValue,
    notes,
    isFavoritesRoute,
    isCategoryRoute,
    isTagRoute,
    categoryId,
    filterCategoryId,
    filterTagId,
    getFavoriteNotes,
    getNotesByCategory,
    getNotesByTagId,
  ]);

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    onSelectNote(note.id);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await toggleFavorite(noteId);
  };

  const handleRename = (note: Note) => {
    setCurrentNoteData(note);
    setNewTitle(note.title);
    setRenameModalVisible(true);
  };

  const confirmRename = async () => {
    if (currentNote && newTitle.trim()) {
      try {
        await updateNote(currentNote.id, { title: newTitle.trim() });
        message.success("重命名成功");
        setRenameModalVisible(false);
      } catch (error) {
        message.error("重命名失败");
      }
    }
  };

  const handleMoveToCategory = (note: Note) => {
    setCurrentNoteData(note);
    setTargetCategoryId(note.category);
    setMoveModalVisible(true);
  };

  const confirmMove = async () => {
    if (currentNote && targetCategoryId) {
      try {
        await updateNote(currentNote.id, { category: targetCategoryId });
        message.success("移动成功");
        setMoveModalVisible(false);
      } catch (error) {
        message.error("移动失败");
      }
    }
  };

  const handleDelete = async (note: Note) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除笔记"${note.title}"吗？删除后可以在回收站中恢复。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteNote(note.id);
          message.success("已移至回收站");
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleExport = async (note: Note) => {
    try {
      let content = "";
      let fileName = `${note.title}.md`;
      let mimeType = "text/markdown";

      if (note.fileType === NoteFileType.MARKDOWN) {
        content = `# ${note.title}\n\n${note.content}`;
        fileName = `${note.title}.md`;
        mimeType = "text/markdown";
      } else if (note.fileType === NoteFileType.RICH_TEXT) {
        content = note.htmlContent || note.content;
        fileName = `${note.title}.html`;
        mimeType = "text/html";
      } else {
        content = `# ${note.title}\n\n${note.content}`;
        fileName = `${note.title}.md`;
        mimeType = "text/markdown";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("导出成功");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("导出失败");
    }
  };

  const getActionMenuItems = (note: Note): MenuProps["items"] => [
    {
      key: "rename",
      label: "重命名",
      icon: <EditOutlined />,
      onClick: () => handleRename(note),
    },
    {
      key: "move",
      label: "移动到",
      icon: <FolderOutlined />,
      onClick: () => handleMoveToCategory(note),
    },
    {
      key: "export",
      label: "导出",
      icon: <ExportOutlined />,
      onClick: () => handleExport(note),
    },
    { type: "divider" },
    {
      key: "delete",
      label: "删除",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(note),
    },
  ];

  return (
    <ListContainer>
      {/* 搜索栏 */}
      <SearchSection>
        {onBack && (
          <Button
            type="text"
            onClick={onBack}
            style={{ marginBottom: SPACING.sm, paddingLeft: 0 }}
          >
            ← 返回
          </Button>
        )}
        <SearchInput
          placeholder="搜索笔记..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
        />
      </SearchSection>

      {/* 笔记列表 */}
      <ListContent>
        {loading ? (
          <EmptyContainer>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyText>加载中...</EmptyText>
          </EmptyContainer>
        ) : filteredNotes.length === 0 ? (
          <EmptyContainer>
            <EmptyIcon>📝</EmptyIcon>
            <EmptyText>
              {searchValue
                ? "没有找到匹配的笔记"
                : isFavoritesRoute
                  ? "还没有收藏的笔记"
                  : isCategoryRoute
                    ? "该分类下还没有笔记"
                    : "还没有笔记，点击左侧按钮创建"}
            </EmptyText>
          </EmptyContainer>
        ) : (
          filteredNotes.map((note) => (
            <NoteItemContainer
              key={note.id}
              $selected={selectedNoteId === note.id}
            >
              <NoteItem
                onClick={() => handleSelectNote(note)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("noteId", note.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <NoteHeader>
                  <FileTypeIcon>{getFileTypeIcon(note.fileType)}</FileTypeIcon>
                  <NoteTitle $selected={selectedNoteId === note.id}>
                    {note.title || "无标题"}
                  </NoteTitle>
                  <NoteActions>
                    <ActionIconButton
                      className={note.isFavorite ? "starred" : ""}
                      icon={note.isFavorite ? <StarFilled /> : <StarOutlined />}
                      onClick={(e) => handleToggleFavorite(e, note.id)}
                    />
                    <Dropdown
                      menu={{ items: getActionMenuItems(note) }}
                      trigger={["click"]}
                    >
                      <ActionIconButton
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </NoteActions>
                </NoteHeader>

                <NotePreview>{note.content || "无内容"}</NotePreview>

                <NoteMeta>
                  {note.tags.length > 0 && (
                    <>
                      <MetaTag>
                        <TagOutlined style={{ fontSize: "11px" }} />
                      </MetaTag>
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <StyledTag key={index}>{tag}</StyledTag>
                      ))}
                      {note.tags.length > 2 && (
                        <StyledTag>+{note.tags.length - 2}</StyledTag>
                      )}
                    </>
                  )}
                  <TimeStamp>
                    <ClockCircleOutlined style={{ fontSize: "11px" }} />
                    {dayjs(note.updatedAt).fromNow()}
                  </TimeStamp>
                </NoteMeta>
              </NoteItem>
            </NoteItemContainer>
          ))
        )}
      </ListContent>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名笔记"
        open={renameModalVisible}
        onOk={confirmRename}
        onCancel={() => setRenameModalVisible(false)}
        okText="确定"
        cancelText="取消"
        okButtonProps={{
          style: { background: COLORS.ink, borderColor: COLORS.ink },
        }}
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="请输入新标题"
          autoFocus
          onPressEnter={confirmRename}
        />
      </Modal>

      {/* 移动到分类弹窗 */}
      <Modal
        title="移动到分类"
        open={moveModalVisible}
        onOk={confirmMove}
        onCancel={() => setMoveModalVisible(false)}
        okText="确定"
        cancelText="取消"
        okButtonProps={{
          style: { background: COLORS.ink, borderColor: COLORS.ink },
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: TYPOGRAPHY.fontSize.sm,
            }}
          >
            选择目标分类：
          </label>
          <select
            value={targetCategoryId}
            onChange={(e) => setTargetCategoryId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: BORDER.radius.sm,
              border: `1px solid ${COLORS.subtle}`,
              fontSize: TYPOGRAPHY.fontSize.sm,
              background: COLORS.paper,
            }}
          >
            <option value="">默认分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </ListContainer>
  );
}

export default NoteList;

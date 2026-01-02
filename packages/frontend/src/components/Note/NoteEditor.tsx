import { useEffect, useState, useCallback } from "react";
import {
  Button,
  App,
  Tag,
  Tooltip,
  Modal,
  Input as AntInput,
  Space,
  Dropdown,
  Select,
  Empty,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  TagsOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ColumnWidthOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNoteStore } from "../../store/noteStore";
import { useTagStore } from "../../store/tagStore";
import { useAutoSave } from "../../hooks/useAutoSave";
import { db } from "../../db";
import { NoteFileType, NoteMetadata } from "../../types";
import styled, { keyframes, css } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
} from "../../styles/design-tokens";

// 使用新的编辑器注册表
import { getEditorConfig } from "../Editors/EditorRegistry";

// ============================================
// 动画
// ============================================
const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// ============================================
// Styled Components
// ============================================

const EditorContainer = styled.div<{ $fullscreen?: boolean }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.background};
  position: relative;

  ${(props) =>
    props.$fullscreen
      ? `
    position: fixed;
    inset: 0;
    z-index: 9999;
    `
      : ""}
`;

const EditorHeader = styled.div<{ $fullscreen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} ${SPACING.xl};
  border-bottom: 1px solid ${COLORS.subtle};
  background: ${COLORS.paper};
  backdrop-filter: blur(8px);
  animation: ${fadeInDown} 0.3s ease-out;
  gap: ${SPACING.lg};
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.md};
`;

const SaveStatusBadge = styled.div<{ $saving: boolean }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
  text-transform: uppercase;
  color: ${(props) => (props.$saving ? COLORS.accent : COLORS.success)};
  padding: ${SPACING.xs} ${SPACING.md};
  border-radius: ${BORDER.radius.full};
  background: ${(props) =>
    props.$saving ? COLORS.accent + "15" : COLORS.success + "15"};

  ${(props) =>
    props.$saving &&
    css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const TagContainer = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  align-items: center;
`;

const StyledTag = styled(Tag)`
  margin: 0;
  padding: 2px 8px;
  border-radius: ${BORDER.radius.full};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  border: 1px solid ${COLORS.subtle};
  background: ${COLORS.subtleLight};
  color: ${COLORS.inkLight};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
  }

  .anticon-close {
    color: ${COLORS.inkMuted};

    &:hover {
      color: ${COLORS.accent};
    }
  }
`;

const AddTagButton = styled(Button)`
  height: 24px;
  border-radius: ${BORDER.radius.full};
  border: 1px dashed ${COLORS.subtle};
  background: transparent;
  color: ${COLORS.inkMuted};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  padding: 0 ${SPACING.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
  }
`;

const ActionButton = styled(Button)`
  height: 36px;
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.normal};

  &.ant-btn-default {
    border-color: ${COLORS.subtle};
    color: ${COLORS.inkLight};

    &:hover {
      border-color: ${COLORS.ink};
      color: ${COLORS.ink};
    }
  }

  &.ant-btn-dangerous {
    border-color: ${COLORS.subtle};
    color: ${COLORS.error};

    &:hover {
      border-color: ${COLORS.error};
      background: ${COLORS.error};
      color: ${COLORS.paper};
    }
  }

  &.ant-btn-primary {
    background: ${COLORS.ink};
    border-color: ${COLORS.ink};
    color: ${COLORS.paper};

    &:hover {
      background: ${COLORS.accent};
      border-color: ${COLORS.accent};
    }
  }
`;

const EditorContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.xl};
`;

const EmptyIcon = styled.div`
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.paperDark};
  border-radius: ${BORDER.radius.xl};
  font-size: 48px;
  color: ${COLORS.subtle};
`;

const EmptyText = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.lg};
  color: ${COLORS.inkMuted};
  text-align: center;
  max-width: 300px;
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
`;

const CreateButton = styled(Button)`
  height: 48px;
  padding: 0 ${SPACING.xl};
  border-radius: ${BORDER.radius.md};
  background: ${COLORS.ink};
  border-color: ${COLORS.ink};
  color: ${COLORS.paper};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accent};
    border-color: ${COLORS.accent};
    transform: translateY(-2px);
    box-shadow: ${SHADOW.accentHover};
  }
`;

const EditorControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

// ============================================
// Main Component
// ============================================

interface NoteEditorProps {
  noteId?: string;
}

// 预览模式类型
type PreviewMode = "edit" | "live" | "preview";

function NoteEditor({ noteId }: NoteEditorProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentNote, setCurrentNote, updateNote, createNote } =
    useNoteStore();
  const { tags: allTags, loadTags } = useTagStore();

  // 状态管理
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState<NoteMetadata | undefined>();
  const [tagIds, setTagIds] = useState<string[]>([]); // 改为存储标签ID
  const [saving, setSaving] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);

  // 当前文件类型状态
  const [fileType, setFileType] = useState<NoteFileType>(NoteFileType.MARKDOWN);

  // 编辑器控制状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("live");

  // 初始化编辑器
  useEffect(() => {
    const loadNote = async () => {
      // 加载所有标签
      await loadTags();

      if (noteId) {
        try {
          const note = await db.notes.get(noteId);
          if (note) {
            setCurrentNote(note);
            setTitle(note.title);
            setContent(note.content || "");
            // 从 noteTags 表加载标签关联
            const noteTags = await db.getNoteTags(noteId);
            setTagIds(noteTags.map((t) => t.id));
            setMetadata(note.metadata);
            // 兼容旧数据：没有 fileType 的默认为 markdown
            setFileType(note.fileType || NoteFileType.MARKDOWN);
          }
        } catch (error) {
          console.error("Failed to load note:", error);
        }
      } else {
        setCurrentNote(null);
        setTitle("");
        setContent("");
        setTagIds([]);
        setMetadata(undefined);
        setFileType(NoteFileType.MARKDOWN);
      }
    };
    loadNote();
  }, [noteId, setCurrentNote, loadTags]);

  // 自动保存
  const { saveStatus, manualSave } = useAutoSave({
    noteId,
    title,
    content,
    tagIds,
    onSave: async () => {
      if (!noteId) return;
      setSaving(true);
      try {
        // 保存标签关联到 IndexedDB
        await db.setNoteTags(noteId, tagIds);

        // 同时更新 notes 表的 tags 数组（保持兼容性）
        const tagNames = allTags
          .filter((t) => tagIds.includes(t.id))
          .map((t) => t.name);

        await updateNote(noteId, {
          title,
          content,
          tags: tagNames,
          fileType,
          metadata,
        });
      } catch (error) {
        console.error("Save failed:", error);
      }
      setSaving(false);
    },
  });

  // 内容变更处理（统一接口）
  const handleContentChange = (
    newContent: string,
    newMetadata?: NoteMetadata,
  ) => {
    setContent(newContent);
    if (newMetadata) {
      setMetadata(newMetadata);
    }
  };

  // 手动保存
  const handleManualSave = async () => {
    setSaving(true);
    await manualSave();
    setSaving(false);
    message.success("保存成功");
  };

  // 创建新笔记
  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: "新建笔记",
        content: "",
        tags: [],
        category: "default",
        isDeleted: false,
        isFavorite: false,
        fileType: NoteFileType.MARKDOWN,
      });
      navigate(`/notes/${newNote.id}`);
    } catch (error) {
      message.error("创建失败");
    }
  };

  // 添加标签
  const handleAddTag = (tagId: string) => {
    if (!tagIds.includes(tagId)) {
      setTagIds([...tagIds, tagId]);
    }
  };

  // 删除标签
  const handleRemoveTag = (tagIdToRemove: string) => {
    setTagIds(tagIds.filter((id) => id !== tagIdToRemove));
  };

  // 导入功能
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const importedContent = e.target?.result as string;
        setContent(importedContent);
        message.success("导入成功");
      };
      reader.readAsText(file);
    },
    [message],
  );

  // 导出功能
  const handleExport = useCallback(
    (format: "md" | "html" | "drawio" | "png" | "svg" | "xml") => {
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case "md":
          mimeType = "text/markdown";
          blob = new Blob([content], { type: mimeType });
          filename = `${title || "未命名"}.md`;
          break;
        case "html":
          mimeType = "text/html";
          blob = new Blob([content], { type: mimeType });
          filename = `${title || "未命名"}.html`;
          break;
        case "drawio":
        case "xml":
          mimeType = "application/xml";
          blob = new Blob([content], { type: mimeType });
          filename = `${title || "未命名"}.drawio`;
          break;
        default:
          mimeType = "text/plain";
          blob = new Blob([content], { type: mimeType });
          filename = `${title || "未命名"}.txt`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${format.toUpperCase()} 文件`);
    },
    [content, title, message],
  );

  // 获取当前编辑器配置
  const currentEditorConfig = getEditorConfig(fileType);
  const EditorComponent = currentEditorConfig?.component;

  if (!currentNote && !noteId) {
    return (
      <EditorContainer $fullscreen={isFullscreen}>
        <EmptyState>
          <EmptyIcon>
            <EditOutlined />
          </EmptyIcon>
          <EmptyText>选择一个笔记开始编辑，或创建新笔记</EmptyText>
          <CreateButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNote}
          >
            创建笔记
          </CreateButton>
        </EmptyState>
      </EditorContainer>
    );
  }

  // 根据文件类型获取导出选项
  const getExportItems = () => {
    if (fileType === NoteFileType.MARKDOWN) {
      return [
        { key: "md", label: "Markdown (.md)" },
        { key: "html", label: "HTML (.html)" },
      ];
    }
    if (fileType === NoteFileType.DRAWIO) {
      return [
        { key: "xml", label: "DrawIO 源文件" },
        { key: "png", label: "PNG 图片" },
        { key: "svg", label: "SVG 矢量图" },
      ];
    }
    return [{ key: "md", label: "导出文件" }];
  };

  return (
    <EditorContainer $fullscreen={isFullscreen}>
      {/* 编辑器头部 */}
      <EditorHeader $fullscreen={isFullscreen}>
        <HeaderLeft>
          <TagContainer>
            {allTags
              .filter((tag) => tagIds.includes(tag.id))
              .slice(0, 3)
              .map((tag) => (
                <StyledTag
                  key={tag.id}
                  color={tag.color}
                  closable
                  onClose={() => handleRemoveTag(tag.id)}
                >
                  {tag.name}
                </StyledTag>
              ))}
            {tagIds.length > 3 && <StyledTag>+{tagIds.length - 3}</StyledTag>}
            <Tooltip title="添加标签">
              <AddTagButton
                icon={<TagsOutlined />}
                size="small"
                onClick={() => setTagModalVisible(true)}
              />
            </Tooltip>
          </TagContainer>
        </HeaderLeft>

        <HeaderRight>
          {/* 编辑器控制按钮 */}
          {fileType === NoteFileType.MARKDOWN && (
            <EditorControls>
              <Dropdown
                menu={{
                  items: [
                    { key: "edit", label: "仅编辑", icon: <EditOutlined /> },
                    {
                      key: "live",
                      label: "实时预览",
                      icon: <ColumnWidthOutlined />,
                    },
                    { key: "preview", label: "仅预览", icon: <EyeOutlined /> },
                  ],
                  onClick: ({ key }) => setPreviewMode(key as PreviewMode),
                }}
              >
                <Button icon={<ColumnWidthOutlined />}>
                  {previewMode === "edit"
                    ? "仅编辑"
                    : previewMode === "preview"
                      ? "仅预览"
                      : "实时预览"}
                </Button>
              </Dropdown>
              <Button
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? "退出全屏" : "全屏"}
              </Button>
            </EditorControls>
          )}

          {/* 导入按钮 */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              const acceptMap: Record<NoteFileType, string> = {
                [NoteFileType.MARKDOWN]: ".md,.markdown,.txt",
                [NoteFileType.RICH_TEXT]: ".txt,.html",
                [NoteFileType.MONACO]:
                  ".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.sql,.yaml,.xml,.json",
                [NoteFileType.DRAWIO]: ".drawio,.xml",
                [NoteFileType.MINDMAP]: ".json,.md",
              };
              input.accept = acceptMap[fileType] || "*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImport(file);
              };
              input.click();
            }}
          >
            导入
          </Button>

          {/* 导出按钮 */}
          <Dropdown
            menu={{
              items: getExportItems(),
              onClick: ({ key }) => handleExport(key as any),
            }}
          >
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Dropdown>

          <SaveStatusBadge $saving={saving}>
            <span className="status-dot" />
            {saveStatus}
          </SaveStatusBadge>
          <ActionButton
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleManualSave}
          >
            保存
          </ActionButton>
        </HeaderRight>
      </EditorHeader>

      {/* 编辑器内容 */}
      <EditorContent>
        <EditorWrapper>
          {/* 动态编辑器组件 */}
          {EditorComponent && (
            <EditorComponent
              noteId={noteId || ""}
              title={title}
              content={content}
              metadata={metadata}
              onChange={handleContentChange}
              onTitleChange={setTitle}
              onSave={handleManualSave}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
              isFullscreen={isFullscreen}
              onFullscreenChange={setIsFullscreen}
            />
          )}
        </EditorWrapper>
      </EditorContent>

      {/* 标签管理弹窗 */}
      <Modal
        title="管理标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        onOk={() => setTagModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="选择要添加的标签"
            value={tagIds}
            onChange={setTagIds}
            options={allTags.map((tag) => ({
              label: (
                <Tag color={tag.color} style={{ margin: 0 }}>
                  {tag.name}
                </Tag>
              ),
              value: tag.id,
            }))}
            filterOption={(input, option) =>
              (option?.label as any)?.props?.children
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
        <div
          style={{
            padding: 16,
            background: COLORS.background,
            borderRadius: BORDER.radius.sm,
            minHeight: 80,
          }}
        >
          {tagIds.length === 0 ? (
            <Empty
              description="暂无标签"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Space wrap>
              {allTags
                .filter((tag) => tagIds.includes(tag.id))
                .map((tag) => (
                  <Tag
                    key={tag.id}
                    color={tag.color}
                    closable
                    onClose={() => handleRemoveTag(tag.id)}
                    style={{ marginBottom: 8 }}
                  >
                    {tag.name}
                  </Tag>
                ))}
            </Space>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: COLORS.inkMuted }}>
          💡 提示：您可以在"设置 → 标签管理"中创建新标签
        </div>
      </Modal>
    </EditorContainer>
  );
}

export default NoteEditor;

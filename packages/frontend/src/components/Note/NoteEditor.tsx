import { useEffect, useState, useCallback } from "react";
import {
  Button,
  App,
  Tag,
  Tooltip,
  Modal,
  Space,
  Dropdown,
  Select,
  Empty,
  Input,
  ColorPicker,
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
  CheckCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNoteStore } from "../../store/noteStore";
import { useTagStore } from "../../store/tagStore";
import { useFullscreenStore } from "../../store/fullscreenStore";
import { FILE_TYPE_ASSISTANT_MAP } from "../../config/assistants.config";
import { useAIStore } from "../../store/aiStore";
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

// 统一的编辑器工具栏按钮样式（仅图标）
const EditorToolbarButton = styled(Button)<{
  $saving?: boolean;
  $saved?: boolean;
}>`
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: ${BORDER.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${TRANSITION.normal};

  &.ant-btn-default {
    border-color: ${COLORS.subtle};
    color: ${COLORS.inkLight};
    background: transparent;

    &:hover {
      border-color: ${COLORS.ink};
      color: ${COLORS.ink};
      background: ${COLORS.subtleLight};
    }

    .anticon {
      font-size: 16px;
    }
  }

  // 保存按钮状态样式
  ${(props) =>
    props.$saving &&
    css`
      color: ${COLORS.accent};
      border-color: ${COLORS.accent};
      background: ${COLORS.accent}15;
      animation: ${pulse} 1.5s ease-in-out infinite;

      .anticon {
        color: ${COLORS.accent};
      }
    `}

  ${(props) =>
    props.$saved &&
    css`
      color: ${COLORS.success};
      border-color: ${COLORS.success};
      background: ${COLORS.success}15;

      .anticon {
        color: ${COLORS.success};
      }
    `}
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
  background: ${COLORS.accent};
  border-color: ${COLORS.accent};
  color: ${COLORS.paper};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accentHover};
    border-color: ${COLORS.accentHover};
    transform: translateY(-2px);
    box-shadow: ${SHADOW.accentHover};
  }
`;

// ============================================
// Main Component
// ============================================

interface NoteEditorProps {
  noteId?: string;
}

function NoteEditor({ noteId }: NoteEditorProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentNote, setCurrentNote, updateNote, createNote } =
    useNoteStore();
  const { setCurrentAssistant, assistants, setCurrentNoteId } = useAIStore();
  const { tags: allTags, loadTags, createTag } = useTagStore();

  // 状态管理
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState<NoteMetadata | undefined>();
  const [tagIds, setTagIds] = useState<string[]>([]); // 改为存储标签ID
  const [saving, setSaving] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#108ee9");

  // 当前文件类型状态
  const [fileType, setFileType] = useState<NoteFileType>(NoteFileType.MARKDOWN);

  // 标记笔记是否已加载完成
  const [isNoteLoaded, setIsNoteLoaded] = useState(false);

  // 编辑器控制状态 - 使用全局全屏状态
  const { isFullscreen, setFullscreen } = useFullscreenStore();

  // 自动切换到对应的 AI 助手
  useEffect(() => {
    if (!fileType || !assistants.length) return;

    // 使用统一的助手 ID 映射配置
    const targetAssistantId = FILE_TYPE_ASSISTANT_MAP[fileType];

    if (targetAssistantId) {
      const targetAssistant = assistants.find(
        (a) => a.id === targetAssistantId,
      );
      if (targetAssistant) {
        setCurrentAssistant(targetAssistant);
        console.log(
          `[NoteEditor] 已自动切换到${targetAssistant.name}助手 (ID: ${targetAssistantId})`,
        );
      } else {
        console.warn(
          `[NoteEditor] 未找到助手 ID: ${targetAssistantId}，可用的助手:`,
          assistants.map((a) => a.id),
        );
      }
    }
  }, [fileType, assistants, setCurrentAssistant]);

  // 初始化编辑器
  useEffect(() => {
    const loadNote = async () => {
      // 重置加载状态
      setIsNoteLoaded(false);

      // 加载所有标签
      await loadTags();

      if (noteId) {
        try {
          const note = await db.notes.get(noteId);
          if (note) {
            setCurrentNote(note);
            // 🔥 设置当前笔记 ID 到 AI Store
            setCurrentNoteId(noteId);
            setTitle(note.title);
            // 从 noteTags 表加载标签关联
            const noteTags = await db.getNoteTags(noteId);
            setTagIds(noteTags.map((t) => t.id));
            setMetadata(note.metadata);
            // 兼容旧数据：没有 fileType 的默认为 markdown
            setFileType(note.fileType || NoteFileType.MARKDOWN);

            // 加载内容：富文本使用 htmlContent，其他使用 content
            // 🔍 调试：检查类型和内容
            const isRichText = note.fileType === NoteFileType.RICH_TEXT || note.fileType === "richtext";
            const loadedContent = isRichText
              ? (note.htmlContent || note.content || "")
              : (note.content || "");

            console.log("[NoteEditor] 加载笔记:", {
              noteId,
              fileType: note.fileType,
              fileTypeEnum: NoteFileType.RICH_TEXT,
              isRichText,
              hasHtmlContent: !!note.htmlContent,
              htmlContentLength: note.htmlContent?.length || 0,
              hasContent: !!note.content,
              contentLength: note.content?.length || 0,
              loadedContentLength: loadedContent.length,
              loadedContentPreview: loadedContent.substring(0, 200),
            });

            setContent(loadedContent);

            // 标记笔记加载完成
            setIsNoteLoaded(true);
          }
        } catch (error) {
          console.error("Failed to load note:", error);
        }
      } else {
        setCurrentNote(null);
        // 🔥 清空当前笔记 ID
        setCurrentNoteId(null);
        setTitle("");
        setContent("");
        setTagIds([]);
        setMetadata(undefined);
        setFileType(NoteFileType.MARKDOWN);
        setIsNoteLoaded(true);
      }
    };
    loadNote();
  }, [noteId, setCurrentNote, loadTags, setCurrentNoteId]);

  // 自动保存函数 - 使用 useCallback 避免重复创建
  const handleAutoSave = useCallback(async () => {
    if (!noteId) return;
    setSaving(true);
    try {
      // 保存标签关联到 IndexedDB
      await db.setNoteTags(noteId, tagIds);

      // 同时更新 notes 表的 tags 数组（保持兼容性）
      const tagNames = allTags
        .filter((t) => tagIds.includes(t.id))
        .map((t) => t.name);

      // 富文本编辑器：保存到 htmlContent 字段
      const updateData: any = {
        title,
        content,
        tags: tagNames,
        fileType,
        metadata,
      };

      // 如果是富文本，将 content 内容保存到 htmlContent
      if (fileType === NoteFileType.RICH_TEXT) {
        updateData.htmlContent = content;
      }

      await updateNote(noteId, updateData);
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  }, [noteId, tagIds, allTags, title, content, fileType, metadata, updateNote]);

  // 自动保存
  const { saveStatus, manualSave } = useAutoSave({
    noteId,
    title,
    content,
    tags: tagIds,
    onSave: handleAutoSave,
    enabled: isNoteLoaded, // 只有在笔记加载完成后才启用自动保存
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
        category: "", // 使用空字符串，后端会自动分配到"未分类"
        isDeleted: false,
        isFavorite: false,
        fileType: NoteFileType.MARKDOWN,
      });
      navigate(`/notes/${newNote.id}`);
    } catch (error) {
      message.error("创建失败");
    }
  };

  // 删除标签
  const handleRemoveTag = (tagIdToRemove: string) => {
    setTagIds(tagIds.filter((id) => id !== tagIdToRemove));
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      message.warning("请输入标签名称");
      return;
    }

    try {
      // 使用 tagStore 的 createTag 方法，会自动同步到后端
      const newTag = await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });

      // 清空输入
      setNewTagName("");
      setNewTagColor("#108ee9");

      // 自动选中新创建的标签
      setTagIds([...tagIds, newTag.id]);

      message.success("标签创建成功");
    } catch (error) {
      console.error("Failed to create tag:", error);
      message.error("创建失败");
    }
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
          </TagContainer>
        </HeaderLeft>

        <HeaderRight>
          {/* 标签按钮 */}
          <Tooltip title="管理标签">
            <EditorToolbarButton
              icon={<TagsOutlined />}
              onClick={() => setTagModalVisible(true)}
            />
          </Tooltip>

          {/* 导入按钮 */}
          <Tooltip title="导入文件">
            <EditorToolbarButton
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
            />
          </Tooltip>

          {/* 导出按钮 */}
          <Dropdown
            menu={{
              items: getExportItems(),
              onClick: ({ key }) => handleExport(key as any),
            }}
          >
            <Tooltip title="导出文件">
              <EditorToolbarButton icon={<DownloadOutlined />} />
            </Tooltip>
          </Dropdown>

          {/* 保存按钮 - 带状态指示 */}
          <Tooltip
            title={
              saving ? "保存中..." : saveStatus === "已保存" ? "已保存" : "保存"
            }
          >
            <EditorToolbarButton
              icon={
                saving ? (
                  <LoadingOutlined />
                ) : saveStatus === "已保存" ? (
                  <CheckCircleFilled />
                ) : (
                  <SaveOutlined />
                )
              }
              $saving={saving}
              $saved={!saving && saveStatus === "已保存"}
              onClick={handleManualSave}
            />
          </Tooltip>

          {/* 全屏按钮 */}
          <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
            <EditorToolbarButton
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={() => setFullscreen(!isFullscreen)}
            />
          </Tooltip>
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
              isFullscreen={isFullscreen}
              onFullscreenChange={setFullscreen}
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
        {/* 选择标签 */}
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

        {/* 已选标签展示 */}
        <div
          style={{
            padding: 16,
            background: COLORS.background,
            borderRadius: BORDER.radius.sm,
            minHeight: 80,
            marginBottom: 16,
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

        {/* 创建新标签 */}
        <div
          style={{
            padding: 16,
            background: COLORS.paper,
            borderRadius: BORDER.radius.sm,
            border: `1px solid ${COLORS.subtle}`,
          }}
        >
          <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
            创建新标签
          </div>
          <Space style={{ width: "100%" }}>
            <Input
              style={{ width: 200 }}
              placeholder="标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onPressEnter={handleCreateTag}
            />
            <ColorPicker
              value={newTagColor}
              onChange={(color) => setNewTagColor(color.toHexString())}
              showText
              format="hex"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTag}
            >
              创建
            </Button>
          </Space>
        </div>
      </Modal>
    </EditorContainer>
  );
}

export default NoteEditor;

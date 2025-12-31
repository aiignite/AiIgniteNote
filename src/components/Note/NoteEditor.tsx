import { useEffect, useState } from "react";
import {
  Input,
  Button,
  Space,
  App,
  Tag,
  Tooltip,
  Modal,
  Input as AntInput,
  Segmented,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  TagsOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNoteStore } from "../../store/noteStore";
import { useAutoSave } from "../../hooks/useAutoSave";
import { db } from "../../db";
import MDEditor from "@uiw/react-md-editor";
import RichTextEditor from "./RichTextEditor";
import styled from "styled-components";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  .w-md-editor-text-pre,
  .w-md-editor-text-input,
  .w-md-editor-text {
    font-size: 16px !important;
    line-height: 1.8 !important;
  }
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  gap: 12px;
  flex-wrap: wrap;
`;

const EditorContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px 16px 16px;
`;

const TitleInput = styled(Input)`
  border: none;
  font-size: 24px;
  font-weight: 600;
  padding: 12px 16px;

  &:focus {
    box-shadow: none;
  }
`;

const SaveStatus = styled.span<{ $saving: boolean }>`
  font-size: 12px;
  color: ${(props) => (props.$saving ? "#1890ff" : "#52c41a")};
  transition: color 0.3s;
  white-space: nowrap;
`;

const TagContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const EditorWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
  border-radius: 8px;
  margin-top: 12px;
  border: 1px solid var(--border-color);

  .w-md-editor {
    height: 100% !important;
    border: none !important;
    border-radius: 8px;
  }
`;

interface NoteEditorProps {
  noteId?: string;
  onBack?: () => void;
}

function NoteEditor({ noteId, onBack }: NoteEditorProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentNote, setCurrentNote, updateNote, deleteNote, createNote } =
    useNoteStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editorType, setEditorType] = useState<"markdown" | "richtext">(
    "markdown",
  );

  // 初始化编辑器
  useEffect(() => {
    const loadNote = async () => {
      if (noteId) {
        try {
          const note = await db.notes.get(noteId);
          if (note) {
            setCurrentNote(note);
            setTitle(note.title);
            setContent(note.content || "");
            setTags(note.tags || []);
          }
        } catch (error) {
          console.error("Failed to load note:", error);
        }
      } else {
        setCurrentNote(null);
        setTitle("");
        setContent("");
        setTags([]);
      }
    };
    loadNote();
  }, [noteId, setCurrentNote]);

  // 自动保存
  const { saveStatus, manualSave } = useAutoSave({
    noteId,
    title,
    content,
    tags,
    onSave: async () => {
      if (!noteId) return;
      setSaving(true);
      try {
        await updateNote(noteId, { title, content, tags });
      } catch (error) {
        console.error("Save failed:", error);
      }
      setSaving(false);
    },
  });

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
        htmlContent: "",
        tags: [],
        category: "default",
        isDeleted: false,
        isFavorite: false,
      });
      navigate(`/notes/${newNote.id}`);
    } catch (error) {
      message.error("创建失败");
    }
  };

  // 删除笔记
  const handleDeleteNote = async () => {
    if (!noteId) return;

    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这篇笔记吗？删除后可以到回收站恢复。",
      okText: "确定",
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteNote(noteId);
          message.success("删除成功");
          navigate("/notes");
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 返回列表
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/notes");
    }
  };

  if (!currentNote && !noteId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <EditOutlined style={{ fontSize: 64, color: "rgba(0,0,0,0.2)" }} />
        <p style={{ color: "rgba(0, 0, 0, 0.45)", fontSize: 16 }}>
          选择或创建一个笔记开始编辑
        </p>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateNote}
          size="large"
        >
          创建笔记
        </Button>
      </div>
    );
  }

  return (
    <EditorContainer>
      {/* 编辑器头部 */}
      <EditorHeader>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <SaveStatus $saving={saving}>{saveStatus}</SaveStatus>
          <Segmented
            value={editorType}
            onChange={(value) =>
              setEditorType(value as "markdown" | "richtext")
            }
            options={[
              { label: "Markdown", value: "markdown" },
              { label: "富文本", value: "richtext" },
            ]}
          />
        </Space>

        <TagContainer>
          {tags.map((tag) => (
            <Tag
              key={tag}
              color="blue"
              closable
              onClose={() => handleRemoveTag(tag)}
            >
              {tag}
            </Tag>
          ))}
          <Tooltip title="添加标签">
            <Button
              type="text"
              icon={<TagsOutlined />}
              size="small"
              onClick={() => setTagModalVisible(true)}
            >
              {tags.length === 0 && "添加标签"}
            </Button>
          </Tooltip>
        </TagContainer>

        <Space>
          <Button
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleManualSave}
          >
            保存
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteNote}>
            删除
          </Button>
        </Space>
      </EditorHeader>

      {/* 编辑器内容 */}
      <EditorContent>
        {editorType === "markdown" ? (
          <>
            <TitleInput
              placeholder="请输入标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="borderless"
            />
            <EditorWrapper>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                preview="live"
                height="100%"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{
                  placeholder: "开始写作... 支持 Markdown 语法",
                }}
                extraCommands={[]}
              />
            </EditorWrapper>
          </>
        ) : (
          <RichTextEditor
            content={content}
            title={title}
            onChange={setContent}
            onTitleChange={setTitle}
            onSave={handleManualSave}
          />
        )}
      </EditorContent>

      {/* 标签管理弹窗 */}
      <Modal
        title="管理标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        onOk={() => setTagModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Space.Compact style={{ width: "100%" }}>
          <AntInput
            placeholder="输入标签名称"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onPressEnter={handleAddTag}
          />
          <Button type="primary" onClick={handleAddTag}>
            添加
          </Button>
        </Space.Compact>
        <div
          style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {tags.map((tag) => (
            <Tag
              key={tag}
              color="blue"
              closable
              onClose={() => handleRemoveTag(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </Modal>
    </EditorContainer>
  );
}

export default NoteEditor;

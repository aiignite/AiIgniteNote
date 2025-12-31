import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TextAlignExtension from "@tiptap/extension-text-align";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  DisconnectOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import { Button, Space, Divider, Upload, Modal, Input, message } from "antd";
import { useState, useCallback } from "react";
import styled from "styled-components";

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;

  .ProseMirror {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    outline: none;
    font-size: 16px;
    line-height: 1.6;
    color: var(--text-primary);

    &:focus {
      outline: none;
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--text-tertiary);
      pointer-events: none;
      height: 0;
    }
  }

  .ProseMirror p {
    margin: 0.5em 0;
  }

  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 16px 0;
  }

  .ProseMirror a {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
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

interface RichTextEditorProps {
  content?: string;
  title?: string;
  onChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
}

function RichTextEditor({
  content = "",
  title = "",
  onChange,
  onTitleChange,
  onSave,
}: RichTextEditorProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      TextAlignExtension.configure({
        types: ["heading", "paragraph"],
      }),
      PlaceholderExtension.configure({
        placeholder: "开始输入内容...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // 上传图片到 IndexedDB
  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        // 将图片转换为 Base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;

          // 插入图片到编辑器
          editor?.chain().focus().setImage({ src: base64 }).run();
          message.success("图片上传成功");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("图片上传失败:", error);
        message.error("图片上传失败");
      }
    },
    [editor],
  );

  // 通过 URL 添加图片
  const handleAddImageUrl = useCallback(() => {
    if (imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setImageModalVisible(false);
    }
  }, [editor, imageUrl]);

  // 添加文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  if (!editor) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 标题输入 */}
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        variant="borderless"
      />

      {/* 工具栏 */}
      <Toolbar>
        <Space size="small">
          {/* 撤销/重做 */}
          <Button
            type="text"
            icon={<UndoOutlined />}
            onClick={() => editor.chain().undo().run()}
            disabled={!editor.can().undo()}
          />
          <Button
            type="text"
            icon={<RedoOutlined />}
            onClick={() => editor.chain().redo().run()}
            disabled={!editor.can().redo()}
          />

          <Divider type="vertical" />

          {/* 文本格式 */}
          <Button
            type="text"
            icon={<BoldOutlined />}
            onClick={() => editor.chain().toggleBold().run()}
            style={{
              background: editor.isActive("bold")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().toggleItalic().run()}
            style={{
              background: editor.isActive("italic")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<UnderlineOutlined />}
            onClick={() => editor.chain().toggleUnderline().run()}
            style={{
              background: editor.isActive("underline")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<StrikethroughOutlined />}
            onClick={() => editor.chain().toggleStrike().run()}
            style={{
              background: editor.isActive("strike")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />

          <Divider type="vertical" />

          {/* 列表 */}
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().toggleBulletList().run()}
            style={{
              background: editor.isActive("bulletList")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().toggleOrderedList().run()}
            style={{
              background: editor.isActive("orderedList")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />

          <Divider type="vertical" />

          {/* 对齐 */}
          <Button
            type="text"
            icon={<AlignLeftOutlined />}
            onClick={() => editor.chain().setTextAlign("left").run()}
            style={{
              background: editor.isActive({ textAlign: "left" })
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<AlignCenterOutlined />}
            onClick={() => editor.chain().setTextAlign("center").run()}
            style={{
              background: editor.isActive({ textAlign: "center" })
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<AlignRightOutlined />}
            onClick={() => editor.chain().setTextAlign("right").run()}
            style={{
              background: editor.isActive({ textAlign: "right" })
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />

          <Divider type="vertical" />

          {/* 链接 */}
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => {
              const url = window.prompt("输入链接地址:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            style={{
              background: editor.isActive("link")
                ? "var(--bg-tertiary)"
                : undefined,
            }}
          />
          <Button
            type="text"
            icon={<DisconnectOutlined />}
            onClick={() => editor.chain().focus().unsetLink().run()}
          />

          <Divider type="vertical" />

          {/* 图片 */}
          <Button
            type="text"
            icon={<PictureOutlined />}
            onClick={() => setImageModalVisible(true)}
          />

          {/* 保存按钮 */}
          {onSave && (
            <>
              <Divider type="vertical" />
              <Button type="primary" onClick={onSave}>
                保存
              </Button>
            </>
          )}
        </Space>
      </Toolbar>

      {/* 编辑器 */}
      <EditorContainer>
        <EditorContent editor={editor} />
      </EditorContainer>

      {/* 图片上传弹窗 */}
      <Modal
        title="插入图片"
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        onOk={handleAddImageUrl}
        okText="插入"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="粘贴图片地址..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            或者上传本地图片：
          </div>
          <Upload
            beforeUpload={() => false}
            onChange={handleFileChange}
            accept="image/*"
            maxCount={1}
          >
            <Button icon={<PictureOutlined />}>选择图片</Button>
          </Upload>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            支持格式：JPG、PNG、GIF
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default RichTextEditor;

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
import { Button, Space, Upload, Modal, Input, message } from "antd";
import { useState, useCallback } from "react";
import styled, { css } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
} from "../../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const EditorWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.paper};
`;

const TitleInputWrapper = styled.div`
  padding: ${SPACING.xl} ${SPACING.xl} ${SPACING.md};
  border-bottom: 1px solid ${COLORS.subtle};
`;

const TitleInput = styled(Input)`
  border: none;
  background: transparent;
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize["5xl"]};
  font-weight: ${TYPOGRAPHY.fontWeight.normal};
  color: ${COLORS.ink};
  padding: 0;

  &::placeholder {
    color: ${COLORS.subtle};
    font-style: italic;
  }

  &:focus {
    box-shadow: none;
    outline: none;
  }

  .ant-input {
    background: transparent;
    border: none;
    box-shadow: none;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.xs};
  padding: ${SPACING.md} ${SPACING.xl};
  background: ${COLORS.paper};
  border-bottom: 1px solid ${COLORS.subtle};
  align-items: center;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${COLORS.subtle};
  margin: 0 ${SPACING.xs};
`;

const ToolbarButton = styled(Button)<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${BORDER.radius.sm};
  border: 1px solid transparent;
  background: transparent;
  color: ${COLORS.inkMuted};
  transition: all ${TRANSITION.fast};

  &:hover:not(:disabled) {
    background: ${COLORS.subtleLight};
    color: ${COLORS.ink};
  }

  ${(props) =>
    props.$active &&
    css`
      background: ${COLORS.ink};
      color: ${COLORS.paper};
      border-color: ${COLORS.ink};

      &:hover {
        background: ${COLORS.accent};
        border-color: ${COLORS.accent};
        color: ${COLORS.paper};
      }
    `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .ProseMirror {
    flex: 1;
    overflow-y: auto;
    padding: ${SPACING.xl};
    outline: none;
    font-family: ${TYPOGRAPHY.fontFamily.body};
    font-size: ${TYPOGRAPHY.fontSize.lg};
    line-height: ${TYPOGRAPHY.lineHeight.relaxed};
    color: ${COLORS.ink};

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${COLORS.subtle};
      border-radius: 3px;

      &:hover {
        background: ${COLORS.inkMuted};
      }
    }

    &:focus {
      outline: none;
    }

    > *:first-child {
      margin-top: 0;
    }

    > *:last-child {
      margin-bottom: 0;
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: ${COLORS.subtle};
      font-style: italic;
      pointer-events: none;
      height: 0;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-family: ${TYPOGRAPHY.fontFamily.display};
      font-weight: ${TYPOGRAPHY.fontWeight.normal};
      line-height: ${TYPOGRAPHY.lineHeight.tight};
      margin: 1.5em 0 0.5em;
      color: ${COLORS.ink};

      &:first-child {
        margin-top: 0;
      }
    }

    h1 {
      font-size: ${TYPOGRAPHY.fontSize["6xl"]};
    }

    h2 {
      font-size: ${TYPOGRAPHY.fontSize["5xl"]};
    }

    h3 {
      font-size: ${TYPOGRAPHY.fontSize["4xl"]};
    }

    p {
      margin: 0.75em 0;
    }

    strong {
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
    }

    em {
      font-style: italic;
      color: ${COLORS.inkLight};
    }

    a {
      color: ${COLORS.accent};
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color ${TRANSITION.fast};

      &:hover {
        color: ${COLORS.accentHover};
      }
    }

    code {
      font-family: ${TYPOGRAPHY.fontFamily.mono};
      font-size: 0.9em;
      background: ${COLORS.subtleLight};
      padding: 2px 6px;
      border-radius: ${BORDER.radius.sm};
      color: ${COLORS.accent};
    }

    pre {
      font-family: ${TYPOGRAPHY.fontFamily.mono};
      background: ${COLORS.paperDark};
      padding: ${SPACING.md};
      border-radius: ${BORDER.radius.md};
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid ${COLORS.subtle};

      code {
        background: transparent;
        padding: 0;
        color: ${COLORS.ink};
      }
    }

    ul,
    ol {
      padding-left: 1.5em;
      margin: 0.75em 0;

      li {
        margin: 0.25em 0;

        &::marker {
          color: ${COLORS.accent};
        }
      }
    }

    blockquote {
      border-left: 3px solid ${COLORS.accent};
      padding-left: ${SPACING.md};
      margin: 1em 0;
      color: ${COLORS.inkLight};
      font-style: italic;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: ${BORDER.radius.md};
      margin: ${SPACING.lg} 0;
      box-shadow: ${SHADOW.md};
      display: block;
    }

    img.rich-text-image {
      max-width: 100%;
      height: auto;
      border-radius: ${BORDER.radius.lg};
      margin: ${SPACING.lg} 0;
      box-shadow: ${SHADOW.lg};
      cursor: pointer;
      transition: transform ${TRANSITION.normal};
    }

    img.rich-text-image:hover {
      transform: scale(1.02);
    }

    hr {
      border: none;
      border-top: 1px solid ${COLORS.subtle};
      margin: 2em 0;
    }
  }
`;

// ============================================
// Main Component
// ============================================

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
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rich-text-image',
        },
      }),
      TextAlignExtension.configure({
        types: ["heading", "paragraph"],
      }),
      PlaceholderExtension.configure({
        placeholder: "开始写作...",
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
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          message.error('请选择图片文件');
          return;
        }

        // 验证文件大小 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          message.error('图片文件不能超过10MB');
          return;
        }

        // 将图片转换为 Base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          
          // 验证 Base64 数据
          if (!base64 || !base64.startsWith('data:image/')) {
            message.error('图片格式不正确');
            return;
          }

          console.log('[RichTextEditor] 插入图片:', {
            fileName: file.name,
            fileSize: file.size,
            base64Length: base64.length,
            base64Preview: base64.substring(0, 100) + '...'
          });

          // 插入图片到编辑器
          editor?.chain().focus().setImage({ 
            src: base64,
            alt: file.name,
            title: file.name
          }).run();
          
          message.success("图片上传成功");
        };
        
        reader.onerror = () => {
          console.error('图片读取失败');
          message.error("图片读取失败");
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
  const handleFileChange = (info: any) => {
    const file = info.fileList?.[0]?.originFileObj;
    if (file) {
      handleImageUpload(file);
    }
  };

  if (!editor) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.inkMuted,
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <EditorWrapper>
      {/* 标题输入 */}
      <TitleInputWrapper>
        <TitleInput
          placeholder="无标题"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          variant="borderless"
        />
      </TitleInputWrapper>

      {/* 工具栏 */}
      <Toolbar>
        {/* 撤销/重做 */}
        <ToolbarButton
          icon={<UndoOutlined />}
          onClick={() => editor.chain().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={<RedoOutlined />}
          onClick={() => editor.chain().redo().run()}
          disabled={!editor.can().redo()}
        />

        <ToolbarDivider />

        {/* 文本格式 */}
        <ToolbarButton
          $active={editor.isActive("bold")}
          icon={<BoldOutlined />}
          onClick={() => editor.chain().toggleBold().run()}
        />
        <ToolbarButton
          $active={editor.isActive("italic")}
          icon={<ItalicOutlined />}
          onClick={() => editor.chain().toggleItalic().run()}
        />
        <ToolbarButton
          $active={editor.isActive("underline")}
          icon={<UnderlineOutlined />}
          onClick={() => editor.chain().toggleUnderline().run()}
        />
        <ToolbarButton
          $active={editor.isActive("strike")}
          icon={<StrikethroughOutlined />}
          onClick={() => editor.chain().toggleStrike().run()}
        />

        <ToolbarDivider />

        {/* 列表 */}
        <ToolbarButton
          $active={editor.isActive("bulletList")}
          icon={<UnorderedListOutlined />}
          onClick={() => editor.chain().toggleBulletList().run()}
        />
        <ToolbarButton
          $active={editor.isActive("orderedList")}
          icon={<OrderedListOutlined />}
          onClick={() => editor.chain().toggleOrderedList().run()}
        />

        <ToolbarDivider />

        {/* 对齐 */}
        <ToolbarButton
          $active={editor.isActive({ textAlign: "left" })}
          icon={<AlignLeftOutlined />}
          onClick={() => editor.chain().setTextAlign("left").run()}
        />
        <ToolbarButton
          $active={editor.isActive({ textAlign: "center" })}
          icon={<AlignCenterOutlined />}
          onClick={() => editor.chain().setTextAlign("center").run()}
        />
        <ToolbarButton
          $active={editor.isActive({ textAlign: "right" })}
          icon={<AlignRightOutlined />}
          onClick={() => editor.chain().setTextAlign("right").run()}
        />

        <ToolbarDivider />

        {/* 链接 */}
        <ToolbarButton
          $active={editor.isActive("link")}
          icon={<LinkOutlined />}
          onClick={() => {
            const url = window.prompt("输入链接地址:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        />
        <ToolbarButton
          icon={<DisconnectOutlined />}
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
        />

        <ToolbarDivider />

        {/* 图片 */}
        <ToolbarButton
          icon={<PictureOutlined />}
          onClick={() => setImageModalVisible(true)}
        />

        <div style={{ flex: 1 }} />

        {/* 保存按钮 */}
        {onSave && (
          <Button
            type="primary"
            onClick={onSave}
            style={{
              height: "32px",
              borderRadius: BORDER.radius.sm,
              background: COLORS.ink,
              borderColor: COLORS.ink,
            }}
          >
            保存
          </Button>
        )}
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
        okButtonProps={{
          style: {
            background: COLORS.ink,
            borderColor: COLORS.ink,
          },
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="粘贴图片地址..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          <div
            style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.inkMuted,
            }}
          >
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
          <div
            style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.inkMuted,
            }}
          >
            支持格式：JPG、PNG、GIF
          </div>
        </Space>
      </Modal>
    </EditorWrapper>
  );
}

export default RichTextEditor;

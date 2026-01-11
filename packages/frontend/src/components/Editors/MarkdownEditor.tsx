import styled from "styled-components";
import MDEditor, { commands } from "@uiw/react-md-editor";
import type { EditorProps } from "./BaseEditor";
import "@uiw/react-md-editor/markdown-editor.css";

const EditorWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TitleInput = styled.input`
  border: none;
  font-size: 24px;
  font-weight: 600;
  padding: 12px 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 100%;
  outline: none;

  &::placeholder {
    color: var(--text-secondary);
  }
`;

interface MarkdownEditorProps extends EditorProps {
  previewMode?: "edit" | "live" | "preview";
}

function MarkdownEditor({
  title,
  content,
  onChange,
  onTitleChange,
  previewMode = "live",
}: MarkdownEditorProps) {
  // 检测内容是否为非 Markdown 格式（DrawIO/MindMap 等）
  const isNonMarkdownContent = content && (
    content.includes("<mxfile") ||
    content.includes("<diagram") ||
    (content.includes('"root"') && content.includes('"children"'))
  );

  return (
    <EditorWrapper>
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <div style={{ flex: 1, overflow: "hidden" }}>
        {isNonMarkdownContent ? (
          // 如果是特殊格式内容，显示提示
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
              padding: "40px",
              textAlign: "center",
              background: "var(--bg-primary)",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ fontSize: "48px" }}>📝</div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>
              正在加载编辑器...
            </div>
            <div style={{ fontSize: "14px", maxWidth: "400px" }}>
              检测到特殊格式内容，正在切换到对应的编辑器
            </div>
          </div>
        ) : (
          <MDEditor
            value={content}
            onChange={(val) => onChange(val || "")}
            preview={previewMode}
            height="100%"
            hideToolbar={false}
            visibleDragbar={false}
            textareaProps={{
              placeholder: "开始写作... 支持 Markdown 语法",
            }}
            commands={[
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.hr,
              commands.title,
              commands.divider,
              commands.link,
              commands.quote,
              commands.code,
              commands.image,
              commands.divider,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.checkedListCommand,
            ]}
            extraCommands={[
              commands.codeEdit,
              commands.codeLive,
              commands.codePreview,
              commands.divider,
              commands.help,
            ]}
          />
        )}
      </div>
    </EditorWrapper>
  );
}

export default MarkdownEditor;

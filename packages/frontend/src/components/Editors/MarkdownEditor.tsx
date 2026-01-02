import { message } from "antd";
import styled from "styled-components";
import { TYPOGRAPHY } from "../../styles/design-tokens";
import MDEditor, { commands } from "@uiw/react-md-editor";
import type { EditorProps } from "./BaseEditor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const EditorWrapper = styled.div<{ $fullscreen?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${(props) =>
    props.$fullscreen
      ? `
    position: fixed;
    inset: 0;
    z-index: 9999;
    `
      : ""}
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

const Toolbar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  font-size: ${TYPOGRAPHY?.fontSize?.sm || "14px"};
`;

function MarkdownEditor({
  title,
  content,
  onChange,
  onTitleChange,
  onSave,
  previewMode = "live",
  onPreviewModeChange,
  isFullscreen = false,
  onFullscreenChange,
}: EditorProps) {
  return (
    <EditorWrapper $fullscreen={isFullscreen}>
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Toolbar>
        <span>Markdown 编辑器</span>
      </Toolbar>

      <div style={{ flex: 1, overflow: "hidden" }}>
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
            commands.divider,
            commands.fullscreen,
          ]}
          extraCommands={[
            commands.codeEdit,
            commands.codePreview,
            commands.divider,
            commands.help,
          ]}
        />
      </div>
    </EditorWrapper>
  );
}

export default MarkdownEditor;

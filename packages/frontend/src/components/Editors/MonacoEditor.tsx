import Editor from "@monaco-editor/react";
import { useState, useRef, useCallback } from "react";
import * as monaco from "monaco-editor";
import {
  SaveOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space, Divider, Select, Modal, message } from "antd";
import styled from "styled-components";
import type { EditorProps } from "./BaseEditor";
import type { editor } from "monaco-editor";

const EditorWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
`;

const TitleInput = styled.input`
  border: none;
  font-size: 24px;
  font-weight: 600;
  padding: 12px 16px;
  background: transparent;
  color: var(--text-primary);
  width: 100%;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
`;

const EditorContainer = styled.div<{ $isFullscreen: boolean }>`
  flex: 1;
  overflow: hidden;
  position: relative;

  ${(props) =>
    props.$isFullscreen &&
    `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: var(--bg-primary);
  `}
`;

const SettingsContent = styled.div`
  padding: 16px;

  .setting-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }
`;

interface MonacoSettings {
  language: string;
  theme: string;
  fontSize: number;
  minimap: boolean;
  lineNumbers: string;
  wordWrap: string;
}

const DEFAULT_SETTINGS: MonacoSettings = {
  language: "typescript",
  theme: "vs-dark",
  fontSize: 14,
  minimap: true,
  lineNumbers: "on",
  wordWrap: "off",
};

function MonacoEditor({
  title,
  content,
  metadata,
  onChange,
  onTitleChange,
  onSave,
  onDownload,
  isFullscreen = false,
  onFullscreenChange,
}: EditorProps) {
  // 从 metadata 中读取语言设置，如果没有则使用默认值
  const initialSettings: MonacoSettings = {
    ...DEFAULT_SETTINGS,
    language: metadata?.monacoLanguage || DEFAULT_SETTINGS.language,
    theme: metadata?.monacoTheme || DEFAULT_SETTINGS.theme,
    fontSize: metadata?.monacoFontSize || DEFAULT_SETTINGS.fontSize,
    minimap: metadata?.monacoMinimap ?? DEFAULT_SETTINGS.minimap,
    lineNumbers: metadata?.monacoLineNumbers || DEFAULT_SETTINGS.lineNumbers,
    wordWrap: metadata?.monacoWordWrap || DEFAULT_SETTINGS.wordWrap,
  };

  const [settings, setSettings] = useState<MonacoSettings>(initialSettings);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentFullscreen, setCurrentFullscreen] = useState(isFullscreen);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 编辑器挂载
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // 添加快捷键
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          if (onSave) {
            onSave();
            message.success("保存成功");
          }
        },
        "",
      );

      // 添加撤销/重做快捷键
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ,
        () => {
          editor.trigger("", "undo", null);
        },
        "",
      );

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
        () => {
          editor.trigger("", "redo", null);
        },
      );
    },
    [onSave],
  );

  // 内容变化
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      // 将语言设置保存到 metadata 中
      const updatedMetadata = {
        ...metadata,
        monacoLanguage: settings.language,
        monacoTheme: settings.theme,
        monacoFontSize: settings.fontSize,
        monacoMinimap: settings.minimap,
        monacoLineNumbers: settings.lineNumbers,
        monacoWordWrap: settings.wordWrap,
      };
      onChange(value || "", updatedMetadata);
    },
    [onChange, settings, metadata],
  );

  // 语言变化时也更新 metadata
  const handleLanguageChange = useCallback(
    (language: string) => {
      const newSettings = { ...settings, language };
      setSettings(newSettings);
      const updatedMetadata = {
        ...metadata,
        monacoLanguage: language,
        monacoTheme: settings.theme,
        monacoFontSize: settings.fontSize,
        monacoMinimap: settings.minimap,
        monacoLineNumbers: settings.lineNumbers,
        monacoWordWrap: settings.wordWrap,
      };
      onChange(content, updatedMetadata);
    },
    [settings, metadata, content, onChange],
  );

  // 主题变化时也更新 metadata
  const handleThemeChange = useCallback(
    (theme: string) => {
      const newSettings = { ...settings, theme };
      setSettings(newSettings);
      const updatedMetadata = {
        ...metadata,
        monacoLanguage: settings.language,
        monacoTheme: theme,
        monacoFontSize: settings.fontSize,
        monacoMinimap: settings.minimap,
        monacoLineNumbers: settings.lineNumbers,
        monacoWordWrap: settings.wordWrap,
      };
      onChange(content, updatedMetadata);
    },
    [settings, metadata, content, onChange],
  );

  // 通用设置更新函数
  const handleSettingChange = useCallback(
    (key: keyof MonacoSettings, value: any) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      const updatedMetadata = {
        ...metadata,
        monacoLanguage: newSettings.language,
        monacoTheme: newSettings.theme,
        monacoFontSize: newSettings.fontSize,
        monacoMinimap: newSettings.minimap,
        monacoLineNumbers: newSettings.lineNumbers,
        monacoWordWrap: newSettings.wordWrap,
      };
      onChange(content, updatedMetadata);
    },
    [settings, metadata, content, onChange],
  );

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    const newFullscreen = !currentFullscreen;
    setCurrentFullscreen(newFullscreen);
    if (onFullscreenChange) {
      onFullscreenChange(newFullscreen);
    }
  }, [currentFullscreen, onFullscreenChange]);

  // 下载文件
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(settings.language);
    } else {
      // 默认下载逻辑
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "untitled"}.${getLanguageExtension(
        settings.language,
      )}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("下载成功");
    }
  }, [content, title, settings.language, onDownload]);

  // 撤销
  const handleUndo = useCallback(() => {
    editorRef.current?.trigger("", "undo", null);
  }, []);

  // 重做
  const handleRedo = useCallback(() => {
    editorRef.current?.trigger("", "redo", null);
  }, []);

  // 格式化代码
  const handleFormat = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, []);

  // 获取语言扩展名
  const getLanguageExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      html: "html",
      css: "css",
      json: "json",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rust: "rs",
      php: "php",
      sql: "sql",
      yaml: "yaml",
      xml: "xml",
      markdown: "md",
    };
    return extensions[language] || "txt";
  };

  // 支持的语言
  const languages = [
    { value: "typescript", label: "TypeScript" },
    { value: "javascript", label: "JavaScript" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "sql", label: "SQL" },
    { value: "yaml", label: "YAML" },
    { value: "xml", label: "XML" },
    { value: "markdown", label: "Markdown" },
  ];

  const themes = [
    { value: "vs-dark", label: "Dark" },
    { value: "vs-light", label: "Light" },
    { value: "hc-black", label: "High Contrast" },
  ];

  const lineNumbersOptions = [
    { value: "on", label: "开启" },
    { value: "off", label: "关闭" },
    { value: "relative", label: "相对" },
    { value: "interval", label: "间隔" },
  ];

  const wordWrapOptions = [
    { value: "off", label: "关闭" },
    { value: "on", label: "开启" },
    { value: "wordWrapColumn", label: "按列" },
    { value: "bounded", label: "限制" },
  ];

  return (
    <EditorWrapper>
      {/* 标题输入 */}
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      {/* 工具栏 */}
      <EditorHeader>
        <Toolbar>
          <Space size="small">
            {/* 撤销/重做 */}
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={handleUndo}
              title="撤销 (Ctrl+Z)"
            />
            <Button
              type="text"
              icon={<RedoOutlined />}
              onClick={handleRedo}
              title="重做 (Ctrl+Shift+Z)"
            />

            <Divider type="vertical" />

            {/* 语言选择 */}
            <Select
              value={settings.language}
              onChange={handleLanguageChange}
              style={{ width: 120 }}
              options={languages}
            />

            {/* 主题选择 */}
            <Select
              value={settings.theme}
              onChange={handleThemeChange}
              style={{ width: 100 }}
              options={themes}
            />

            <Divider type="vertical" />

            {/* 功能按钮 */}
            <Button
              type="text"
              onClick={handleFormat}
              title="格式化代码 (Shift+Alt+F)"
            >
              格式化
            </Button>

            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              title="设置"
            />

            <Divider type="vertical" />

            {/* 下载/保存/全屏 */}
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              title="下载"
            />

            {onSave && (
              <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>
                保存 (Ctrl+S)
              </Button>
            )}

            {onFullscreenChange && (
              <Button
                type="text"
                icon={
                  currentFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={toggleFullscreen}
                title={currentFullscreen ? "退出全屏" : "全屏"}
              />
            )}
          </Space>
        </Toolbar>
      </EditorHeader>

      {/* Monaco 编辑器 */}
      <EditorContainer $isFullscreen={currentFullscreen}>
        <Editor
          height="100%"
          language={settings.language}
          value={content}
          theme={settings.theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize,
            minimap: { enabled: settings.minimap },
            lineNumbers: settings.lineNumbers as any,
            wordWrap: settings.wordWrap as any,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            folding: true,
            foldingStrategy: "indentation",
            showFoldingControls: "always",
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
          }}
        />
      </EditorContainer>

      {/* 设置弹窗 */}
      <Modal
        title="编辑器设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={() => setSettingsVisible(false)}
        width={500}
      >
        <SettingsContent>
          <div className="setting-item">
            <label>字体大小: {settings.fontSize}px</label>
            <input
              type="range"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) =>
                handleSettingChange("fontSize", parseInt(e.target.value))
              }
              style={{ width: "100%" }}
            />
          </div>

          <div className="setting-item">
            <label>代码折叠</label>
            <Select
              value={settings.minimap ? "enabled" : "disabled"}
              onChange={(value) =>
                handleSettingChange("minimap", value === "enabled")
              }
              style={{ width: "100%" }}
              options={[
                { value: "enabled", label: "开启" },
                { value: "disabled", label: "关闭" },
              ]}
            />
          </div>

          <div className="setting-item">
            <label>行号</label>
            <Select
              value={settings.lineNumbers}
              onChange={(lineNumbers) =>
                handleSettingChange("lineNumbers", lineNumbers)
              }
              style={{ width: "100%" }}
              options={lineNumbersOptions}
            />
          </div>

          <div className="setting-item">
            <label>自动换行</label>
            <Select
              value={settings.wordWrap}
              onChange={(wordWrap) => handleSettingChange("wordWrap", wordWrap)}
              style={{ width: "100%" }}
              options={wordWrapOptions}
            />
          </div>
        </SettingsContent>
      </Modal>
    </EditorWrapper>
  );
}

export default MonacoEditor;

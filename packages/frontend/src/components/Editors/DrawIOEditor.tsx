import { useEffect, useRef, useState, useCallback } from "react";
import { Spin, Input } from "antd";
import styled from "styled-components";
import { TYPOGRAPHY } from "../../styles/design-tokens";
import type { EditorProps } from "./BaseEditor";

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

// 空白 DrawIO XML 模板
function getEmptyDrawIOXml(): string {
  return `<mxGraphModel dx="1426" dy="750" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`;
}

function DrawIOEditor({
  title,
  content,
  metadata,
  onChange,
  onTitleChange,
  onSave,
}: EditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentXmlRef = useRef<string>("");

  // 使用本地 DrawIO 编辑器
  const DRAWIO_URL = "/drawio/index.html?embed=1&ui=minimal&spin=1&proto=json";

  // 初始化 DrawIO 数据
  const initialXml = metadata?.drawioData || content || getEmptyDrawIOXml();
  currentXmlRef.current = initialXml;

  // 处理来自 DrawIO iframe 的消息
  useEffect(() => {
    let hasInitialized = false;

    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源（本地或 diagrams.net）
      const origin = event.origin;
      if (
        origin !== window.location.origin &&
        origin !== "https://embed.diagrams.net" &&
        origin !== "https://app.diagrams.net"
      ) {
        return;
      }

      let msg: any = event.data;

      // 尝试解析 JSON 字符串
      if (typeof msg === "string") {
        if (msg === "ready") {
          console.log("[DrawIO] Received ready, initializing...");
          hasInitialized = true;
          setIsLoading(false);
          // 发送初始化数据
          setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                action: "load",
                xml: initialXml,
                autosave: true,
                title: title || "未命名",
              }),
              "*",
            );
          }, 100);
          return;
        }
        try {
          msg = JSON.parse(msg);
        } catch {
          return;
        }
      }

      if (!msg || typeof msg !== "object") {
        return;
      }

      console.log("[DrawIO] Event:", msg.event, msg);

      switch (msg.event) {
        case "init":
          console.log("[DrawIO] Init event");
          hasInitialized = true;
          setIsLoading(false);
          // 发送初始化数据
          setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                action: "load",
                xml: initialXml,
                autosave: true,
                title: title || "未命名",
              }),
              "*",
            );
          }, 100);
          break;

        case "load":
          console.log("[DrawIO] Load event");
          setIsLoading(false);
          break;

        case "save":
          console.log("[DrawIO] Save event, XML length:", msg.xml?.length || 0);
          const saveXml = msg.xml || msg.data;
          if (saveXml) {
            currentXmlRef.current = saveXml;
            onChange(saveXml, {
              ...metadata,
              drawioData: saveXml,
            });
            onSave?.();
          }
          break;

        case "autosave":
          console.log("[DrawIO] Autosave event");
          if (msg.xml) {
            currentXmlRef.current = msg.xml;
            onChange(msg.xml, {
              ...metadata,
              drawioData: msg.xml,
            });
          }
          break;

        case "exit":
          console.log("[DrawIO] Exit event");
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // 超时处理：如果 5 秒后没有初始化，强制设置就绪
    const timeoutId = setTimeout(() => {
      if (!hasInitialized) {
        console.warn("[DrawIO] Init timeout, forcing ready");
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutId);
    };
  }, [initialXml, title, metadata, onChange, onSave]);

  // 导出 XML
  const exportXml = useCallback(() => {
    return currentXmlRef.current;
  }, []);

  // 暴露方法供外部调用
  useEffect(() => {
    (iframeRef.current as any)?.__exposeApi?.({ exportXml });
  }, [exportXml]);

  return (
    <EditorContainer>
      {/* 标题输入 */}
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        variant="borderless"
      />

      <Toolbar>
        <span>DrawIO 图表</span>
      </Toolbar>

      <div style={{ flex: 1, position: "relative" }}>
        {isLoading && (
          <LoadingOverlay>
            <Spin size="large" />
            <span>加载编辑器...</span>
          </LoadingOverlay>
        )}
        <iframe
          ref={iframeRef}
          src={DRAWIO_URL}
          title="DrawIO Editor"
          allow="fullscreen"
        />
      </div>
    </EditorContainer>
  );
}

export default DrawIOEditor;

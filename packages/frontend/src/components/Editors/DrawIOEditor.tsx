import { useEffect, useRef, useState, useCallback } from "react";
import { Spin, Input, Button, Tooltip, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import styled from "styled-components";
import type { EditorProps } from "./BaseEditor";
import { useAIStore } from "../../store/aiStore";
import {
  SelectedContent,
  SelectionHelper,
  DrawIOElementData,
} from "../../types/selection";

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
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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
  const [selectedElementCount, setSelectedElementCount] = useState(0);
  const currentXmlRef = useRef<string>("");
  const { setSelectedContent } = useAIStore();

  // 使用本地 DrawIO 编辑器，设置语言为简体中文
  const DRAWIO_URL =
    "/drawio/index.html?embed=1&ui=minimal&spin=1&proto=json&lang=zh";

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

        // 处理选择变化
        case "select":
          const selectedCount = msg.cells?.length || 0;
          setSelectedElementCount(selectedCount);
          console.log("[DrawIO] Selected elements:", selectedCount);
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

  // 发送选中元素到 AI 助手
  const handleSendToAI = useCallback(() => {
    if (!iframeRef.current) {
      message.warning("DrawIO 编辑器未加载");
      return;
    }

    // 请求 DrawIO 返回选中的元素
    const requestId = `get_selected_${Date.now()}`;
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        action: "getSelected",
        requestId,
      }),
      "*",
    );

    // 设置一次性监听器来接收响应
    const handleResponse = (event: MessageEvent) => {
      const msg = event.data;
      if (typeof msg === "string") {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.requestId === requestId) {
            // 处理返回的选中元素
            const elements = parsed.elements || [];
            if (elements.length === 0) {
              message.warning("请先选中元素");
              return;
            }

            // 提取元素数据
            const elementDataList: DrawIOElementData[] = elements.map(
              (el: any) => ({
                id: el.id,
                label: el.value || el.label || "",
                type: el.style?.baseTypeName || "未知",
                style: el.style,
              }),
            );

            // 生成格式化文本
            const formattedText =
              SelectionHelper.formatDrawIOElements(elementDataList);

            // 构建选择内容
            const content: SelectedContent = {
              type: "drawio_elements",
              source: "drawio",
              text: formattedText,
              raw: elementDataList,
              metadata: {
                count: elementDataList.length,
                hasStructure: false,
                timestamp: Date.now(),
              },
            };

            // 更新 AI Store
            setSelectedContent(content);
            message.success(
              `已将 ${elementDataList.length} 个元素添加到 AI 助手`,
            );

            // 移除监听器
            window.removeEventListener("message", handleResponse);
          }
        } catch (e) {
          console.error("[DrawIO] Failed to parse response:", e);
        }
      }
    };

    // 添加临时监听器
    window.addEventListener("message", handleResponse);

    // 10 秒后自动移除监听器
    setTimeout(() => {
      window.removeEventListener("message", handleResponse);
    }, 10000);
  }, [setSelectedContent, message]);

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

      {/* 工具栏 */}
      <Toolbar>
        <Tooltip
          title={`发送选中元素到 AI 助手 ${selectedElementCount > 0 ? `(${selectedElementCount} 个元素)` : ""}`}
        >
          <Button
            type={selectedElementCount > 0 ? "primary" : "default"}
            icon={<SendOutlined />}
            onClick={handleSendToAI}
            size="small"
            disabled={selectedElementCount === 0 || isLoading}
          >
            {selectedElementCount > 0
              ? `发送 ${selectedElementCount} 个元素`
              : "发送到 AI 助手"}
          </Button>
        </Tooltip>
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

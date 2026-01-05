import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Spin, Input, Button, Tooltip, Modal, App } from "antd";
import type { EditorProps } from "./BaseEditor";
import { SendOutlined, ImportOutlined, CopyOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useAIStore } from "../../store/aiStore";
import { DrawIOElementData } from "../../types/selection";
import { extractDrawIONodes } from "../../lib/api/drawioContextBuilder";

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

const DrawIOEditor = forwardRef<any, EditorProps>(function DrawIOEditor(
  {
    title,
    content,
    metadata,
    onChange,
    onTitleChange,
    onSave,
    onExportImage,
  }: EditorProps,
  ref: any,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedElementCount, setSelectedElementCount] = useState(0);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importXmlText, setImportXmlText] = useState("");
  const currentXmlRef = useRef<string>("");
  const isExportingRef = useRef(false); // 防止并发导出
  const { message } = App.useApp();
  const {
    sendDrawioToAI,
    importDrawioFromClipboard,
    setCurrentAssistant,
    assistants,
  } = useAIStore();

  // 使用本地 DrawIO 编辑器，设置语言为简体中文
  const DRAWIO_URL = "/drawio/index.html?embed=1&ui=minimal&proto=json&lang=zh";

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
  const handleSendToAI = useCallback(async () => {
    if (!iframeRef.current) {
      message.warning("DrawIO 编辑器未加载");
      return;
    }

    const currentXml = currentXmlRef.current;

    // 提取所有节点信息
    const allNodes = extractDrawIONodes(currentXml);

    // 过滤出选中的节点（这里简化处理，发送所有节点）
    // DrawIO API 限制较多，我们发送完整数据让 AI 分析
    try {
      await sendDrawioToAI(currentXml, allNodes);
      message.success(`已将图表数据发送到 AI 助手 (${allNodes.length} 个元素)`);
    } catch (error) {
      console.error("[DrawIO] 发送到 AI 失败:", error);
      message.error("发送失败");
    }
  }, [sendDrawioToAI, message]);

  // 从 AI 助手导入
  const handleImportFromAI = useCallback(() => {
    const result = importDrawioFromClipboard();

    if (!result.success) {
      message.error(result.error || "导入失败");
      return;
    }

    if (!result.data) {
      message.error("没有可导入的数据");
      return;
    }

    // 更新 DrawIO 图表
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          action: "load",
          xml: result.data,
          autosave: true,
        }),
        "*",
      );

      // 保存到笔记
      onChange(result.data, {
        ...metadata,
        drawioData: result.data,
      });

      message.success("已从 AI 助手导入 DrawIO 图表");
    }
  }, [importDrawioFromClipboard, onChange, metadata]);

  // 从剪贴板导入
  const handleImportFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        message.warning("剪贴板为空");
        return;
      }

      // 检查是否包含 DrawIO XML
      if (!clipboardText.includes("<mxGraphModel")) {
        message.error("剪贴板内容不是有效的 DrawIO XML");
        return;
      }

      // 提取 XML
      const xmlMatch = clipboardText.match(
        /<mxGraphModel[\s\S]*?<\/mxGraphModel>/,
      );
      if (!xmlMatch) {
        message.error("无法提取 DrawIO XML");
        return;
      }

      const newXml = xmlMatch[0];

      // 更新 DrawIO 图表
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            action: "load",
            xml: newXml,
            autosave: true,
          }),
          "*",
        );

        // 保存到笔记
        onChange(newXml, {
          ...metadata,
          drawioData: newXml,
        });

        message.success("已从剪贴板导入 DrawIO 图表");
      }
    } catch (error) {
      console.error("[DrawIO] 从剪贴板导入失败:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        message.error("无法访问剪贴板，请授予权限");
      } else {
        message.error("导入失败");
      }
    }
  };

  // 手动输入 XML 导入
  const handleManualImport = () => {
    if (!importXmlText.trim()) {
      message.warning("请输入 DrawIO XML");
      return;
    }

    if (!importXmlText.includes("<mxGraphModel")) {
      message.error("不是有效的 DrawIO XML");
      return;
    }

    // 更新 DrawIO 图表
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          action: "load",
          xml: importXmlText,
          autosave: true,
        }),
        "*",
      );

      // 保存到笔记
      onChange(importXmlText, {
        ...metadata,
        drawioData: importXmlText,
      });

      setImportModalVisible(false);
      setImportXmlText("");
      message.success("导入成功");
    }
  };

  // 导出 XML（文本）
  const exportXml = useCallback(() => {
    return currentXmlRef.current;
  }, []);

  // 导出图片
  const exportImage = useCallback(() => {
    console.log("[DrawIO] 导出函数被调用");
    return new Promise<void>((resolve, reject) => {
      // 防止并发导出
      if (isExportingRef.current) {
        console.warn("[DrawIO] 导出正在进行中，忽略重复请求");
        reject(new Error("导出正在进行中"));
        return;
      }

      try {
        if (!iframeRef.current) {
          message.error("编辑器未初始化");
          reject(new Error("编辑器未初始化"));
          return;
        }

        isExportingRef.current = true;

        // 发送消息给 DrawIO iframe 请求导出 PNG，设置白色背景
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            action: "export",
            format: "png",
            bg: "#ffffff", // 设置白色背景
          }),
          "*",
        );

        message.info("正在生成图片，请稍候...");

        // 监听一次性的导出响应
        const handleExportResponse = (event: MessageEvent) => {
          const origin = event.origin;
          if (
            origin !== window.location.origin &&
            origin !== "https://embed.diagrams.net" &&
            origin !== "https://app.diagrams.net"
          ) {
            return;
          }

          let responseMsg: any = event.data;
          if (typeof responseMsg === "string") {
            try {
              responseMsg = JSON.parse(responseMsg);
            } catch {
              return;
            }
          }

          // 处理导出响应
          if (
            responseMsg &&
            responseMsg.event === "export" &&
            responseMsg.format === "png" &&
            responseMsg.data
          ) {
            console.log("[DrawIO] 收到导出响应，开始处理");
            // 移除监听器
            window.removeEventListener("message", handleExportResponse);
            isExportingRef.current = false;

            // 处理 base64 数据
            const base64Data = responseMsg.data.includes(",")
              ? responseMsg.data.split(",")[1]
              : responseMsg.data;

            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: "image/png" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title || "DrawIO图表"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            message.success("已导出为 PNG 图片");
            resolve();
          }
        };

        // 设置超时
        const timeoutId = setTimeout(() => {
          window.removeEventListener("message", handleExportResponse);
          isExportingRef.current = false;
          reject(new Error("导出超时"));
        }, 30000);

        // 添加临时监听器
        window.addEventListener("message", handleExportResponse);
      } catch (error: any) {
        isExportingRef.current = false;
        console.error("导出图片失败:", error);
        message.error("导出图片失败: " + error.message);
        reject(error);
      }
    });
  }, [title, message]);

  // 暴露方法供外部调用
  useImperativeHandle(ref, () => ({
    exportXml,
    exportImage,
  }));

  // 自动切换到 DrawIO 助手
  useEffect(() => {
    const drawioAssistant = assistants.find((a) => a.id === "drawio");
    if (drawioAssistant) {
      setCurrentAssistant(drawioAssistant);
      console.log("[DrawIOEditor] 已切换到 DrawIO 绘图助手");
    }
  }, [assistants, setCurrentAssistant]);

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
        {/* 发送到 AI 助手 */}
        <Tooltip
          title={`发送图表数据到 AI 助手 ${selectedElementCount > 0 ? `(${selectedElementCount} 个元素)` : ""}`}
        >
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendToAI}
            size="small"
            disabled={isLoading}
          />
        </Tooltip>

        {/* 从 AI 导入 */}
        <Tooltip title="从 AI 助手导入">
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={handleImportFromAI}
            size="small"
            disabled={isLoading}
          />
        </Tooltip>

        {/* 从剪贴板导入 */}
        <Tooltip title="从系统剪贴板导入(支持手工复制)">
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleImportFromClipboard}
            size="small"
            disabled={isLoading}
          />
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

      {/* 手动导入弹窗 */}
      <Modal
        title="导入 DrawIO XML"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={handleManualImport}
        okText="导入"
        width={600}
      >
        <Input.TextArea
          placeholder="粘贴 DrawIO XML (从 <mxGraphModel> 到 </mxGraphModel>)"
          value={importXmlText}
          onChange={(e) => setImportXmlText(e.target.value)}
          autoSize={{ minRows: 10, maxRows: 20 }}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
        <div
          style={{ marginTop: 8, fontSize: 12, color: "var(--text-tertiary)" }}
        >
          提示：可以从其他 DrawIO 图表中复制 XML，然后在这里粘贴导入
        </div>
      </Modal>
    </EditorContainer>
  );
});

DrawIOEditor.displayName = "DrawIOEditor";

export default DrawIOEditor;

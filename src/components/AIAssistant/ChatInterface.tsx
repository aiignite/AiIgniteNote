import { useState, useRef, useEffect } from "react";
import { Input, Button, Space, Spin, App, Tooltip } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useAIStore } from "../../store/aiStore";
import { useModelStore } from "../../store/modelStore";
import styled from "styled-components";
import MarkdownRenderer from "./MarkdownRenderer";

const { TextArea } = Input;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  gap: 8px;
`;

const MessageAvatar = styled.div<{ $isUser: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$isUser ? "#1890ff" : "var(--bg-tertiary)")};
  color: ${(props) => (props.$isUser ? "#fff" : "var(--text-secondary)")};
  flex-shrink: 0;
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${(props) => (props.$isUser ? "#1890ff" : "var(--bg-tertiary)")};
  color: ${(props) => (props.$isUser ? "#fff" : "var(--text-primary)")};
  word-wrap: break-word;
  line-height: 1.5;
  position: relative;

  /* Markdown 内容样式 */
  & > * {
    margin: 0;
  }

  /* 用户消息不需要 Markdown 样式 */
  ${(props) =>
    props.$isUser
      ? ""
      : `
    /* 代码块特殊样式 */
    pre {
      background: rgba(0, 0, 0, 0.04);
      border-radius: 6px;
      padding: 10px;
      overflow-x: auto;
      margin: 8px 0;

      code {
        background: transparent;
        padding: 0;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.85em;
        color: rgba(0, 0, 0, 0.85);
      }
    }

    code {
      background: rgba(0, 0, 0, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.9em;
    }

    p {
      margin: 4px 0;
    }

    ul, ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    li {
      margin: 4px 0;
    }

    a {
      color: #1890ff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  `}
`;

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
`;

const MessageActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${MessageWrapper}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(Button)`
  padding: 2px 8px;
  height: 24px;
  font-size: 12px;
`;

// 复制消息组件
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <Tooltip title={copied ? "已复制" : "复制"}>
      <ActionButton
        size="small"
        type="text"
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={handleCopy}
      />
    </Tooltip>
  );
}

function ChatInterface() {
  const { message } = App.useApp();
  const { currentConversation, sendMessage, isStreaming, currentResponse } =
    useAIStore();
  const { currentConfig } = useModelStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, currentResponse]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      message.warning("请输入消息");
      return;
    }

    if (!currentConfig?.apiKey) {
      message.error("请先配置API密钥");
      return;
    }

    if (!currentConversation) {
      message.error("请先创建对话");
      return;
    }

    const messageToSend = inputValue.trim();
    setInputValue("");

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await sendMessage(
        currentConversation.id,
        messageToSend,
        undefined,
        controller.signal,
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        message.error("发送失败");
      }
    } finally {
      setAbortController(null);
    }
  };

  // 停止生成
  const handleStop = () => {
    abortController?.abort();
    setAbortController(null);
  };

  // 清空输入
  const handleClear = () => {
    setInputValue("");
  };

  // 渲染消息内容（支持 Markdown）
  const renderMessageContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return content;
    }
    return <MarkdownRenderer content={content} />;
  };

  return (
    <ChatContainer>
      {/* 消息列表 */}
      <MessagesContainer>
        {currentConversation?.messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 16,
              color: "var(--text-secondary)",
            }}
          >
            <RobotOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
              开始与AI助手对话
            </p>
            <p style={{ fontSize: 13, margin: 0, textAlign: "center" }}>
              我可以帮你生成内容、改写润色、提取摘要等
            </p>
          </div>
        ) : (
          <>
            {currentConversation?.messages.map((msg) => (
              <div key={msg.id}>
                <MessageWrapper $isUser={msg.role === "user"}>
                  {msg.role === "assistant" && (
                    <MessageAvatar $isUser={false}>
                      <RobotOutlined />
                    </MessageAvatar>
                  )}
                  <MessageContent $isUser={msg.role === "user"}>
                    {renderMessageContent(msg.content, msg.role === "user")}
                  </MessageContent>
                  {msg.role === "user" && (
                    <MessageAvatar $isUser={true}>
                      <UserOutlined />
                    </MessageAvatar>
                  )}
                </MessageWrapper>
                {msg.role === "assistant" && (
                  <div style={{ paddingLeft: 48 }}>
                    <MessageActions>
                      <CopyButton content={msg.content} />
                    </MessageActions>
                  </div>
                )}
              </div>
            ))}

            {/* 流式响应 */}
            {isStreaming && currentResponse && (
              <>
                <MessageWrapper $isUser={false}>
                  <MessageAvatar $isUser={false}>
                    <RobotOutlined />
                  </MessageAvatar>
                  <MessageContent $isUser={false}>
                    <MarkdownRenderer content={currentResponse} />
                    <Spin size="small" style={{ marginLeft: 8 }} />
                  </MessageContent>
                </MessageWrapper>
              </>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      {/* 输入区域 */}
      <InputContainer>
        <TextArea
          placeholder="输入消息... (回车发送，Ctrl+Enter换行)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={(e) => {
            // 回车发送，Ctrl+Enter 换行
            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ resize: "none", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {isStreaming ? (
            <Button danger icon={<StopOutlined />} onClick={handleStop}>
              停止生成
            </Button>
          ) : (
            <>
              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                disabled={!inputValue}
              >
                清空
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                发送
              </Button>
            </>
          )}
        </div>
      </InputContainer>
    </ChatContainer>
  );
}

export default ChatInterface;

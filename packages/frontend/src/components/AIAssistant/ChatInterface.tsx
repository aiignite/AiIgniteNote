import { useState, useRef, useEffect } from "react";
import { Input, Button, App, Tooltip } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  CheckOutlined,
  StopOutlined,
  ThunderboltOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useAIStore } from "../../store/aiStore";
import styled, { keyframes, css } from "styled-components";
import MarkdownRenderer from "./MarkdownRenderer";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
} from "../../styles/design-tokens";

const { TextArea } = Input;

// ============================================
// 动画
// ============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

// ============================================
// Styled Components
// ============================================

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${COLORS.paper};
`;

const ChatHeader = styled.div`
  padding: ${SPACING.md} ${SPACING.lg};
  border-bottom: 1px solid ${COLORS.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${COLORS.paper};
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

const ChatIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.ink};
  color: ${COLORS.paper};
  border-radius: ${BORDER.radius.md};
  font-size: ${TYPOGRAPHY.fontSize.md};
`;

const ChatName = styled.div`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.lg};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.lg};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 2px;

    &:hover {
      background: ${COLORS.inkMuted};
    }
  }
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  gap: ${SPACING.sm};
  animation: ${fadeInUp} 0.3s ease-out;
`;

const MessageAvatar = styled.div<{ $isUser: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${TYPOGRAPHY.fontSize.sm};
  flex-shrink: 0;
  background: ${(props) =>
    props.$isUser ? COLORS.userBubble : COLORS.aiBubble};
  color: ${(props) => (props.$isUser ? COLORS.paper : COLORS.aiPrimary)};
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: ${SPACING.sm} ${SPACING.md};
  border-radius: ${BORDER.radius.md};
  background: ${(props) =>
    props.$isUser ? COLORS.userBubble : COLORS.aiBubble};
  color: ${(props) => (props.$isUser ? COLORS.paper : COLORS.ink)};
  word-wrap: break-word;
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  position: relative;
  font-size: ${TYPOGRAPHY.fontSize.sm};

  ${(props) =>
    !props.$isUser &&
    css`
      border-top-left-radius: 2px;
    `}

  ${(props) =>
    props.$isUser &&
    css`
      border-top-right-radius: 2px;
    `}
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  /* Markdown 内容样式 */
  & > * {
    margin: 0;
  }

  ${(props) =>
    !props.$isUser &&
    css`
      /* 代码块特殊样式 */
      pre {
        background: ${COLORS.paperDark};
        border-radius: ${BORDER.radius.sm};
        padding: ${SPACING.sm};
        overflow-x: auto;
        margin: ${SPACING.sm} 0;
        border: 1px solid ${COLORS.subtle};

        code {
          background: transparent;
          padding: 0;
          font-family: ${TYPOGRAPHY.fontFamily.mono};
          font-size: 0.85em;
          color: ${COLORS.ink};
        }
      }

      code {
        background: ${COLORS.subtleLight};
        padding: 2px 6px;
        border-radius: ${BORDER.radius.sm};
        font-family: ${TYPOGRAPHY.fontFamily.mono};
        font-size: 0.9em;
        color: ${COLORS.accent};
      }

      p {
        margin: 4px 0;
      }

      ul,
      ol {
        margin: 8px 0;
        padding-left: 20px;
      }

      li {
        margin: 4px 0;
      }

      a {
        color: ${COLORS.accent};
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      strong {
        font-weight: ${TYPOGRAPHY.fontWeight.semibold};
        color: ${COLORS.ink};
      }

      blockquote {
        border-left: 2px solid ${COLORS.accent};
        padding-left: ${SPACING.sm};
        margin: ${SPACING.sm} 0;
        color: ${COLORS.inkLight};
        font-style: italic;
      }
    `}
`;

const InputContainer = styled.div`
  padding: ${SPACING.md} ${SPACING.lg};
  border-top: 1px solid ${COLORS.subtle};
  background: ${COLORS.paper};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
`;

const InputWrapper = styled.div`
  position: relative;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  overflow: hidden;
  transition: border-color ${TRANSITION.fast};

  &:focus-within {
    border-color: ${COLORS.ink};
  }
`;

const StyledTextArea = styled(TextArea)`
  border: none !important;
  box-shadow: none !important;
  resize: none;
  padding: ${SPACING.sm} ${SPACING.md};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  color: ${COLORS.ink};

  &::placeholder {
    color: ${COLORS.inkMuted};
    font-style: italic;
  }

  &:focus {
    box-shadow: none !important;
  }
`;

const InputActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${SPACING.xs};
`;

const SelectedTextIndicator = styled.div`
  padding: ${SPACING.xs} ${SPACING.md};
  background: ${COLORS.accent}15;
  border: 1px solid ${COLORS.accent}40;
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.accent};
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};

  .selected-text-preview {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.8;
  }

  .clear-selection {
    cursor: pointer;
    padding: 2px 6px;
    border-radius: ${BORDER.radius.sm};
    transition: background ${TRANSITION.fast};

    &:hover {
      background: ${COLORS.accent}30;
    }
  }
`;

const InputButton = styled(Button)<{ $variant?: "primary" | "default" }>`
  height: 28px;
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  transition: all ${TRANSITION.fast};

  ${(props) =>
    props.$variant === "primary"
      ? css`
          &&& {
            background: ${COLORS.ink};
            border-color: ${COLORS.ink};
            color: ${COLORS.paper};

            &:hover:not(:disabled) {
              background: ${COLORS.accent};
              border-color: ${COLORS.accent};
            }

            &.ant-btn-dangerous {
              background: transparent !important;
              border-color: #ff4d4f !important;
              color: #ff4d4f !important;

              &:hover:not(:disabled) {
                background: #ff4d4f !important;
                border-color: #ff4d4f !important;
                color: white !important;
              }
            }
          }
        `
      : css`
          &&& {
            border-color: ${COLORS.subtle};
            color: ${COLORS.inkMuted};

            &:hover:not(:disabled) {
              border-color: ${COLORS.ink};
              color: ${COLORS.ink};
            }
          }
        `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.md};
  padding: ${SPACING.xl};
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.aiBubble};
  border-radius: 50%;
  font-size: 24px;
  color: ${COLORS.aiPrimary};
`;

const EmptyTitle = styled.p`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin: 0;
`;

const EmptyDescription = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkMuted};
  margin: 0;
  max-width: 200px;
`;

const SuggestionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.xs};
  justify-content: center;
  margin-top: ${SPACING.md};
`;

const SuggestionChip = styled.button`
  padding: ${SPACING.xs} ${SPACING.md};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.full};
  background: transparent;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkLight};
  cursor: pointer;
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
    background: ${COLORS.accent}10;
  }
`;

const MessageActions = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.xs};
  opacity: 0;
  transition: opacity ${TRANSITION.fast};

  ${MessageWrapper}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(Button)`
  padding: 2px 8px;
  height: 24px;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
  border: none;

  &:hover {
    color: ${COLORS.ink};
    background: ${COLORS.subtleLight};
  }
`;

const StreamingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
`;

const StreamingDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${COLORS.accent};
  animation: ${pulse} 1s ease-in-out infinite;
`;

// ============================================
// Sub Components
// ============================================

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

const suggestions = [
  "帮我润色这段文字",
  "生成一份大纲",
  "总结主要内容",
  "扩展这个观点",
];

// ============================================
// Main Component
// ============================================

function ChatInterface() {
  const { message } = App.useApp();
  const {
    currentConversation,
    sendMessage,
    isStreaming,
    currentResponse,
    selectedText,
    setSelectedText,
  } = useAIStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 获取当前选中的文本
  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString().trim() || "";
  };

  // 监听文本选择变化
  useEffect(() => {
    const handleSelectionChange = () => {
      const text = getSelectedText();
      console.log("ChatInterface selectionchange:", {
        text: text.substring(0, 50),
        selection: window.getSelection()?.toString().substring(0, 50),
      });
      setSelectedText(text);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

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

    if (!currentConversation) {
      message.error("请先创建对话");
      return;
    }

    // 获取当前选中的文本
    const currentSelectedText = getSelectedText();

    // 构建消息内容
    let messageToSend = inputValue.trim();

    // 如果有选中文本，将选中文本附加到消息中
    if (currentSelectedText) {
      messageToSend = `${inputValue.trim()}\n\n选中的内容：\n${currentSelectedText}`;
      // 清除选择
      window.getSelection()?.removeAllRanges();
    }

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
        message.error("发送失败: " + (error as Error).message);
      }
    } finally {
      setAbortController(null);
    }
  };

  // 应用建议
  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
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

  // 清除文本选择
  const handleClearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectedText("");
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
          <EmptyState>
            <EmptyIcon>
              <BulbOutlined />
            </EmptyIcon>
            <EmptyTitle>有什么可以帮你的？</EmptyTitle>
            <EmptyDescription>
              我可以帮你生成内容、改写润色、提取摘要等
            </EmptyDescription>
            <SuggestionChips>
              {suggestions.map((suggestion) => (
                <SuggestionChip
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </SuggestionChip>
              ))}
            </SuggestionChips>
          </EmptyState>
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
                  <div>
                    <MessageBubble $isUser={msg.role === "user"}>
                      <MessageContent $isUser={msg.role === "user"}>
                        {renderMessageContent(msg.content, msg.role === "user")}
                      </MessageContent>
                    </MessageBubble>
                    {msg.role === "assistant" && (
                      <MessageActions>
                        <CopyButton content={msg.content} />
                      </MessageActions>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <MessageAvatar $isUser={true}>
                      <UserOutlined />
                    </MessageAvatar>
                  )}
                </MessageWrapper>
              </div>
            ))}

            {/* 流式响应 */}
            {isStreaming && currentResponse && (
              <>
                <MessageWrapper $isUser={false}>
                  <MessageAvatar $isUser={false}>
                    <RobotOutlined />
                  </MessageAvatar>
                  <div>
                    <MessageBubble $isUser={false}>
                      <MessageContent $isUser={false}>
                        <MarkdownRenderer content={currentResponse} />
                      </MessageContent>
                    </MessageBubble>
                    <StreamingIndicator>
                      <StreamingDot />
                      正在生成...
                    </StreamingIndicator>
                  </div>
                </MessageWrapper>
              </>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      {/* 输入区域 */}
      <InputContainer>
        {/* 选中文本提示 */}
        {selectedText && (
          <SelectedTextIndicator>
            <span>已选择文档内容，点击发送将包含选中文本</span>
            <span className="clear-selection" onClick={handleClearSelection}>
              清除选择
            </span>
          </SelectedTextIndicator>
        )}
        <InputWrapper>
          <StyledTextArea
            placeholder="输入消息... (回车发送，Shift+Enter换行)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            autoSize={{ minRows: 2, maxRows: 2 }}
          />
        </InputWrapper>
        <InputActions>
          {isStreaming ? (
            <InputButton
              $variant="primary"
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              停止生成
            </InputButton>
          ) : (
            <>
              <InputButton
                icon={<ClearOutlined />}
                onClick={handleClear}
                disabled={!inputValue}
              >
                清空
              </InputButton>
              <InputButton
                $variant="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                发送
              </InputButton>
            </>
          )}
        </InputActions>
      </InputContainer>
    </ChatContainer>
  );
}

export default ChatInterface;

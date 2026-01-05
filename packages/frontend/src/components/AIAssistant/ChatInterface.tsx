import { useState, useRef, useEffect } from "react";
import { Input, Button, App, Tooltip, Select, Divider } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  CopyOutlined,
  CheckOutlined,
  StopOutlined,
  PlusOutlined,
  EllipsisOutlined,
  CloseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAIStore } from "../../store/aiStore";
import { AIConversation } from "../../types";
import styled, { keyframes, css } from "styled-components";
import MarkdownRenderer from "./MarkdownRenderer";
import AssistantEditModal, { AIAssistant } from "./AssistantEditModal";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
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

// 助手选择器样式
const AssistantSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${SPACING.sm};
  position: relative;
  width: 100%;
`;

const SelectorLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  flex: 1;
`;

const SelectorRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  position: relative;
`;

const IconButton = styled(Button)`
  border: none;
  background: transparent;
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.md};
  padding: 4px;
  height: auto;
  width: 32px;

  &:hover {
    color: ${COLORS.accent};
    background: ${COLORS.subtleLight};
  }
`;

const HistoryPanel = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  max-height: 400px;
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  box-shadow: ${SHADOW.lg};
  margin-top: ${SPACING.xs};
  z-index: 1000;
  display: ${(props) => (props.$visible ? "flex" : "none")};
  flex-direction: column;
  animation: ${fadeInUp} 0.2s ease-out;
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.sm} ${SPACING.md};
  border-bottom: 1px solid ${COLORS.subtle};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.ink};
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.xs};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 2px;
  }
`;

const HistoryItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm} ${SPACING.md};
  border-radius: ${BORDER.radius.sm};
  cursor: pointer;
  transition: all ${TRANSITION.fast};
  background: ${(props) =>
    props.$active ? COLORS.subtleLight : "transparent"};

  &:hover {
    background: ${COLORS.subtleLight};
  }
`;

const HistoryItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const HistoryItemTitle = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryItemMeta = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
`;

const EmptyHistory = styled.div`
  padding: ${SPACING.xl};
  text-align: center;
  color: ${COLORS.inkMuted};
  font-size: ${TYPOGRAPHY.fontSize.sm};
`;

const AssistantAvatar = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.lg};
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-color: ${COLORS.subtle} !important;
    border-radius: ${BORDER.radius.sm} !important;

    &:hover {
      border-color: ${COLORS.inkLight} !important;
    }
  }

  &.ant-select-focused .ant-select-selector {
    border-color: ${COLORS.ink} !important;
    box-shadow: none !important;
  }
`;

const AssistantOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${SPACING.sm};
  width: 100%;

  .assistant-left {
    display: flex;
    align-items: center;
    gap: ${SPACING.sm};
    flex: 1;
    min-width: 0;
  }

  .assistant-avatar {
    font-size: ${TYPOGRAPHY.fontSize.md};
  }

  .assistant-info {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .assistant-name {
      font-size: ${TYPOGRAPHY.fontSize.sm};
      font-weight: ${TYPOGRAPHY.fontWeight.medium};
      color: ${COLORS.ink};
    }

    .assistant-desc {
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
    }
  }

  .assistant-detail-btn {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity ${TRANSITION.fast};
  }

  &:hover .assistant-detail-btn {
    opacity: 1;
  }
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
  & > * {
    margin: 0;
  }

  ${(props) =>
    !props.$isUser &&
    css`
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
  overflow-y: auto;

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

// 菜单操作项样式
const ActionItem = styled.div<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm} ${SPACING.md};
  cursor: pointer;
  transition: all ${TRANSITION.fast};
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.sm};

  &:hover {
    color: ${COLORS.ink};
    background: ${COLORS.subtleLight};
  }

  ${(props) =>
    props.$danger &&
    `
    &:hover {
      color: ${COLORS.error};
      background: ${COLORS.error}15;
    }
  `}
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

// 助手选择下拉组件
function AssistantSelect({ noteId }: { noteId?: string }) {
  const navigate = useNavigate();
  const {
    currentAssistant,
    setCurrentAssistant,
    assistants,
    createConversation,
    conversations,
    setCurrentConversation,
    loadConversations,
    clearConversations,
  } = useAIStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<AIAssistant | null>(
    null,
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleChange = (value: unknown) => {
    const assistantId = value as string;
    const selected = assistants.find((a) => a.id === assistantId);
    if (selected) {
      setCurrentAssistant(selected);
    }
  };

  const handleNewChat = async () => {
    await createConversation(effectiveNoteId);
    setMenuVisible(false);
  };

  const handleSelectConversation = (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    setMenuVisible(false);
  };

  const handleClearHistory = async () => {
    await clearConversations();
    setMenuVisible(false);
  };

  // 查看助手详情（打开编辑弹窗）
  const handleViewDetail = (e: React.MouseEvent, assistantId: string) => {
    e.stopPropagation();
    const assistant = assistants.find((a) => a.id === assistantId);
    if (assistant) {
      setEditingAssistant(assistant);
      setEditModalVisible(true);
    }
    setMenuVisible(false);
  };

  // 保存助手后重新加载
  const handleSaveAssistant = async () => {
    setEditModalVisible(false);
    setEditingAssistant(null);
  };

  // 获取最近的对话（最多10条）
  const recentConversations = conversations
    .filter((c) => c.messages.length > 0)
    .slice(0, 10);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <AssistantSelector>
      <SelectorLeft>
        <AssistantAvatar>{currentAssistant.avatar}</AssistantAvatar>
        <StyledSelect
          value={currentAssistant.id}
          onChange={handleChange}
          style={{ width: 260 }}
          optionLabelProp="label"
          styles={{
            popup: {
              root: { minWidth: 360 },
            },
          }}
        >
          {assistants.map((assistant) => (
            <Select.Option
              key={assistant.id}
              value={assistant.id}
              label={assistant.name}
            >
              <AssistantOption>
                <div className="assistant-left">
                  <span className="assistant-avatar">{assistant.avatar}</span>
                  <div className="assistant-info">
                    <span className="assistant-name">{assistant.name}</span>
                    <span className="assistant-desc">
                      {assistant.description}
                    </span>
                  </div>
                </div>
                <Tooltip title="查看详情">
                  <Button
                    type="text"
                    size="small"
                    icon={<InfoCircleOutlined />}
                    className="assistant-detail-btn"
                    onClick={(e) => handleViewDetail(e, assistant.id)}
                    style={{ padding: "4px 8px" }}
                  />
                </Tooltip>
              </AssistantOption>
            </Select.Option>
          ))}
        </StyledSelect>
      </SelectorLeft>
      <SelectorRight>
        <Tooltip title="新建对话">
          <IconButton icon={<PlusOutlined />} onClick={handleNewChat} />
        </Tooltip>
        <Tooltip title="更多">
          <IconButton
            icon={<EllipsisOutlined />}
            onClick={() => setMenuVisible(!menuVisible)}
          />
        </Tooltip>

        {/* 菜单面板 */}
        <HistoryPanel $visible={menuVisible}>
          <ActionItem onClick={handleNewChat}>
            <PlusOutlined />
            <span>新建对话</span>
          </ActionItem>
          <Divider style={{ margin: "4px 0" }} />
          <HistoryHeader>
            <span>最近对话</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setMenuVisible(false)}
            />
          </HistoryHeader>
          <HistoryList>
            {recentConversations.length === 0 ? (
              <EmptyHistory>暂无对话历史</EmptyHistory>
            ) : (
              recentConversations.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  $active={
                    conv.id === conversations.find((c) => c.id === conv.id)?.id
                  }
                  onClick={() => handleSelectConversation(conv)}
                >
                  <HistoryItemContent>
                    <HistoryItemTitle>
                      {conv.messages[conv.messages.length - 1]?.content.slice(
                        0,
                        30,
                      ) || "新对话"}
                      ...
                    </HistoryItemTitle>
                    <HistoryItemMeta>
                      <span>{conv.messages.length} 条消息</span>
                      <span>·</span>
                      <span>{formatTime(conv.updatedAt)}</span>
                    </HistoryItemMeta>
                  </HistoryItemContent>
                </HistoryItem>
              ))
            )}
          </HistoryList>
          <Divider style={{ margin: "4px 0" }} />
          <ActionItem $danger onClick={handleClearHistory}>
            <DeleteOutlined />
            <span>清空历史</span>
          </ActionItem>
        </HistoryPanel>
      </SelectorRight>

      {/* 助手编辑弹窗 - 使用可复用组件 */}
      <AssistantEditModal
        visible={editModalVisible}
        assistant={editingAssistant}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingAssistant(null);
        }}
        onSave={handleSaveAssistant}
      />
    </AssistantSelector>
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

interface ChatInterfaceProps {
  noteId?: string;
}

function ChatInterface({ noteId }: ChatInterfaceProps) {
  const { message } = App.useApp();
  const {
    currentConversation,
    sendMessage,
    isStreaming,
    currentResponse,
    selectedContent,
    setSelectedText,
    clearSelectedContent,
    currentAssistant,
    currentNoteId, // 🔥 从 AI Store 读取 currentNoteId
  } = useAIStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 🔥 优先使用 AI Store 的 currentNoteId，其次使用传入的 noteId（从 URL）
  const effectiveNoteId = currentNoteId || noteId;

  // 添加日志：监听 noteId 的变化
  useEffect(() => {
    console.log("[ChatInterface] noteId from props:", noteId);
    console.log("[ChatInterface] currentNoteId from store:", currentNoteId);
    console.log("[ChatInterface] effectiveNoteId:", effectiveNoteId);
  }, [noteId, currentNoteId, effectiveNoteId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, currentResponse]);

  // 当有选中内容时，自动添加到输入框
  useEffect(() => {
    if (selectedContent && selectedContent.text) {
      // 检查是否不是空选择
      const isEmptySelection =
        !selectedContent.text ||
        selectedContent.text.trim() === "" ||
        selectedContent.type === "empty";

      if (!isEmptySelection) {
        // 构建提示文本
        let prefix = "";
        if (selectedContent.type === "mindmap_nodes") {
          prefix = "[思维导图选中内容]\n";
        } else if (selectedContent.type === "drawio_elements") {
          prefix = "[DrawIO选中内容]\n";
        }

        // 将选中内容添加到输入框
        setInputValue(prefix + selectedContent.text);

        // 清除选中状态，避免重复添加
        clearSelectedContent();
      }
    }
  }, [selectedContent, clearSelectedContent]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      message.warning("请输入消息");
      return;
    }

    // 如果没有当前对话，自动创建一个新对话
    let conversation = currentConversation;
    if (!conversation) {
      console.log(
        "[ChatInterface] 当前没有对话，自动创建新对话，effectiveNoteId:",
        effectiveNoteId,
      );
      conversation = await createConversation(effectiveNoteId);
      console.log(
        "[ChatInterface] 已创建新对话，ID:",
        conversation.id,
        "noteId:",
        conversation.noteId,
      );
    }

    // 如果对话没有 noteId 但当前页面有 noteId，更新对话
    if (!conversation.noteId && effectiveNoteId) {
      console.log("[ChatInterface] 对话没有 noteId，尝试更新");
      // 重新创建一个关联了 noteId 的对话
      conversation = await createConversation(effectiveNoteId);
      console.log(
        "[ChatInterface] 已创建新对话并关联 noteId:",
        effectiveNoteId,
      );
    }

    const messageToSend = inputValue.trim();
    setInputValue("");

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await sendMessage(conversation.id, messageToSend, controller.signal);
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

  // 渲染消息内容（支持 Markdown）
  const renderMessageContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return content;
    }
    return <MarkdownRenderer content={content} />;
  };

  // 根据当前助手生成建议
  const getSuggestions = () => {
    switch (currentAssistant.id) {
      case "translator":
        return ["翻译成英文", "翻译成中文", "翻译成日文"];
      case "writer":
        return ["润色这段文字", "改写得更简洁", "调整语气更正式"];
      case "coder":
        return ["解释这段代码", "优化代码性能", "添加注释"];
      case "summarizer":
        return ["总结要点", "提取关键词", "生成摘要"];
      default:
        return suggestions;
    }
  };

  return (
    <ChatContainer>
      {/* 助手选择器 */}
      <InputContainer
        style={{
          padding: "8px 16px",
          borderBottom: `1px solid ${COLORS.subtle}`,
        }}
      >
        <AssistantSelect noteId={effectiveNoteId} />
      </InputContainer>

      {/* 消息列表 */}
      <MessagesContainer>
        {currentConversation?.messages.length === 0 ? (
          <EmptyState>
            <EmptyIcon>{currentAssistant.avatar}</EmptyIcon>
            <EmptyTitle>我是 {currentAssistant.name}</EmptyTitle>
            <EmptyDescription>{currentAssistant.description}</EmptyDescription>
            <SuggestionChips>
              {getSuggestions().map((suggestion) => (
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
        <InputWrapper>
          <StyledTextArea
            placeholder={`与${currentAssistant.name}对话... (回车发送，Shift+Enter换行)`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            autoSize={{
              minRows: 2,
              maxRows: 10,
            }}
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

import { useState, useEffect } from "react";
import { message, DatePicker, Empty, Modal, Button, List } from "antd";
import { Tag, Input, Tooltip, Popconfirm, Select } from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";
import { db } from "../../../db";

const { Search } = Input;
const { RangePicker } = DatePicker;

// ============================================
// 动画
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  max-width: 1200px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${SPACING.xl};

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${SPACING.md};
  margin-bottom: ${SPACING.lg};
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled(Search)`
  width: 300px;

  .ant-input {
    border-radius: ${BORDER.radius.sm};
    border-color: ${COLORS.subtle};

    &:hover {
      border-color: ${COLORS.inkLight};
    }
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-radius: ${BORDER.radius.sm} !important;
    border-color: ${COLORS.subtle} !important;
  }
`;

const ConversationList = styled(List)`
  .ant-list-item {
    background: ${COLORS.paper};
    border: 1px solid ${COLORS.subtle};
    border-radius: ${BORDER.radius.md};
    margin-bottom: ${SPACING.md};
    padding: ${SPACING.lg};
    transition: all ${TRANSITION.fast};
    animation: ${fadeIn} 0.3s ease-out;

    &:hover {
      border-color: ${COLORS.inkLight};
      box-shadow: ${SHADOW.sm};
    }
  }

  .ant-list-item-meta-title {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.md};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.xs};
  }

  .ant-list-item-meta-description {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
  }
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${SPACING.md};

  .conversation-info {
    flex: 1;

    .conversation-title {
      font-size: ${TYPOGRAPHY.fontSize.md};
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
      margin-bottom: ${SPACING.xs};
      display: flex;
      align-items: center;
      gap: ${SPACING.sm};
    }

    .conversation-meta {
      display: flex;
      gap: ${SPACING.md};
      align-items: center;
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
    }
  }

  .conversation-actions {
    display: flex;
    gap: ${SPACING.sm};
  }
`;

const MessagePreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
  padding: ${SPACING.md};
  background: ${COLORS.background};
  border-radius: ${BORDER.radius.sm};
  margin-top: ${SPACING.md};
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 2px;
  }
`;

const MessageItem = styled.div<{ $isUser: boolean }>`
  display: flex;
  gap: ${SPACING.sm};
  align-items: flex-start;

  .message-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${BORDER.radius.full};
    font-size: ${TYPOGRAPHY.fontSize.xs};
    background: ${(props) => (props.$isUser ? COLORS.ink : COLORS.accent)};
    color: ${COLORS.paper};
  }

  .message-content {
    flex: 1;
    background: ${(props) =>
      props.$isUser ? COLORS.subtleLight : COLORS.paper};
    padding: ${SPACING.sm};
    border-radius: ${BORDER.radius.sm};
    border: 1px solid ${COLORS.subtle};

    .message-text {
      font-size: ${TYPOGRAPHY.fontSize.sm};
      color: ${COLORS.inkLight};
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-time {
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
      margin-top: 4px;
    }
  }
`;

const StyledTag = styled(Tag)`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  border-radius: ${BORDER.radius.full};
  padding: 2px ${SPACING.sm};
  margin: 0;
`;

const EmptyContainer = styled.div`
  padding: ${SPACING["3xl"]};
  text-align: center;
`;

const StyledButton = styled(Button)`
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};

  &:hover {
    color: ${COLORS.accent};
    border-color: ${COLORS.accent};
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: ${SPACING.lg};
  padding: ${SPACING.md};
  background: ${COLORS.background};
  border-radius: ${BORDER.radius.sm};
  margin-bottom: ${SPACING.lg};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkLight};

  .stat-value {
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    font-size: ${TYPOGRAPHY.fontSize.md};
  }
`;

// ============================================
// Types
// ============================================

interface Conversation {
  id: string;
  title?: string;
  noteId?: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  }>;
}

// ============================================
// Main Component
// ============================================

export default function ConversationHistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 加载对话历史
  const loadConversations = async () => {
    setLoading(true);
    try {
      const all = await db.conversations.reverse().sortBy("updatedAt");
      console.log("Loaded conversations:", all);
      setConversations(all);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      message.error("加载对话历史失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 删除对话
  const handleDelete = async (id: string) => {
    try {
      await db.conversations.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      message.success("删除成功");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      message.error("删除失败");
    }
  };

  // 查看对话（打开弹窗）
  const handleView = (conversation: Conversation) => {
    // TODO: 实现查看对话详情弹窗
    Modal.info({
      title: conversation.title || "对话详情",
      width: 600,
      content: (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {conversation.messages.map((msg) => (
            <MessageItem key={msg.id} $isUser={msg.role === "user"}>
              <div className="message-icon">
                {msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleString("zh-CN")}
                </div>
              </div>
            </MessageItem>
          ))}
        </div>
      ),
    });
  };

  // 清空所有对话
  const handleClearAll = async () => {
    try {
      await db.conversations.clear();
      setConversations([]);
      message.success("已清空所有对话");
    } catch (error) {
      console.error("Failed to clear conversations:", error);
      message.error("清空失败");
    }
  };

  // 过滤对话
  const filteredConversations = conversations.filter((conv: Conversation) => {
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const titleMatch = conv.title?.toLowerCase().includes(searchLower);
      const contentMatch = conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(searchLower),
      );
      if (!titleMatch && !contentMatch) return false;
    }

    // 日期过滤
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      const convDate = conv.updatedAt;
      const startTime = start?.valueOf() ?? 0;
      const endTime = end?.valueOf() ?? Number.MAX_VALUE;
      if (convDate < startTime || convDate > endTime) {
        return false;
      }
    }

    // 状态过滤
    if (statusFilter === "hasNote" && !conv.noteId) return false;
    if (statusFilter === "noNote" && conv.noteId) return false;

    return true;
  });

  // 统计信息
  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0,
  );
  const totalTokens = conversations.reduce((sum, conv) => {
    return (
      sum +
      conv.messages.reduce((msgSum, msg) => msgSum + msg.content.length, 0)
    );
  }, 0);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? "刚刚" : `${minutes} 分钟前`;
      }
      return `${hours} 小时前`;
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  // 获取对话预览（前 3 条消息）
  const getMessagePreview = (conv: Conversation) => {
    return conv.messages.slice(0, 3);
  };

  return (
    <Container>
      <Header>
        <h2>对话历史</h2>
        <Popconfirm
          title="确定要清空所有对话吗？"
          description="此操作不可恢复"
          onConfirm={handleClearAll}
          okText="确定"
          cancelText="取消"
        >
          <Button danger>清空所有对话</Button>
        </Popconfirm>
      </Header>

      {/* 统计信息 */}
      <StatsBar>
        <StatItem>
          <MessageOutlined />
          <span>对话数：</span>
          <span className="stat-value">{conversations.length}</span>
        </StatItem>
        <StatItem>
          <MessageOutlined />
          <span>消息数：</span>
          <span className="stat-value">{totalMessages}</span>
        </StatItem>
        <StatItem>
          <RobotOutlined />
          <span>字符数：</span>
          <span className="stat-value">{totalTokens.toLocaleString()}</span>
        </StatItem>
      </StatsBar>

      {/* 过滤栏 */}
      <FilterBar>
        <SearchInput
          placeholder="搜索对话内容..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <RangePicker
          onChange={setDateRange}
          placeholder={["开始日期", "结束日期"]}
        />

        <StyledSelect
          value={statusFilter}
          onChange={(value: unknown) => setStatusFilter(value as string)}
          style={{ width: 120 }}
        >
          <Select.Option value="all">全部</Select.Option>
          <Select.Option value="hasNote">有笔记</Select.Option>
          <Select.Option value="noNote">无笔记</Select.Option>
        </StyledSelect>

        <Button
          icon={<ReloadOutlined />}
          onClick={loadConversations}
          loading={loading}
        >
          刷新
        </Button>
      </FilterBar>

      {/* 对话列表 */}
      {filteredConversations.length === 0 ? (
        <EmptyContainer>
          <Empty
            description={
              searchText
                ? "没有找到匹配的对话"
                : conversations.length === 0
                  ? "暂无对话历史，开始与 AI 对话吧！"
                  : "没有符合条件的对话"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyContainer>
      ) : (
        <ConversationList
          dataSource={filteredConversations}
          renderItem={(conv: unknown) => {
            const conversation = conv as Conversation;
            const messageCount = conversation.messages.length;

            return (
              <List.Item key={conversation.id}>
                <div style={{ width: "100%" }}>
                  <ConversationHeader>
                    <div className="conversation-info">
                      <div className="conversation-title">
                        {conversation.title || "未命名对话"}
                        <StyledTag color="blue">
                          {messageCount} 条消息
                        </StyledTag>
                        {conversation.noteId && (
                          <StyledTag color="green">关联笔记</StyledTag>
                        )}
                      </div>
                      <div className="conversation-meta">
                        <span>
                          <ClockCircleOutlined />{" "}
                          {formatTime(conversation.updatedAt)}
                        </span>
                        <span>
                          创建于{" "}
                          {new Date(conversation.createdAt).toLocaleDateString(
                            "zh-CN",
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="conversation-actions">
                      <Tooltip title="查看详情">
                        <StyledButton
                          icon={<EyeOutlined />}
                          onClick={() => handleView(conversation)}
                        >
                          查看
                        </StyledButton>
                      </Tooltip>
                      <Popconfirm
                        title="确认删除"
                        description="确定要删除这条对话吗？"
                        onConfirm={() => handleDelete(conversation.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Tooltip title="删除">
                          <StyledButton danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  </ConversationHeader>

                  {/* 消息预览 */}
                  {conversation.messages.length > 0 && (
                    <MessagePreview>
                      {getMessagePreview(conversation).map((msg) => (
                        <MessageItem key={msg.id} $isUser={msg.role === "user"}>
                          <div className="message-icon">
                            {msg.role === "user" ? (
                              <UserOutlined />
                            ) : (
                              <RobotOutlined />
                            )}
                          </div>
                          <div className="message-content">
                            <div className="message-text">
                              {msg.content.length > 200
                                ? msg.content.substring(0, 200) + "..."
                                : msg.content}
                            </div>
                            <div className="message-time">
                              {new Date(msg.timestamp).toLocaleString("zh-CN")}
                            </div>
                          </div>
                        </MessageItem>
                      ))}
                      {conversation.messages.length > 3 && (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: TYPOGRAPHY.fontSize.xs,
                            color: COLORS.inkMuted,
                          }}
                        >
                          还有 {conversation.messages.length - 3} 条消息...
                        </div>
                      )}
                    </MessagePreview>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Container>
  );
}

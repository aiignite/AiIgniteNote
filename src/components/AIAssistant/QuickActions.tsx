import { useState } from "react";
import { Button, Col, Row, Tooltip, Modal } from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  FileSearchOutlined,
  TagsOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useAIStore } from "../../store/aiStore";
import { useNoteStore } from "../../store/noteStore";

const ActionCard = styled.div`
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  border-radius: 8px;
  text-align: center;

  &:hover {
    background: rgba(24, 144, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$color};
  color: #fff;
  font-size: 16px;
  margin: 0 auto 4px;
`;

const ActionTitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
`;

const QuickActionsContainer = styled.div<{ $collapsed: boolean }>`
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: ${(props) => (props.$collapsed ? "48px" : "280px")};
`;

const QuickActionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
`;

const QuickActionsTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
`;

const QuickActionsContent = styled.div`
  padding: 0 16px 12px;
`;

const ResultModal = styled(Modal)`
  .ant-modal-body {
    max-height: 60vh;
    overflow-y: auto;
  }
`;

const ResultContent = styled.div`
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  font-size: 14px;
`;

interface QuickActionsProps {
  noteContent?: string;
  onContentReplace?: (newContent: string) => void;
}

function QuickActions({
  noteContent = "",
  onContentReplace,
}: QuickActionsProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
    action: string;
  }>({
    visible: false,
    title: "",
    content: "",
    action: "",
  });

  const { currentConversation, sendMessage } = useAIStore();
  const { currentNote } = useNoteStore();

  const actions = [
    {
      key: "generate",
      icon: <FileTextOutlined />,
      title: "生成续写",
      color: "#1890ff",
      prompt: "请根据以下内容继续写作，保持风格一致：",
    },
    {
      key: "rewrite",
      icon: <EditOutlined />,
      title: "改写润色",
      color: "#52c41a",
      prompt: "请将以下内容改写得更专业、更流畅：",
    },
    {
      key: "summarize",
      icon: <FileSearchOutlined />,
      title: "提取摘要",
      color: "#faad14",
      prompt: "请为以下内容生成一个简洁的摘要：",
    },
    {
      key: "keywords",
      icon: <TagsOutlined />,
      title: "提取关键词",
      color: "#eb2f96",
      prompt: "请从以下内容中提取5-10个关键词，用逗号分隔：",
    },
    {
      key: "translate",
      icon: <TranslationOutlined />,
      title: "翻译成英文",
      color: "#722ed1",
      prompt: "请将以下内容翻译成英文：",
    },
    {
      key: "grammar",
      icon: <CheckCircleOutlined />,
      title: "语法修正",
      color: "#13c2c2",
      prompt: "请检查并修正以下内容的语法错误：",
    },
    {
      key: "expand",
      icon: <ExpandOutlined />,
      title: "内容扩展",
      color: "#fa8c16",
      prompt: "请对以下内容进行扩展，添加更多细节和说明：",
    },
    {
      key: "compress",
      icon: <CompressOutlined />,
      title: "内容精简",
      color: "#f5222d",
      prompt: "请将以下内容精简，保留核心信息：",
    },
  ];

  const handleActionClick = async (action: (typeof actions)[0]) => {
    // 获取要处理的内容
    const contentToProcess = noteContent || currentNote?.content || "";

    if (!contentToProcess.trim()) {
      Modal.warn({
        title: "提示",
        content: "请先选择或输入需要处理的内容",
      });
      return;
    }

    // 构建提示词
    const fullPrompt = `${action.prompt}\n\n${contentToProcess}`;

    setLoading(true);

    try {
      // 发送到 AI
      if (!currentConversation) {
        throw new Error("请先创建对话");
      }

      await sendMessage(
        currentConversation.id,
        fullPrompt,
        "custom",
      );

      setLoading(false);
    } catch (error) {
      console.error("Action failed:", error);
      setLoading(false);
      Modal.error({
        title: "操作失败",
        content: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  return (
    <QuickActionsContainer $collapsed={collapsed}>
      <QuickActionsHeader onClick={() => setCollapsed(!collapsed)}>
        <QuickActionsTitle>快捷操作</QuickActionsTitle>
        {collapsed ? (
          <ArrowDownOutlined style={{ fontSize: 12 }} />
        ) : (
          <ArrowUpOutlined style={{ fontSize: 12 }} />
        )}
      </QuickActionsHeader>

      {!collapsed && (
        <QuickActionsContent>
          <Row gutter={[8, 8]}>
            {actions.map((action) => (
              <Col span={6} key={action.key}>
                <Tooltip title={action.title} placement="bottom">
                  <ActionCard onClick={() => handleActionClick(action)} style={{ opacity: loading ? 0.5 : 1 }}>
                    <ActionIcon $color={action.color}>{action.icon}</ActionIcon>
                    <ActionTitle>{action.title}</ActionTitle>
                  </ActionCard>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </QuickActionsContent>
      )}

      {/* 结果展示弹窗 */}
      <ResultModal
        title={resultModal.title}
        open={resultModal.visible}
        onCancel={() => setResultModal({ ...resultModal, visible: false })}
        width={600}
        footer={[
          <Button
            key="close"
            onClick={() => setResultModal({ ...resultModal, visible: false })}
          >
            关闭
          </Button>,
          <Button
            key="replace"
            type="primary"
            onClick={() => {
              if (onContentReplace) {
                onContentReplace(resultModal.content);
              }
              setResultModal({ ...resultModal, visible: false });
            }}
          >
            替换内容
          </Button>,
        ]}
      >
        <ResultContent>{resultModal.content}</ResultContent>
      </ResultModal>
    </QuickActionsContainer>
  );
}

export default QuickActions;

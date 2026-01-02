import { useState } from "react";
import { Col, Row, Tooltip, Modal } from "antd";
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

interface QuickActionsProps {
  noteContent?: string;
}

function QuickActions({ noteContent = "" }: QuickActionsProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [capturedSelection, setCapturedSelection] = useState(""); // 在按钮按下时捕获选中文本

  const { currentConversation, sendMessage, selectedText, setSelectedText } =
    useAIStore();
  const { currentNote } = useNoteStore();

  const actions = [
    {
      key: "generate",
      icon: <FileTextOutlined />,
      title: "生成续写",
      color: "#1890ff",
      prompt: "请根据以下内容继续写作,保持风格一致:",
      actionType: "generate",
    },
    {
      key: "rewrite",
      icon: <EditOutlined />,
      title: "改写润色",
      color: "#52c41a",
      prompt: "请将以下内容改写得更专业、更流畅:",
      actionType: "replace",
    },
    {
      key: "summarize",
      icon: <FileSearchOutlined />,
      title: "提取摘要",
      color: "#faad14",
      prompt: "请为以下内容生成一个简洁的摘要:",
      actionType: "insert",
    },
    {
      key: "keywords",
      icon: <TagsOutlined />,
      title: "提取关键词",
      color: "#eb2f96",
      prompt: "请从以下内容中提取5-10个关键词,用逗号分隔:",
      actionType: "insert",
    },
    {
      key: "translate",
      icon: <TranslationOutlined />,
      title: "翻译成英文",
      color: "#722ed1",
      prompt: "请将以下内容翻译成英文:",
      actionType: "replace",
    },
    {
      key: "grammar",
      icon: <CheckCircleOutlined />,
      title: "语法修正",
      color: "#13c2c2",
      prompt: "请检查并修正以下内容的语法错误:",
      actionType: "replace",
    },
    {
      key: "expand",
      icon: <ExpandOutlined />,
      title: "内容扩展",
      color: "#fa8c16",
      prompt: "请对以下内容进行扩展,添加更多细节和说明:",
      actionType: "replace",
    },
    {
      key: "compress",
      icon: <CompressOutlined />,
      title: "内容精简",
      color: "#f5222d",
      prompt: "请将以下内容精简,保留核心信息:",
      actionType: "replace",
    },
  ];

  const handleActionClick = async (action: (typeof actions)[0]) => {
    // 使用在 onMouseDown 时捕获的选中文本
    const textToUse = capturedSelection.trim();
    const hasSelection = textToUse.length > 0;

    console.log("QuickActions 点击时的 selectedText:", {
      capturedSelection: textToUse,
      selectedText: selectedText.trim(),
      length: textToUse.length,
    });

    // 优先使用选中的文本，如果没有选中则使用整篇文档
    const contentToProcess = hasSelection
      ? textToUse
      : noteContent || currentNote?.content || "";

    console.log("快捷操作调试信息:", {
      hasSelection,
      textToUse,
      selectedText: selectedText.trim(),
      noteContent: noteContent?.substring(0, 50),
      currentNoteContent: currentNote?.content?.substring(0, 50),
      contentToProcess: contentToProcess.substring(0, 100),
    });

    if (!contentToProcess.trim()) {
      Modal.warn({
        title: "提示",
        content: "请先选择或输入需要处理的内容",
      });
      return;
    }

    // 构建提示词，明确说明是处理选中内容还是全文
    const scopeHint = hasSelection ? "【选中的文本片段】" : "【整篇文档】";
    const fullPrompt = `${scopeHint}\n${action.prompt}\n\n${contentToProcess}`;

    console.log("发送给 AI 的提示词:", fullPrompt.substring(0, 200));

    // 如果使用了选中文本，在发送后清除选择
    if (hasSelection) {
      window.getSelection()?.removeAllRanges();
      setSelectedText("");
      setCapturedSelection("");
    }

    setLoading(true);

    try {
      // 发送到 AI
      if (!currentConversation) {
        throw new Error("请先创建对话");
      }

      await sendMessage(currentConversation.id, fullPrompt, "quick-action");

      setLoading(false);
    } catch (error) {
      console.error("Action failed:", error);
      setLoading(false);
      // 清除操作记录
      sessionStorage.removeItem("lastQuickAction");
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
                  <ActionCard
                    onMouseDown={() => {
                      // 在鼠标按下时立即捕获选中文本
                      const selection =
                        window.getSelection()?.toString().trim() || "";
                      setCapturedSelection(selection);
                      console.log("onMouseDown 捕获选中文本:", selection);
                    }}
                    onClick={() => handleActionClick(action)}
                    style={{ opacity: loading ? 0.5 : 1 }}
                  >
                    <ActionIcon $color={action.color}>{action.icon}</ActionIcon>
                    <ActionTitle>{action.title}</ActionTitle>
                  </ActionCard>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </QuickActionsContent>
      )}
    </QuickActionsContainer>
  );
}

export default QuickActions;

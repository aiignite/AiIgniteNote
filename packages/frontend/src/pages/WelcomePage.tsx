import { useNavigate } from "react-router-dom";
import { Button, Card, Typography, Divider, Space } from "antd";
import {
  PlusOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CodeOutlined,
  RobotOutlined,
  TagOutlined,
  ThunderboltOutlined,
  BookOutlined,
  SettingOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
} from "../styles/design-tokens";
import { useNoteStore } from "../store/noteStore";

const { Title, Paragraph, Text } = Typography;

// ============================================
// Animations
// ============================================

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// ============================================
// Styled Components
// ============================================

const WelcomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${SPACING["3xl"]} ${SPACING.xl};
  animation: ${fadeInUp} 0.6s ease-out;
  height: 100%;
  overflow-y: auto;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: ${SPACING["3xl"]};
  padding: ${SPACING["2xl"]} 0;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: ${COLORS.accent};
    opacity: 0.3;
    border-radius: 2px;
  }
`;

const StyledTitle = styled(Title)`
  font-family: Georgia, serif;
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 400;
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.md} !important;
  letter-spacing: -0.02em;
  line-height: 1.2;

  .highlight {
    font-style: italic;
    color: ${COLORS.accent};
  }
`;

const Subtitle = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.lg};
  line-height: 1.6;
  color: ${COLORS.inkLight};
  margin: 0;
  font-weight: 300;
`;

const CreateButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${SPACING["3xl"]};
  animation: ${pulse} 3s ease-in-out infinite;
`;

const StyledCreateButton = styled(Button)`
  height: 56px;
  padding: 0 ${SPACING.xl};
  font-size: ${TYPOGRAPHY.fontSize.lg};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  border-radius: ${BORDER.radius.lg};
  background: ${COLORS.accent};
  border-color: ${COLORS.accent};
  color: ${COLORS.paper};
  box-shadow: ${SHADOW.md};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accentHover};
    border-color: ${COLORS.accentHover};
    color: ${COLORS.paper};
    transform: translateY(-2px);
    box-shadow: ${SHADOW.lg};
  }

  &:active {
    transform: translateY(0);
  }

  .anticon {
    font-size: ${TYPOGRAPHY.fontSize.xl};
  }
`;

const SectionTitle = styled(Title)`
  font-family: Georgia, serif;
  font-size: ${TYPOGRAPHY.fontSize["2xl"]};
  font-weight: 400;
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.lg} !important;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};

  .anticon {
    color: ${COLORS.accent};
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${SPACING.lg};
  margin-bottom: ${SPACING.xl};
`;

const FeatureCard = styled(Card)`
  height: 100%;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  background: ${COLORS.paper};
  transition: all ${TRANSITION.normal};
  overflow: hidden;

  &:hover {
    border-color: ${COLORS.accent};
    transform: translateY(-4px);
    box-shadow: ${SHADOW.md};

    .card-icon {
      transform: scale(1.1);
    }
  }

  .ant-card-body {
    padding: ${SPACING.xl};
  }

  .card-icon {
    font-size: 36px;
    color: ${COLORS.accent};
    margin-bottom: ${SPACING.md};
    transition: transform ${TRANSITION.normal};
  }

  .card-title {
    font-size: ${TYPOGRAPHY.fontSize.lg};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.sm};
  }

  .card-desc {
    font-size: ${TYPOGRAPHY.fontSize.md};
    color: ${COLORS.inkLight};
    line-height: 1.6;
    margin: 0;
  }
`;

const ListCard = styled(Card)`
  margin-bottom: ${SPACING.lg};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  background: ${COLORS.paper};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.inkLight};
    box-shadow: ${SHADOW.sm};
  }

  .ant-card-head {
    border-bottom: 1px solid ${COLORS.subtle};
    background: ${COLORS.paperDark};

    .ant-card-head-title {
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
      font-size: ${TYPOGRAPHY.fontSize.md};
    }
  }

  .ant-card-body {
    padding: ${SPACING.lg} ${SPACING.xl};

    .ant-typography {
      color: ${COLORS.inkLight};
      line-height: 1.6;
      margin-bottom: ${SPACING.sm};
    }

    ul {
      margin: 0;
      padding-left: ${SPACING.lg};

      li {
        margin-bottom: ${SPACING.xs};
        color: ${COLORS.inkLight};

        &::marker {
          color: ${COLORS.accent};
        }
      }
    }
  }
`;

const StyledDivider = styled(Divider)`
  margin: ${SPACING.xl} 0;
  border-color: ${COLORS.subtle};
  opacity: 0.5;
`;

const ActionLink = styled.a`
  color: ${COLORS.accent};
  text-decoration: none;
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  transition: all ${TRANSITION.fast};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${SPACING.xs};

  &:hover {
    color: ${COLORS.accentHover};
    text-decoration: underline;
  }

  .anticon {
    transition: transform ${TRANSITION.fast};
  }

  &:hover .anticon {
    transform: translateX(4px);
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${SPACING.md};
  flex-wrap: wrap;
  justify-content: center;
  margin-top: ${SPACING.lg};
`;

const QuickActionButton = styled(Button)`
  border-radius: ${BORDER.radius.md};
  height: 40px;
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${SHADOW.sm};
  }
`;

const IconWrapper = styled.span<{ $bg?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${BORDER.radius.md};
  background: ${(props) => props.$bg || COLORS.accent};
  color: ${COLORS.paper};
  margin-right: ${SPACING.md};
  font-size: ${TYPOGRAPHY.fontSize.xl};
  box-shadow: ${SHADOW.sm};
`;

// ============================================
// Main Component
// ============================================

function WelcomePage() {
  const navigate = useNavigate();
  const { createNote, setLastUsedFileType } = useNoteStore();

  const handleCreateNote = async (fileType: string = "markdown") => {
    setLastUsedFileType(fileType);
    const newNote = await createNote({
      title: "新建笔记",
      content: "",
      htmlContent: "",
      fileType: fileType as any,
      category: "",
      tags: [],
      isDeleted: false,
      isFavorite: false,
    });
    navigate(`/notes/${newNote.id}`);
  };

  return (
    <WelcomeContainer>
      {/* 头部区域 */}
      <HeaderSection>
        <StyledTitle level={1}>
          欢迎使用 <span className="highlight">AiNote</span>
        </StyledTitle>
        <Subtitle>
          智能笔记应用，支持多种编辑器与 AI 深度集成
        </Subtitle>
      </HeaderSection>

      {/* 创建笔记按钮 */}
      <CreateButtonContainer>
        <StyledCreateButton
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => handleCreateNote()}
        >
          创建新笔记
        </StyledCreateButton>
      </CreateButtonContainer>

      {/* 快速操作 */}
      <QuickActions>
        <QuickActionButton
          icon={<FileMarkdownOutlined />}
          onClick={() => handleCreateNote("markdown")}
        >
          Markdown
        </QuickActionButton>
        <QuickActionButton
          icon={<FileTextOutlined />}
          onClick={() => handleCreateNote("richtext")}
        >
          富文本
        </QuickActionButton>
        <QuickActionButton
          icon={<CodeOutlined />}
          onClick={() => handleCreateNote("monaco")}
        >
          代码
        </QuickActionButton>
        <QuickActionButton
          icon={<NodeIndexOutlined />}
          onClick={() => handleCreateNote("mindmap")}
        >
          思维导图
        </QuickActionButton>
        <QuickActionButton
          icon={<ApartmentOutlined />}
          onClick={() => handleCreateNote("drawio")}
        >
          DrawIO
        </QuickActionButton>
      </QuickActions>

      <StyledDivider />

      {/* 笔记类型介绍 */}
      <SectionTitle level={2}>
        <FileMarkdownOutlined />
        笔记类型
      </SectionTitle>
      <CardGrid>
        <FeatureCard>
          <div className="card-icon">
            <FileMarkdownOutlined />
          </div>
          <div className="card-title">Markdown 笔记</div>
          <p className="card-desc">
            支持 Markdown 语法、实时预览、代码高亮和数学公式，适合编写技术文档。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <FileTextOutlined />
          </div>
          <div className="card-title">富文本笔记</div>
          <p className="card-desc">
            所见即所得编辑器，支持格式化文本、插入图片和链接，适合日常记录。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <CodeOutlined />
          </div>
          <div className="card-title">代码笔记</div>
          <p className="card-desc">
            VS Code 同款编辑器，支持多种编程语言语法高亮、智能提示和格式化。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <NodeIndexOutlined />
          </div>
          <div className="card-title">思维导图</div>
          <p className="card-desc">
            可视化思维导图，支持拖拽编辑、节点管理和一键收起展开，导入导出 JSON。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <ApartmentOutlined />
          </div>
          <div className="card-title">DrawIO 图表</div>
          <p className="card-desc">
            绘制流程图、UML 图、架构图和网络拓扑图，支持多种图形元素和连接线。
          </p>
        </FeatureCard>
      </CardGrid>

      <StyledDivider />

      {/* AI 助手使用 */}
      <SectionTitle level={2}>
        <RobotOutlined />
        AI 助手使用
      </SectionTitle>
      <ListCard
        title="如何使用 AI 助手"
        extra={<RobotOutlined style={{ color: COLORS.accent }} />}
      >
        <Paragraph>
          AiNote 内置多个专业 AI 助手，可以帮助您更高效地完成工作。
        </Paragraph>
        <ul>
          <li>
            <Text strong>通用助手</Text> - 通用问答、内容总结、翻译等
          </li>
          <li>
            <Text strong>Markdown 助手</Text> - Markdown 格式优化、文档结构建议
          </li>
          <li>
            <Text strong>富文本助手</Text> - 内容润色、格式建议、文档排版
          </li>
          <li>
            <Text strong>思维导图助手</Text> - 生成思维导图结构、优化节点布局
          </li>
          <li>
            <Text strong>DrawIO 助手</Text> - 生成流程图 XML、图表结构优化
          </li>
        </ul>
        <Paragraph style={{ marginTop: SPACING.md }}>
          <ActionLink onClick={() => navigate("/settings?tab=assistants")}>
            前往创建自定义助手 <ArrowRightOutlined />
          </ActionLink>
        </Paragraph>
      </ListCard>

      <StyledDivider />

      {/* 笔记与助手交互 */}
      <SectionTitle level={2}>
        <ThunderboltOutlined />
        笔记与 AI 助手交互
      </SectionTitle>
      <ListCard
        title="如何让 AI 助手处理笔记内容"
        extra={<ThunderboltOutlined style={{ color: COLORS.accent }} />}
      >
        <Paragraph>
          您可以选择笔记中的内容，发送给 AI 助手进行分析、优化或生成新内容。
        </Paragraph>
        <ul>
          <li>
            <Text strong>文本编辑器：</Text> 鼠标选中文本 → 点击悬浮工具栏的"发送"按钮
          </li>
          <li>
            <Text strong>思维导图：</Text> 选中节点 → 点击工具栏的"发送"按钮
          </li>
          <li>
            <Text strong>DrawIO：</Text> 选中元素 → 点击"发送"按钮
          </li>
        </ul>
        <Paragraph>
          AI 生成的内容可以直接导入回编辑器，支持导入 JSON、XML 或纯文本格式。
        </Paragraph>
      </ListCard>

      <StyledDivider />

      {/* 分类和标签 */}
      <SectionTitle level={2}>
        <TagOutlined />
        分类与标签
      </SectionTitle>
      <CardGrid>
        <FeatureCard>
          <div className="card-icon">
            <BookOutlined />
          </div>
          <div className="card-title">分类管理</div>
          <p className="card-desc">
            创建分类文件夹，将笔记归类到不同分类中。支持设置图标和颜色，
            一个笔记只能属于一个分类。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <TagOutlined />
          </div>
          <div className="card-title">标签系统</div>
          <p className="card-desc">
            为笔记添加标签，支持多标签分类。标签提供更灵活的分类方式，
            一个笔记可以有多个标签。
          </p>
        </FeatureCard>

        <FeatureCard>
          <div className="card-icon">
            <SettingOutlined />
          </div>
          <div className="card-title">设置管理</div>
          <p className="card-desc">
            <ActionLink onClick={() => navigate("/settings")}>
              前往设置页面 <ArrowRightOutlined />
            </ActionLink>
            {" "}配置 AI 模型、创建自定义助手、管理主题和编辑器设置。
          </p>
        </FeatureCard>
      </CardGrid>

      <StyledDivider />

      {/* 底部提示 */}
      <div style={{ textAlign: "center", padding: `${SPACING.xl} 0` }}>
        <Paragraph style={{ fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.inkMuted }}>
          💡 提示：点击上方的"创建新笔记"按钮开始您的笔记之旅，或从左侧边栏选择现有笔记进行编辑
        </Paragraph>
      </div>
    </WelcomeContainer>
  );
}

export default WelcomePage;

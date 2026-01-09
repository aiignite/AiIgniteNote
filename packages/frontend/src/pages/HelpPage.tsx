import { useState } from "react";
import { Card, Collapse, Typography, Divider, Input, Tag, Space } from "antd";
import {
  SearchOutlined,
  BookOutlined,
  RocketOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CodeOutlined,
  RobotOutlined,
  TagOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CloudSyncOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import styled, { css, keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
} from "../styles/design-tokens";

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

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// ============================================
// Styled Components
// ============================================

const HelpContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: ${SPACING["3xl"]} ${SPACING.xl};
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
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
    width: 120px;
    height: 3px;
    background: ${COLORS.accent};
    opacity: 0.3;
  }
`;

const StyledTitle = styled(Title)`
  font-family: Georgia, serif;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 400;
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.md} !important;
  letter-spacing: -0.02em;
  line-height: 1.2;

  .highlight {
    font-style: italic;
    color: ${COLORS.accent};
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 4px;
      left: 0;
      width: 100%;
      height: 3px;
      background: ${COLORS.accent};
      opacity: 0.3;
    }
  }

  .anticon {
    color: ${COLORS.accent};
    margin-right: ${SPACING.sm};
  }
`;

const Subtitle = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.lg};
  line-height: 1.6;
  color: ${COLORS.inkLight};
  margin: 0;
  font-weight: 300;
`;

const SearchWrapper = styled.div`
  margin-bottom: ${SPACING.xl};
  animation: ${slideInLeft} 0.5s ease-out 0.1s both;
`;

const StyledSearch = styled(Input)`
  background: ${COLORS.paper};
  border: 2px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: 16px 24px;
  font-size: ${TYPOGRAPHY.fontSize.md};
  transition: all ${TRANSITION.normal};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    background: ${COLORS.paper};
    border-color: ${COLORS.accent};
    box-shadow: 0 0 0 4px ${COLORS.accent}15;
  }

  .ant-input {
    background: transparent;
    border: none;
    padding: 0;
    color: ${COLORS.ink};
    font-size: ${TYPOGRAPHY.fontSize.md};
  }

  .ant-input-prefix {
    margin-right: ${SPACING.md};
    color: ${COLORS.accent};
    font-size: ${TYPOGRAPHY.fontSize.lg};
  }

  .ant-input-clear {
    color: ${COLORS.inkMuted};
    &:hover {
      color: ${COLORS.ink};
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.sm};
  justify-content: center;
  margin-bottom: ${SPACING.xl};
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
`;

const FeatureTag = styled(Tag)`
  margin: 0;
  padding: 8px 20px;
  border-radius: ${BORDER.radius.md};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: 500;
  letter-spacing: 0.03em;
  border: none;
  transition: all ${TRANSITION.fast};
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${SHADOW.sm};
  }
`;

const StyledDivider = styled(Divider)`
  margin: ${SPACING.xl} 0;
  border-color: ${COLORS.subtle};
  opacity: 0.5;
`;

const StyledCollapse = styled(Collapse)`
  background: transparent;
  border: none;

  .ant-collapse-item {
    border: 1px solid ${COLORS.subtle};
    border-radius: ${BORDER.radius.md} !important;
    margin-bottom: ${SPACING.md};
    overflow: hidden;
    transition: all ${TRANSITION.fast};
    animation: ${slideInLeft} 0.5s ease-out both;

    &:hover {
      border-color: ${COLORS.inkLight};
      box-shadow: ${SHADOW.sm};
    }

    &.ant-collapse-item-active {
      border-color: ${COLORS.accent};
      box-shadow: ${SHADOW.md};
    }
  }

  .ant-collapse-header {
    padding: ${SPACING.lg} ${SPACING.xl} !important;
    background: ${COLORS.paper};
    font-size: ${TYPOGRAPHY.fontSize.md};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    letter-spacing: 0.02em;
    transition: all ${TRANSITION.fast};

    .ant-collapse-expand-icon {
      color: ${COLORS.accent};
      font-size: ${TYPOGRAPHY.fontSize.lg};
    }
  }

  .ant-collapse-content {
    border-top: 1px solid ${COLORS.subtle};
    background: ${COLORS.background};
  }

  .ant-collapse-content-box {
    padding: ${SPACING.xl} !important;
  }
`;

const SectionIcon = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${BORDER.radius.sm};
  background: ${(props) => props.$color || COLORS.ink};
  color: ${COLORS.paper};
  margin-right: ${SPACING.md};
  font-size: ${TYPOGRAPHY.fontSize.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ContentSection = styled.div`
  .ant-typography {
    color: ${COLORS.inkLight};
    line-height: 1.7;
  }

  h4 {
    color: ${COLORS.ink} !important;
    font-weight: ${TYPOGRAPHY.fontWeight.semibold} !important;
    font-size: ${TYPOGRAPHY.fontSize.lg} !important;
    margin-top: ${SPACING.lg} !important;
    margin-bottom: ${SPACING.sm} !important;
    letter-spacing: -0.01em;
  }

  p {
    margin-bottom: ${SPACING.md} !important;
  }

  ul, ol {
    margin-left: ${SPACING.lg};
    margin-bottom: ${SPACING.md};

    li {
      margin-bottom: ${SPACING.xs};
      color: ${COLORS.inkLight};
      line-height: 1.7;

      &::marker {
        color: ${COLORS.accent};
      }
    }
  }
`;

const CodeBlock = styled.code`
  background: ${COLORS.ink};
  color: ${COLORS.paper};
  padding: 3px 8px;
  border-radius: 4px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const KeyCombo = styled.kbd`
  display: inline-block;
  padding: 3px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: ${COLORS.ink};
  vertical-align: middle;
  background-color: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 0 2px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${SPACING.md};
  margin: ${SPACING.lg} 0;
`;

const FeatureCard = styled.div`
  padding: ${SPACING.lg};
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  transition: all ${TRANSITION.fast};
  text-align: center;

  &:hover {
    border-color: ${COLORS.accent};
    transform: translateY(-4px);
    box-shadow: ${SHADOW.md};
  }

  .feature-icon {
    font-size: 32px;
    margin-bottom: ${SPACING.md};
    color: ${COLORS.accent};
  }

  .feature-title {
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.xs};
    font-size: ${TYPOGRAPHY.fontSize.md};
  }

  .feature-desc {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    line-height: 1.5;
  }
`;

const SupportCard = styled.div`
  background: linear-gradient(135deg, ${COLORS.paper} 0%, ${COLORS.background} 100%);
  border: 2px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.lg};
  padding: ${SPACING.xl};
  margin-top: ${SPACING.xl};
  text-align: center;
  box-shadow: ${SHADOW.md};
  animation: ${fadeInUp} 0.6s ease-out 0.3s both;

  .support-icon {
    font-size: 48px;
    color: ${COLORS.accent};
    margin-bottom: ${SPACING.md};
  }

  .support-title {
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.md};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: ${SPACING.lg} 0;
    display: flex;
    flex-direction: column;
    gap: ${SPACING.sm};
    align-items: center;

    li {
      color: ${COLORS.inkLight};
      font-size: ${TYPOGRAPHY.fontSize.md};

      &::before {
        content: "→";
        color: ${COLORS.accent};
        margin-right: ${SPACING.sm};
      }
    }
  }
`;

// ============================================
// Help Content Data
// ============================================

const sections = [
  {
    key: "getting-started",
    icon: <RocketOutlined />,
    color: COLORS.accent,
    title: "快速开始",
    content: (
      <ContentSection>
        <Paragraph>
          欢迎使用 <strong>AiNote</strong> - 一个智能笔记应用，支持多种编辑器和
          AI 深度集成。以下是快速入门指南：
        </Paragraph>

        <Title level={4}>1. 登录系统</Title>
        <Paragraph>
          使用演示账号或注册新账号登录：
          <br />
          <Text type="secondary">邮箱：demo@ainote.com</Text>
          <br />
          <Text type="secondary">密码：demo123456</Text>
        </Paragraph>

        <Title level={4}>2. 创建第一条笔记</Title>
        <Paragraph>
          点击左侧边栏的 <CodeBlock>新建</CodeBlock> 按钮，选择笔记类型：
        </Paragraph>
        <ul>
          <li>
            <Text strong>Markdown 笔记</Text> - 支持 Markdown 语法，实时预览
          </li>
          <li>
            <Text strong>富文本笔记</Text> - 所见即所得编辑，支持格式化
          </li>
          <li>
            <Text strong>代码笔记</Text> - VS Code 同款编辑器，支持多种语言
          </li>
          <li>
            <Text strong>思维导图</Text> - 可视化思维导图，支持拖拽编辑
          </li>
          <li>
            <Text strong>DrawIO 图表</Text> - 流程图、架构图、UML 图表
          </li>
        </ul>

        <Title level={4}>3. 开始编辑</Title>
        <Paragraph>
          在编辑器中输入内容，系统会自动保存。您可以使用快捷键提高效率。
        </Paragraph>

        <Title level={4}>4. 使用 AI 助手</Title>
        <Paragraph>
          点击右侧的 AI 助手图标，选择合适的助手进行对话。选中编辑器中的内容后，
          可以发送给 AI 助手进行分析或优化。
        </Paragraph>
      </ContentSection>
    ),
  },
  {
    key: "note-management",
    icon: <FileTextOutlined />,
    color: "#52c41a",
    title: "笔记管理",
    content: (
      <ContentSection>
        <Title level={4}>创建笔记</Title>
        <Paragraph>
          点击左侧边栏的 <CodeBlock>新建</CodeBlock> 按钮，从下拉菜单中选择笔记类型。
          系统会创建新笔记并自动跳转到编辑页面。
        </Paragraph>

        <Title level={4}>编辑笔记</Title>
        <Paragraph>
          所有笔记支持自动保存功能，无需手动保存。不同类型的笔记有不同的编辑器：
        </Paragraph>

        <GridContainer>
          <FeatureCard>
            <div className="feature-icon"><FileMarkdownOutlined /></div>
            <div className="feature-title">Markdown</div>
            <div className="feature-desc">支持 GFM、代码高亮、数学公式</div>
          </FeatureCard>
          <FeatureCard>
            <div className="feature-icon"><FileTextOutlined /></div>
            <div className="feature-title">富文本</div>
            <div className="feature-desc">所见即所得，支持图片、链接</div>
          </FeatureCard>
          <FeatureCard>
            <div className="feature-icon"><CodeOutlined /></div>
            <div className="feature-title">代码</div>
            <div className="feature-desc">智能提示、语法高亮、格式化</div>
          </FeatureCard>
          <FeatureCard>
            <div className="feature-icon"><NodeIndexOutlined /></div>
            <div className="feature-title">思维导图</div>
            <div className="feature-desc">拖拽编辑、一键收起展开</div>
          </FeatureCard>
          <FeatureCard>
            <div className="feature-icon"><ApartmentOutlined /></div>
            <div className="feature-title">DrawIO</div>
            <div className="feature-desc">流程图、UML、架构图</div>
          </FeatureCard>
        </GridContainer>

        <Title level={4}>组织笔记</Title>
        <ul>
          <li>
            <Text strong>分类</Text> - 创建分类文件夹，将笔记归类到不同分类中
          </li>
          <li>
            <Text strong>标签</Text> - 为笔记添加标签，支持多标签分类
          </li>
          <li>
            <Text strong>收藏</Text> - 标记重要笔记为收藏，方便快速访问
          </li>
          <li>
            <Text strong>搜索</Text> - 使用搜索功能快速找到笔记内容
          </li>
        </ul>

        <Title level={4}>删除与恢复</Title>
        <Paragraph>
          删除的笔记会进入回收站，可以在 30 天内恢复。彻底删除后无法恢复。
        </Paragraph>

        <Title level={4}>版本历史</Title>
        <Paragraph>
          系统会自动保存笔记的历史版本，可以查看和恢复之前的版本。
        </Paragraph>
      </ContentSection>
    ),
  },
  {
    key: "ai-features",
    icon: <RobotOutlined />,
    color: "#1890ff",
    title: "AI 助手功能",
    content: (
      <ContentSection>
        <Paragraph>
          AiNote 内置多个 AI 助手，帮助您更高效地完成工作。
        </Paragraph>

        <Title level={4}>预设助手</Title>
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

        <Title level={4}>与编辑器交互</Title>
        <Paragraph>
          选择编辑器中的内容后，可以发送给 AI 助手：
        </Paragraph>
        <ul>
          <li>
            <Text>文本编辑器：</Text> 鼠标选中文本 → 点击"发送"按钮
          </li>
          <li>
            <Text>思维导图：</Text> 选中节点 → 点击"发送"按钮
          </li>
          <li>
            <Text>DrawIO：</Text> 选中元素 → 点击"发送"按钮
          </li>
        </ul>

        <Title level={4}>导入 AI 响应</Title>
        <Paragraph>
          AI 生成的内容可以直接导入回编辑器：
        </Paragraph>
        <ul>
          <li>
            <Text>Markdown/富文本：</Text> 直接插入文本内容
          </li>
          <li>
            <Text>思维导图：</Text> 导入 JSON 格式的思维导图结构
          </li>
          <li>
            <Text>DrawIO：</Text> 导入 XML 格式的图表数据
          </li>
          <li>
            <Text>代码编辑器：</Text> 插入代码片段
          </li>
        </ul>

        <Title level={4}>自定义助手</Title>
        <Paragraph>
          您可以创建自己的 AI 助手，设置专属的系统提示词和参数。
        </Paragraph>

        <Title level={4}>配置 AI 模型</Title>
        <Paragraph>
          在设置 → 模型管理中，配置您的 AI 模型：
        </Paragraph>
        <ul>
          <li>OpenAI (GPT-4, GPT-3.5)</li>
          <li>Anthropic (Claude)</li>
          <li>Ollama (本地模型)</li>
          <li>智谱 GLM</li>
          <li>其他兼容 OpenAI API 的模型</li>
        </ul>
      </ContentSection>
    ),
  },
  {
    key: "categories-tags",
    icon: <TagOutlined />,
    color: "#fa8c16",
    title: "分类与标签",
    content: (
      <ContentSection>
        <Title level={4}>创建分类</Title>
        <Paragraph>
          在左侧边栏展开"分类"部分，点击"创建分类"按钮。分类支持设置图标和颜色。
        </Paragraph>

        <Title level={4}>管理分类</Title>
        <ul>
          <li>拖拽笔记到分类文件夹中</li>
          <li>右键点击分类进行编辑或删除</li>
          <li>设置分类为公开，供其他用户查看</li>
        </ul>

        <Title level={4}>使用标签</Title>
        <Paragraph>
          标签提供更灵活的分类方式。一个笔记可以拥有多个标签。
        </Paragraph>
        <ul>
          <li>在笔记编辑页面添加标签</li>
          <li>点击标签查看所有相关笔记</li>
          <li>标签支持自定义颜色</li>
        </ul>

        <Title level={4}>分类 vs 标签</Title>
        <Paragraph>
          <Text>
            <Text strong>分类</Text> 适合组织笔记的层级结构，一个笔记只能属于一个分类。
            <Text strong>标签</Text> 适合给笔记打标记，一个笔记可以有多个标签。
          </Text>
        </Paragraph>
      </ContentSection>
    ),
  },
  {
    key: "settings",
    icon: <SettingOutlined />,
    color: "#722ed1",
    title: "设置与配置",
    content: (
      <ContentSection>
        <Title level={4}>主题设置</Title>
        <Paragraph>
          支持亮色/暗色主题切换，也可以跟随系统主题自动切换。
        </Paragraph>

        <Title level={4}>模型管理</Title>
        <Paragraph>
          配置和管理 AI 模型：
        </Paragraph>
        <ul>
          <li>添加新的 AI 模型配置</li>
          <li>设置 API Key 和端点</li>
          <li>调整模型参数（温度、最大 Token 等）</li>
          <li>查看模型使用统计</li>
        </ul>

        <Title level={4}>账户设置</Title>
        <Paragraph>
          管理您的账户信息和安全设置。
        </Paragraph>

        <Title level={4}>编辑器设置</Title>
        <Paragraph>
          自定义编辑器行为：
        </Paragraph>
        <ul>
          <li>自动保存间隔</li>
          <li>字体大小</li>
          <li>编辑器主题</li>
          <li>快捷键配置</li>
        </ul>
      </ContentSection>
    ),
  },
  {
    key: "shortcuts",
    icon: <CodeOutlined />,
    color: "#eb2f96",
    title: "快捷键",
    content: (
      <ContentSection>
        <Paragraph>
          使用快捷键可以大幅提高工作效率：
        </Paragraph>

        <Title level={4}>通用快捷键</Title>
        <ul>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>S</KeyCombo> - 保存当前笔记
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>N</KeyCombo> - 创建新笔记
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>F</KeyCombo> - 搜索笔记
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>B</KeyCombo> - 切换侧边栏
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>/</KeyCombo> - 切换 AI 助手
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>Shift</KeyCombo> + <KeyCombo>A</KeyCombo> -
            发送选中内容到 AI
          </li>
        </ul>

        <Title level={4}>Markdown 编辑器快捷键</Title>
        <ul>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>B</KeyCombo> - 粗体
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>I</KeyCombo> - 斜体
          </li>
          <li>
            <KeyCombo>Ctrl</KeyCombo> + <KeyCombo>K</KeyCombo> - 插入链接
          </li>
          <li>
            <KeyCombo>Tab</KeyCombo> - 增加缩进
          </li>
        </ul>

        <Title level={4}>思维导图快捷键</Title>
        <ul>
          <li>
            <KeyCombo>Tab</KeyCombo> - 添加子节点
          </li>
          <li>
            <KeyCombo>Enter</KeyCombo> - 添加兄弟节点
          </li>
          <li>
            <KeyCombo>Delete</KeyCombo> - 删除节点
          </li>
          <li>
            <KeyCombo>Space</KeyCombo> - 编辑节点
          </li>
        </ul>
      </ContentSection>
    ),
  },
  {
    key: "offline-sync",
    icon: <CloudSyncOutlined />,
    color: "#13c2c2",
    title: "离线使用与同步",
    content: (
      <ContentSection>
        <Paragraph>
          AiNote 采用离线优先架构，支持离线使用和自动同步。
        </Paragraph>

        <Title level={4}>离线使用</Title>
        <Paragraph>
          所有数据优先保存到本地浏览器（IndexedDB），即使断网也能正常使用。
          您的笔记、分类、标签等数据都会立即保存到本地。
        </Paragraph>

        <Title level={4}>自动同步</Title>
        <Paragraph>
          联网后，系统会自动将本地数据同步到云端服务器：
        </Paragraph>
        <ul>
          <li>网络恢复时自动触发同步</li>
          <li>每 30 秒检查一次待同步数据</li>
          <li>同步成功后自动清除待同步标记</li>
        </ul>

        <Title level={4}>冲突解决</Title>
        <Paragraph>
          如果本地和云端都有修改，系统会使用 <CodeBlock>updatedAt</CodeBlock> 时间戳，
          自动保留最新版本的数据。
        </Paragraph>

        <Title level={4}>查看同步状态</Title>
        <Paragraph>
          在设置页面可以查看当前的同步状态和待同步数据数量。
        </Paragraph>
      </ContentSection>
    ),
  },
  {
    key: "faq",
    icon: <QuestionCircleOutlined />,
    color: "#faad14",
    title: "常见问题",
    content: (
      <ContentSection>
        <Title level={4}>Q: 如何切换主题？</Title>
        <Paragraph>
          点击右上角设置图标 → 主题设置 → 选择"亮色"或"暗色"，也可以选择"跟随系统"。
        </Paragraph>

        <Title level={4}>Q: 如何创建自定义 AI 助手？</Title>
        <Paragraph>
          AI 助手面板 → "创建助手" → 填写名称、描述、System Prompt → 保存
        </Paragraph>

        <Title level={4}>Q: 离线时数据会丢失吗？</Title>
        <Paragraph>
          不会。所有数据优先保存到本地 IndexedDB，联网后自动同步到服务器。
        </Paragraph>

        <Title level={4}>Q: 如何恢复删除的笔记？</Title>
        <Paragraph>
          进入回收站页面 → 选择笔记 → 点击"恢复"按钮
        </Paragraph>

        <Title level={4}>Q: 支持哪些 AI 模型？</Title>
        <Paragraph>
          支持 OpenAI、Anthropic、Ollama、LM Studio、智谱 GLM 等多种模型。
          在设置 → 模型管理中配置。
        </Paragraph>

        <Title level={4}>Q: 如何分享笔记给其他人？</Title>
        <Paragraph>
          在笔记详情页点击"设为公开"，然后复制分享链接发送给其他人。
        </Paragraph>

        <Title level={4}>Q: 思维导图如何导出？</Title>
        <Paragraph>
          在思维导图编辑器工具栏点击"导出"，选择格式（PNG、SVG、JSON）。
        </Paragraph>

        <Title level={4}>Q: AI 响应中断了怎么办？</Title>
        <Paragraph>
          点击"重新生成"按钮即可。如果频繁中断，请检查：
          <ul>
            <li>API Key 是否正确</li>
            <li>网络连接是否稳定</li>
            <li>Token 使用量是否超限</li>
          </ul>
        </Paragraph>

        <Title level={4}>Q: 如何查看笔记的历史版本？</Title>
        <Paragraph>
          在笔记编辑页面点击"版本历史"图标，可以查看和恢复之前的版本。
        </Paragraph>
      </ContentSection>
    ),
  },
];

// ============================================
// Main Component
// ============================================

function HelpPage() {
  const [searchText, setSearchText] = useState("");

  // 过滤章节
  const filteredSections = sections.filter(
    (section) =>
      !searchText ||
      section.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (typeof section.content === "object" &&
        JSON.stringify(section.content).toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <HelpContainer>
      {/* 头部 */}
      <Header>
        <StyledTitle level={1}>
          <BookOutlined /> <span className="highlight">使用手册</span>
        </StyledTitle>
        <Subtitle>
          快速了解 AiNote 的功能和使用方法
        </Subtitle>
      </Header>

      {/* 搜索框 */}
      <SearchWrapper>
        <StyledSearch
          placeholder="搜索帮助内容..."
          allowClear
          size="large"
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
        />
      </SearchWrapper>

      {/* 功能标签 */}
      <TagsContainer>
        <FeatureTag color={COLORS.accent}>多编辑器</FeatureTag>
        <FeatureTag color="#52c41a">AI 深度集成</FeatureTag>
        <FeatureTag color="#1890ff">离线优先</FeatureTag>
        <FeatureTag color="#722ed1">自动同步</FeatureTag>
        <FeatureTag color="#fa8c16">版本历史</FeatureTag>
        <FeatureTag color="#eb2f96">思维导图</FeatureTag>
      </TagsContainer>

      <StyledDivider />

      {/* 帮助内容 */}
      <StyledCollapse
        defaultActiveKey={["getting-started"]}
        expandIconPosition="start"
        items={filteredSections.map((section) => ({
          key: section.key,
          label: (
            <span>
              <SectionIcon $color={section.color}>
                {section.icon}
              </SectionIcon>
              {section.title}
            </span>
          ),
          children: <ContentSection>{section.content}</ContentSection>,
        }))}
      />

      <StyledDivider />

      {/* 联系支持 */}
      <SupportCard>
        <div className="support-icon">
          <SafetyOutlined />
        </div>
        <div className="support-title">获取帮助</div>
        <Paragraph>
          如果您在使用过程中遇到问题，可以通过以下方式获取帮助：
        </Paragraph>
        <ul>
          <li>查看本文档的常见问题部分</li>
          <li>在 GitHub 上提交 Issue</li>
          <li>联系技术支持团队</li>
        </ul>
        <Paragraph style={{ marginTop: SPACING.lg, marginBottom: 0 }}>
          <Text type="secondary" style={{ fontStyle: "italic" }}>
            感谢您使用 AiNote！我们会持续改进产品，为您提供更好的使用体验。
          </Text>
        </Paragraph>
      </SupportCard>
    </HelpContainer>
  );
}

export default HelpPage;

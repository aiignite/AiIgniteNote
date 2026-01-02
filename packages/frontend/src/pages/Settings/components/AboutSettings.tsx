import { Descriptions } from "antd";
import {
  GithubOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const SectionContainer = styled.div`
  max-width: 680px;
`;

const HeaderSection = styled.div`
  text-align: center;
  padding: ${SPACING["4xl"]} ${SPACING["3xl"]};
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  margin-bottom: ${SPACING.xl};
  box-shadow: ${SHADOW.sm};
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${SPACING.lg};
  background: ${COLORS.ink};
  border-radius: ${BORDER.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
`;

const AppName = styled.h1`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize["4xl"]};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin: 0 0 ${SPACING.sm} 0;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};

  .accent {
    color: ${COLORS.accent};
    font-style: italic;
  }
`;

const AppTagline = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.inkLight};
  margin: 0 0 ${SPACING.lg} 0;
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
`;

const VersionBadge = styled.span`
  display: inline-block;
  padding: ${SPACING.xs} ${SPACING.lg};
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.full};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.ink};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
`;

const CardSection = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  margin-bottom: ${SPACING.xl};
  box-shadow: ${SHADOW.sm};

  h3 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.lg} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const StyledDescriptions = styled(Descriptions)`
  .ant-descriptions-item-label {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    color: ${COLORS.inkLight};
    padding: ${SPACING.sm} 0;
  }

  .ant-descriptions-item-content {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.ink};
    padding: ${SPACING.sm} 0;
  }
`;

const TechTag = styled.span`
  display: inline-block;
  padding: ${SPACING.xs} ${SPACING.md};
  margin: ${SPACING.xs};
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.ink};
`;

const LinkButton = styled.a`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.md} ${SPACING.lg};
  background: transparent;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.ink};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  text-decoration: none;
  transition: all ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.background};
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
    transform: translateY(-1px);
  }

  .anticon {
    font-size: ${TYPOGRAPHY.fontSize.md};
  }
`;

const LinkSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
`;

const ChangelogList = styled.div`
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  color: ${COLORS.inkLight};

  h4 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.md};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: ${SPACING.lg} 0 ${SPACING.sm} 0;
  }

  ul {
    margin: 0;
    padding-left: ${SPACING.xl};
  }

  li {
    margin-bottom: ${SPACING.xs};
  }
`;

const ThankYouSection = styled.div`
  text-align: center;
  padding: ${SPACING["3xl"]} ${SPACING.xl};
  background: ${COLORS.paperDark};
  border-radius: ${BORDER.radius.md};

  .heart-icon {
    font-size: 32px;
    color: ${COLORS.accent};
    margin-bottom: ${SPACING.md};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0;
    line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  }
`;

// ============================================
// Main Component
// ============================================

export default function AboutSettings() {
  const version = "1.0.0";
  const buildDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SectionContainer>
      {/* 头部 */}
      <HeaderSection>
        <Logo>📝</Logo>
        <AppName>
          Ai<span className="accent">Note</span>
        </AppName>
        <AppTagline>智能笔记应用</AppTagline>
        <VersionBadge>v{version}</VersionBadge>
      </HeaderSection>

      {/* 版本信息 */}
      <CardSection>
        <h3>版本信息</h3>
        <StyledDescriptions column={1} bordered={false}>
          <Descriptions.Item label="版本号">v{version}</Descriptions.Item>
          <Descriptions.Item label="构建日期">{buildDate}</Descriptions.Item>
          <Descriptions.Item label="许可证">MIT License</Descriptions.Item>
          <Descriptions.Item label="运行环境">
            {navigator.userAgent.includes("Mac") ? "macOS" : "Windows/Linux"}
          </Descriptions.Item>
        </StyledDescriptions>
      </CardSection>

      {/* 技术栈 */}
      <CardSection>
        <h3>技术栈</h3>
        <p
          style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.inkLight,
            marginBottom: SPACING.md,
          }}
        >
          本项目采用现代化的技术栈构建
        </p>
        <div>
          <TechTag>React 18</TechTag>
          <TechTag>TypeScript</TechTag>
          <TechTag>Vite</TechTag>
          <TechTag>Zustand</TechTag>
          <TechTag>Ant Design</TechTag>
          <TechTag>Fastify</TechTag>
          <TechTag>Prisma</TechTag>
          <TechTag>TipTap</TechTag>
          <TechTag>Dexie</TechTag>
        </div>
      </CardSection>

      {/* 相关链接 */}
      <CardSection>
        <h3>相关链接</h3>
        <LinkSection>
          <LinkButton
            href="https://github.com/yourusername/ainote"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubOutlined />
            GitHub 仓库
          </LinkButton>
          <LinkButton
            href="https://github.com/yourusername/ainote/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOutlined />
            使用文档
          </LinkButton>
          <LinkButton
            href="https://github.com/yourusername/ainote/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <QuestionCircleOutlined />
            反馈问题
          </LinkButton>
        </LinkSection>
      </CardSection>

      {/* 更新日志 */}
      <CardSection>
        <h3>更新日志</h3>
        <ChangelogList>
          <h4>v1.0.0 ({buildDate})</h4>
          <ul>
            <li>✨ 初始版本发布</li>
            <li>✅ 支持笔记的创建、编辑、删除</li>
            <li>✅ 支持分类管理和标签系统</li>
            <li>✅ 集成 AI 助手功能</li>
            <li>✅ 支持 Markdown 和富文本编辑</li>
            <li>✅ 支持本地数据存储</li>
            <li>🎨 编辑风格的界面设计</li>
          </ul>
        </ChangelogList>
      </CardSection>

      {/* 感谢 */}
      <ThankYouSection>
        <div className="heart-icon">
          <HeartOutlined />
        </div>
        <p>
          感谢所有开源项目的贡献者！
          <br />
          本项目使用了优秀的开源库构建
        </p>
      </ThankYouSection>
    </SectionContainer>
  );
}

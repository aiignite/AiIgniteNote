import { lazy, Suspense, useState } from "react";
import { Spin } from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  BarChartOutlined,
  TeamOutlined,
  BgColorsOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  FolderOutlined,
  TagsOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  NOISE_TEXTURE,
} from "../styles/design-tokens";

// 懒加载设置组件
const AccountSettings = lazy(
  () => import("./Settings/components/AccountSettings"),
);
const ProfileSettings = lazy(
  () => import("./Settings/components/ProfileSettings"),
);
// AI 相关页面
const AiModels = lazy(() => import("./Settings/components/AiModels"));
const AiAssistants = lazy(() => import("./Settings/components/AiAssistants"));
const ConversationHistoryPage = lazy(
  () => import("./Settings/components/ConversationHistoryPage"),
);
const UsageStatisticsPage = lazy(
  () => import("./Settings/components/UsageStatisticsPage"),
);
const UsersManagement = lazy(
  () => import("./Settings/components/UsersManagement"),
);
const AppearanceSettings = lazy(
  () => import("./Settings/components/AppearanceSettings"),
);
const ShortcutsSettings = lazy(
  () => import("./Settings/components/ShortcutsSettings"),
);
const CategoriesSettings = lazy(
  () => import("./Settings/components/CategoriesSettings"),
);
const TagsSettings = lazy(() => import("./Settings/components/TagsSettings"));
const AboutSettings = lazy(() => import("./Settings/components/AboutSettings"));
const ImportExportSettings = lazy(
  () => import("./Settings/components/ImportExportSettings"),
);

// ============================================
// 动画
// ============================================
const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  background: ${COLORS.background};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: ${NOISE_TEXTURE};
    pointer-events: none;
    opacity: 0.5;
  }
`;

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid ${COLORS.subtle};
  background: ${COLORS.paperDark};
  padding: ${SPACING.xl} ${SPACING.lg};
  overflow-y: auto;
  position: relative;
  z-index: 2;
  animation: ${fadeInRight} 0.3s ease-out;

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

const SidebarTitle = styled.h2`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize["3xl"]};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.xl};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
`;

const SectionLabel = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
  text-transform: uppercase;
  color: ${COLORS.inkMuted};
  margin-bottom: ${SPACING.md};
  margin-top: ${SPACING.lg};

  &:first-child {
    margin-top: 0;
  }
`;

const MenuItem = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${SPACING.md};
  padding: ${SPACING.sm} ${SPACING.md};
  margin-bottom: 2px;
  border: none;
  background: transparent;
  border-radius: ${BORDER.radius.sm};
  cursor: pointer;
  transition: all ${TRANSITION.fast};
  color: ${(props) => (props.$active ? COLORS.paper : COLORS.inkLight)};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-family: ${TYPOGRAPHY.fontFamily.body};
  text-align: left;
  position: relative;

  ${(props) =>
    props.$active &&
    `
    background: ${COLORS.accent};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};

    &::before {
      content: "";
      position: absolute;
      left: -${SPACING.lg};
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: ${COLORS.accentHover};
      border-radius: 0 ${BORDER.radius.sm} ${BORDER.radius.sm} 0;
    }
  `}

  &:hover {
    background: ${(props) => (props.$active ? COLORS.accent : COLORS.subtleLight)};
    color: ${COLORS.ink};
  }

  .anticon {
    font-size: ${TYPOGRAPHY.fontSize.md};
    color: ${(props) => (props.$active ? COLORS.paper : COLORS.inkMuted)};
  }
`;

const ContentArea = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING["3xl"]} ${SPACING["4xl"]};
  position: relative;
  z-index: 2;
  animation: ${fadeIn} 0.4s ease-out;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 3px;

    &:hover {
      background: ${COLORS.inkMuted};
    }
  }
`;

const ContentHeader = styled.div`
  margin-bottom: ${SPACING["3xl"]};

  h1 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["5xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.sm} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.md};
    color: ${COLORS.inkLight};
    margin: 0;
    line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

// ============================================
// 设置菜单配置
// ============================================

interface MenuItemConfig {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  section?: string;
}

const menuItems: MenuItemConfig[] = [
  {
    key: "account",
    icon: <UserOutlined />,
    label: "账号",
    description: "管理您的账号信息和安全设置",
    section: "账号",
  },
  {
    key: "profile",
    icon: <IdcardOutlined />,
    label: "个人资料",
    description: "编辑您的个人信息和偏好",
    section: "账号",
  },
  {
    key: "categories",
    icon: <FolderOutlined />,
    label: "分类管理",
    description: "管理笔记分类",
    section: "内容",
  },
  {
    key: "tags",
    icon: <TagsOutlined />,
    label: "标签管理",
    description: "管理笔记标签",
    section: "内容",
  },
  {
    key: "ai-models",
    icon: <ApiOutlined />,
    label: "AI 模型",
    description: "配置和管理 AI 模型",
    section: "AI",
  },
  {
    key: "ai-assistants",
    icon: <ThunderboltOutlined />,
    label: "AI 助手",
    description: "自定义 AI 助手和提示词",
    section: "AI",
  },
  {
    key: "conversation-history",
    icon: <HistoryOutlined />,
    label: "对话历史",
    description: "查看历史对话记录",
    section: "AI",
  },
  {
    key: "usage-statistics",
    icon: <BarChartOutlined />,
    label: "使用统计",
    description: "查看 AI 使用统计数据",
    section: "AI",
  },
  {
    key: "users",
    icon: <TeamOutlined />,
    label: "用户管理",
    description: "管理团队成员和权限",
    section: "团队",
  },
  {
    key: "import-export",
    icon: <ImportOutlined />,
    label: "导入与导出",
    description: "备份或迁移您的笔记数据",
    section: "数据",
  },
  {
    key: "appearance",
    icon: <BgColorsOutlined />,
    label: "外观",
    description: "自定义界面主题和样式",
    section: "偏好",
  },
  {
    key: "shortcuts",
    icon: <KeyOutlined />,
    label: "快捷键",
    description: "查看和自定义快捷键",
    section: "偏好",
  },
  {
    key: "about",
    icon: <InfoCircleOutlined />,
    label: "关于",
    description: "关于 AIIgniteNote",
    section: "其他",
  },
];

// 按section分组
const groupedMenuItems: Record<string, MenuItemConfig[]> = {
  账号: menuItems.filter((item) => item.section === "账号"),
  内容: menuItems.filter((item) => item.section === "内容"),
  AI: menuItems.filter((item) => item.section === "AI"),
  团队: menuItems.filter((item) => item.section === "团队"),
  数据: menuItems.filter((item) => item.section === "数据"),
  偏好: menuItems.filter((item) => item.section === "偏好"),
  其他: menuItems.filter((item) => item.section === "其他"),
};

// ============================================
// Main Component
// ============================================

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("account");

  const activeMenuItem = menuItems.find((item) => item.key === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />;
      case "profile":
        return <ProfileSettings />;
      case "categories":
        return <CategoriesSettings />;
      case "tags":
        return <TagsSettings />;
      case "ai-models":
        return <AiModels />;
      case "ai-assistants":
        return <AiAssistants />;
      case "conversation-history":
        return <ConversationHistoryPage />;
      case "usage-statistics":
        return <UsageStatisticsPage />;
      case "users":
        return <UsersManagement />;
      case "import-export":
        return <ImportExportSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "shortcuts":
        return <ShortcutsSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <Container>
      <Sidebar>
        <SidebarTitle>设置</SidebarTitle>

        {Object.entries(groupedMenuItems).map(([section, items]) =>
          items.length > 0 ? (
            <div key={section}>
              <SectionLabel>{section}</SectionLabel>
              {items.map((item) => (
                <MenuItem
                  key={item.key}
                  $active={activeSection === item.key}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </MenuItem>
              ))}
            </div>
          ) : null,
        )}
      </Sidebar>

      <ContentArea>
        <ContentHeader>
          <h1>{activeMenuItem?.label || "设置"}</h1>
          <p>{activeMenuItem?.description || ""}</p>
        </ContentHeader>

        <Suspense
          fallback={
            <LoadingWrapper>
              <Spin size="large" />
            </LoadingWrapper>
          }
        >
          {renderContent()}
        </Suspense>
      </ContentArea>
    </Container>
  );
}

export default SettingsPage;

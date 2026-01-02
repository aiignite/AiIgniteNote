import { Button, Tooltip, Switch, Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import {
  SunOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../store/settingsStore";
import { useAuthStore } from "../../store/authStore";
import dayjs from "dayjs";
import styled, { css } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
} from "../../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.lg} ${SPACING.xl};
  min-height: 64px;
  background: ${COLORS.paper};
  border-bottom: 1px solid ${COLORS.subtle};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xl};
  flex: 1;
`;

const DateDisplay = styled.div`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  display: flex;
  align-items: baseline;
  gap: ${SPACING.md};
`;

const DateMain = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.normal};
  color: ${COLORS.ink};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
`;

const DateSub = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkMuted};
  font-weight: ${TYPOGRAPHY.fontWeight.light};
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.md};
`;

const ActionButton = styled(Button)<{ $active?: boolean }>`
  height: 36px;
  border-radius: ${BORDER.radius.sm};
  border-color: ${COLORS.subtle};
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.normal};
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
  }

  ${(props) =>
    props.$active &&
    css`
      background: ${COLORS.ink};
      border-color: ${COLORS.ink};
      color: ${COLORS.paper};

      &:hover {
        background: ${COLORS.accent};
        border-color: ${COLORS.accent};
      }
    `}
`;

const IconButton = styled(Button)`
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: ${BORDER.radius.sm};
  border-color: transparent;
  color: ${COLORS.inkMuted};
  transition: all ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.subtleLight};
    color: ${COLORS.ink};
  }
`;

const AIButton = styled(ActionButton)<{ $active: boolean }>`
  background: ${(props) => (props.$active ? COLORS.ink : "transparent")};
  border-color: ${(props) => (props.$active ? COLORS.ink : COLORS.subtle)};
  color: ${(props) => (props.$active ? COLORS.paper : COLORS.inkLight)};

  &:hover {
    background: ${(props) =>
      props.$active ? COLORS.accent : COLORS.subtleLight};
    border-color: ${(props) => (props.$active ? COLORS.accent : COLORS.ink)};
    color: ${(props) => (props.$active ? COLORS.paper : COLORS.ink)};
  }
`;

const ThemeSwitch = styled(Switch)`
  &.ant-switch {
    background: ${COLORS.subtleLight};
  }

  &.ant-switch-checked {
    background: ${COLORS.ink};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.xs} ${SPACING.md};
  border-radius: ${BORDER.radius.md};
  cursor: pointer;
  transition: background ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.subtleLight};
  }
`;

const UserAvatar = styled(Avatar)`
  background: ${COLORS.accent};
  border: 2px solid ${COLORS.paper};
  box-shadow: 0 0 0 1px ${COLORS.subtle};
`;

const UserName = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.ink};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${COLORS.subtle};
  margin: 0 ${SPACING.xs};
`;

// ============================================
// Main Component
// ============================================

interface HeaderProps {
  toggleAIAssistant: () => void;
  aiAssistantVisible: boolean;
}

function Header({ toggleAIAssistant, aiAssistantVisible }: HeaderProps) {
  const navigate = useNavigate();
  const { settings, setTheme } = useSettingsStore();
  const { user, logout } = useAuthStore();

  // 切换主题
  const handleToggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  // 打开设置
  const handleOpenSettings = () => {
    navigate("/settings");
  };

  // 退出登录
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 用户菜单
  const userMenuItems: MenuProps["items"] = [
    {
      key: "user",
      label: (
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.ink,
            }}
          >
            {user?.displayName || user?.username || "用户"}
          </div>
          <div
            style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.inkMuted,
            }}
          >
            {user?.email}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "设置",
      onClick: handleOpenSettings,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  const now = dayjs();

  return (
    <HeaderContainer>
      {/* 左侧：日期显示 */}
      <LeftSection>
        <DateDisplay>
          <DateMain>
            {now.format("MM月DD日")}
            <span style={{ fontStyle: "italic", color: COLORS.accent }}>
              {now.format("dddd")}
            </span>
          </DateMain>
          <DateSub>{now.format("YYYY")}</DateSub>
        </DateDisplay>
      </LeftSection>

      {/* 右侧：操作按钮 */}
      <RightSection>
        {/* AI助手开关 */}
        <AIButton
          $active={aiAssistantVisible}
          icon={<RobotOutlined />}
          onClick={toggleAIAssistant}
        >
          AI助手
        </AIButton>

        <Divider />

        {/* 主题切换 */}
        <Tooltip
          title={
            settings.theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"
          }
        >
          <ThemeSwitch
            checked={settings.theme === "dark"}
            onChange={handleToggleTheme}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </Tooltip>

        {/* 设置按钮 */}
        <Tooltip title="设置">
          <IconButton icon={<SettingOutlined />} onClick={handleOpenSettings} />
        </Tooltip>

        {/* 帮助按钮 */}
        <Tooltip title="帮助">
          <IconButton icon={<QuestionCircleOutlined />} />
        </Tooltip>

        <Divider />

        {/* 用户菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <UserSection>
            <UserAvatar size={32} icon={<UserOutlined />} src={user?.avatar} />
            <UserName>{user?.displayName || user?.username || "用户"}</UserName>
          </UserSection>
        </Dropdown>
      </RightSection>
    </HeaderContainer>
  );
}

export default Header;

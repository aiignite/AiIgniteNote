import { Outlet, useLocation } from "react-router-dom";
import { Layout, Breadcrumb } from "antd";
import styled from "styled-components";
import SettingsMenu from "./SettingsMenu";

const { Content, Sider } = Layout;

const SettingsLayoutContainer = styled(Layout)`
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
`;

const SettingsContent = styled(Content)`
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 64px);
`;

const SettingsSider = styled(Sider)`
  background: #fff;
  border-right: 1px solid #e8e8e8;

  .ant-menu {
    border-right: 0;
  }
`;

const StyledBreadcrumb = styled(Breadcrumb)`
  margin-bottom: 24px;
`;

export default function SettingsLayout() {
  const location = useLocation();

  // 根据当前路径确定选中的菜单
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes("/account")) return "account";
    if (path.includes("/profile")) return "profile";
    if (path.includes("/ai-management")) return "ai-management";
    if (path.includes("/users")) return "users";
    if (path.includes("/sync")) return "sync";
    if (path.includes("/appearance")) return "appearance";
    if (path.includes("/shortcuts")) return "shortcuts";
    if (path.includes("/about")) return "about";
    return "account";
  };

  // 获取面包屑文字
  const getBreadcrumbText = () => {
    const key = getSelectedKey();
    const map: Record<string, string> = {
      account: "账号",
      profile: "个人资料",
      "ai-management": "AI管理",
      users: "用户管理",
      sync: "同步设置",
      appearance: "外观",
      shortcuts: "快捷键",
      about: "关于",
    };
    return map[key] || "账号";
  };

  return (
    <SettingsLayoutContainer>
      <SettingsSider width={240}>
        <div style={{ padding: "16px 0" }}>
          <SettingsMenu
            selectedKey={getSelectedKey()}
            onMenuSelect={() => {}}
          />
        </div>
      </SettingsSider>
      <SettingsContent>
        <StyledBreadcrumb
          items={[
            { title: "首页", href: "/notes" },
            { title: "设置" },
            { title: getBreadcrumbText() },
          ]}
        />
        <Outlet />
      </SettingsContent>
    </SettingsLayoutContainer>
  );
}

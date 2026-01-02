import { useNavigate } from "react-router-dom";
import { Menu } from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  RobotOutlined,
  TeamOutlined,
  CloudSyncOutlined,
  BgColorsOutlined,
  KeyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const menuItems = [
  {
    key: "account",
    icon: <UserOutlined />,
    label: "账号",
    path: "/settings/account",
  },
  {
    key: "profile",
    icon: <IdcardOutlined />,
    label: "个人资料",
    path: "/settings/profile",
  },
  {
    key: "ai-management",
    icon: <RobotOutlined />,
    label: "AI管理",
    path: "/settings/ai-management",
  },
  {
    key: "users",
    icon: <TeamOutlined />,
    label: "用户管理",
    path: "/settings/users",
  },
  {
    key: "sync",
    icon: <CloudSyncOutlined />,
    label: "同步设置",
    path: "/settings/sync",
  },
  {
    key: "appearance",
    icon: <BgColorsOutlined />,
    label: "外观",
    path: "/settings/appearance",
  },
  {
    key: "shortcuts",
    icon: <KeyOutlined />,
    label: "快捷键",
    path: "/settings/shortcuts",
  },
  {
    key: "about",
    icon: <InfoCircleOutlined />,
    label: "关于",
    path: "/settings/about",
  },
];

interface SettingsMenuProps {
  selectedKey: string;
  onMenuSelect: (key: string) => void;
}

export default function SettingsMenu({
  selectedKey,
  onMenuSelect,
}: SettingsMenuProps) {
  const navigate = useNavigate();

  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = menuItems.find((item) => item.key === key);
    if (menuItem) {
      navigate(menuItem.path);
      onMenuSelect(key);
    }
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{
        borderRight: 0,
      }}
    />
  );
}

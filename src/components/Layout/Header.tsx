import { Layout, Button, Space, Tooltip, Switch } from "antd";
import {
  SunOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../store/settingsStore";
import dayjs from "dayjs";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  toggleAIAssistant: () => void;
  aiAssistantVisible: boolean;
}

function Header({ toggleAIAssistant, aiAssistantVisible }: HeaderProps) {
  const navigate = useNavigate();
  const { settings, setTheme } = useSettingsStore();

  // 切换主题
  const handleToggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  // 打开设置
  const handleOpenSettings = () => {
    navigate("/settings");
  };

  return (
    <AntHeader
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* 左侧：面包屑/标题 */}
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
          {dayjs().format("YYYY年MM月DD日 dddd")}
        </h2>
      </div>

      {/* 右侧：操作按钮 */}
      <Space size="middle">
        {/* AI助手开关 */}
        <Tooltip title={aiAssistantVisible ? "隐藏AI助手" : "显示AI助手"}>
          <Button
            type={aiAssistantVisible ? "primary" : "default"}
            icon={<RobotOutlined />}
            onClick={toggleAIAssistant}
          >
            AI助手
          </Button>
        </Tooltip>

        {/* 主题切换 */}
        <Tooltip
          title={
            settings.theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"
          }
        >
          <Switch
            checked={settings.theme === "dark"}
            onChange={handleToggleTheme}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </Tooltip>

        {/* 设置按钮 */}
        <Tooltip title="设置">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleOpenSettings}
          />
        </Tooltip>

        {/* 帮助按钮 */}
        <Tooltip title="帮助">
          <Button type="text" icon={<QuestionCircleOutlined />} />
        </Tooltip>
      </Space>
    </AntHeader>
  );
}

export default Header;

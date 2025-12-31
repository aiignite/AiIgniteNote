import {
  Card,
  Form,
  Switch,
  InputNumber,
  Select,
  Button,
  Divider,
  Space,
  Modal,
  message,
} from "antd";
import { useTheme } from "../styles/theme";
import {
  SaveOutlined,
  UndoOutlined,
  BgColorsOutlined,
  ClockCircleOutlined,
  FontSizeOutlined,
} from "@ant-design/icons";
import { useSettingsStore } from "../store/settingsStore";

function SettingsPage() {
  const { settings, updateSettings, setAutoSave, setFontSize, resetSettings } =
    useSettingsStore();
  const { setTheme } = useTheme();
  const [form] = Form.useForm();


  const handleSave = () => {
    const values = form.getFieldsValue();
    updateSettings(values);
    message.success("设置已保存");
  };

  const handleReset = () => {
    Modal.confirm({
      title: "确认重置",
      content: "确定要恢复默认设置吗？",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        resetSettings();
        form.resetFields();
        message.success("已恢复默认设置");
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onValuesChange={(changedValues) => {
          updateSettings(changedValues);
        }}
      >
        {/* 外观设置 */}
        <Card
          title={
            <Space>
              <BgColorsOutlined />
              外观设置
            </Space>
          }
        >
          <Form.Item
            label="主题"
            name="theme"
            tooltip="选择应用的主题风格"
          >
            <Select
              onChange={(value) => {
                updateSettings({ theme: value });
                setTheme(value);
              }}
              options={[
                { label: "亮色", value: "light" },
                { label: "暗色", value: "dark" },
                { label: "跟随系统", value: "auto" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="字体大小"
            name="fontSize"
            tooltip="编辑器中文字的大小"
          >
            <InputNumber
              min={12}
              max={24}
              suffix="px"
              onChange={(value) => setFontSize(value || 14)}
            />
          </Form.Item>
        </Card>

        <Divider />

        {/* 编辑设置 */}
        <Card
          title={
            <Space>
              <FontSizeOutlined />
              编辑设置
            </Space>
          }
        >
          <Form.Item
            label="自动保存"
            name="autoSave"
            tooltip="编辑时自动保存笔记"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="自动保存间隔"
            name="autoSaveInterval"
            tooltip="自动保存的时间间隔（秒）"
            dependencies={["autoSave"]}
          >
            <InputNumber
              min={10}
              max={300}
              disabled={!settings.autoSave}
              suffix="秒"
              onChange={(value) => setAutoSave(settings.autoSave, value || 30)}
            />
          </Form.Item>

          <Form.Item
            label="拼写检查"
            name="spellCheck"
            tooltip="启用拼写检查功能"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="显示行号"
            name="showLineNumbers"
            tooltip="在代码块中显示行号"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Divider />

        {/* 同步设置 */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              同步设置
            </Space>
          }
        >
          <Form.Item
            label="启用同步"
            name="syncEnabled"
            tooltip="启用数据同步功能（需要配置）"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="语言"
            name="language"
            tooltip="应用界面语言"
          >
            <Select
              options={[
                { label: "简体中文", value: "zh-CN" },
                { label: "English", value: "en-US" },
              ]}
            />
          </Form.Item>
        </Card>

        <Divider />

        {/* 操作按钮 */}
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存设置
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            恢复默认
          </Button>
        </Space>
      </Form>
    </div>
  );
}

export default SettingsPage;

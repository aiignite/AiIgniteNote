import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Tag,
  App,
} from "antd";
import { GlobalOutlined, LockOutlined } from "@ant-design/icons";
import { useModelStore } from "../../store/modelStore";
import { useAuthStore } from "../../store/authStore";
import { useAIStore } from "../../store/aiStore";

// ============================================
// Types
// ============================================

export interface AIAssistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isPublic?: boolean;
  userId?: string;
  isActive: boolean;
}

interface AssistantEditModalProps {
  visible: boolean;
  assistant: AIAssistant | null;
  onCancel: () => void;
  onSave: () => void;
}

// ============================================
// Component
// ============================================

export default function AssistantEditModal({
  visible,
  assistant,
  onCancel,
  onSave,
}: AssistantEditModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { configs } = useModelStore();
  const { user } = useAuthStore();
  const { updateAssistant, createAssistant } = useAIStore();

  // 当 assistant 变化时，更新表单
  useEffect(() => {
    if (assistant) {
      form.setFieldsValue(assistant);
    } else {
      form.resetFields();
      form.setFieldsValue({
        model: "",
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        isPublic: false,
      });
    }
  }, [assistant, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const assistantData: Omit<AIAssistant, "id"> = {
        name: values.name,
        description: values.description,
        systemPrompt: values.systemPrompt,
        avatar: values.avatar,
        model: values.model || "",
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        isActive: values.isActive ?? true,
        isPublic: values.isPublic || false,
      };

      if (assistant) {
        // 更新现有助手
        await updateAssistant(assistant.id, assistantData);
        message.success("更新成功");
      } else {
        // 创建新助手
        await createAssistant(assistantData);
        message.success("创建成功");
      }

      onSave();
    } catch (error: any) {
      console.error("保存助手失败:", error);
      message.error(error.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const isEditingPublicAssistant =
    assistant?.isPublic && assistant?.userId !== user?.id;

  return (
    <Modal
      title={
        <div>
          {assistant ? "编辑助手" : "新建助手"}
          {isEditingPublicAssistant && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              公共助手
            </Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={640}
    >
      {isEditingPublicAssistant && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: 4,
            fontSize: 13,
            color: "#d46b08",
            lineHeight: 1.6,
          }}
        >
          ⚠️ <strong>您正在编辑其他用户创建的公共助手</strong>
          <br />
          <br />
          您的修改将<b>仅保存在本地浏览器</b>中，不会同步到服务器。
          <br />
          • 刷新页面或更换设备后，修改会恢复为原始设置
          <br />• 如需长期使用自定义配置，建议点击"复制"创建自己的副本
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* 第一行: 助手名称 + 图标 */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              label="助手名称"
              name="name"
              rules={[{ required: true, message: "请输入助手名称" }]}
            >
              <Input placeholder="例如: 写作助手" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="图标" name="avatar">
              <Input placeholder="✍️" />
            </Form.Item>
          </Col>
        </Row>

        {/* 第二行: 描述 (占满整行) */}
        <Form.Item
          label="描述"
          name="description"
          rules={[{ required: true, message: "请输入描述" }]}
        >
          <Input.TextArea rows={2} placeholder="简要描述这个助手的用途" />
        </Form.Item>

        {/* 第三行: 使用模型 + 是否启用 + 可见范围 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="使用模型" name="model" initialValue="">
              <Select placeholder="选择模型" allowClear>
                <Select.Option value="">默认模型</Select.Option>
                {configs
                  .filter((c) => c.enabled)
                  .map((config) => (
                    <Select.Option key={config.id} value={config.id}>
                      {config.name} ({config.model})
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="是否启用"
              name="isActive"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="可见范围"
              name="isPublic"
              valuePropName="checked"
              initialValue={false}
              tooltip="公有: 所有人可见但只有你可以修改 | 私有: 只有你可以看到和修改"
            >
              <Switch
                checkedChildren={<GlobalOutlined />}
                unCheckedChildren={<LockOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 第四行: 温度 + 最大Token数 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="温度" name="temperature">
              <InputNumber
                min={0}
                max={2}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="0.7"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="最大Token数" name="maxTokens">
              <InputNumber
                min={100}
                max={200000}
                step={100}
                style={{ width: "100%" }}
                placeholder="2000"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 第五行: 系统提示词 (占满整行) */}
        <Form.Item
          label="系统提示词"
          name="systemPrompt"
          rules={[{ required: true, message: "请输入系统提示词" }]}
          tooltip="定义助手的行为和角色，这将在每次对话时作为系统消息发送给 AI"
        >
          <Input.TextArea
            rows={5}
            placeholder="你是一个专业的写作助手，可以帮助用户润色文章、改进表达..."
          />
        </Form.Item>

        <Divider />

        <div style={{ fontSize: 12, color: "#999" }}>
          <p>
            <strong>系统提示词说明：</strong>
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>系统提示词定义了 AI 助手的行为和角色</li>
            <li>每次对话开始时，系统提示词会首先发送给 AI</li>
            <li>好的提示词能帮助 AI 更好地理解任务和提供准确回答</li>
          </ul>
        </div>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {assistant ? "更新" : "创建"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

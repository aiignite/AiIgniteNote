import { useState, useEffect } from "react";
import {
  Card,
  Button,
  List,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Select,
  App,
  Divider,
} from "antd";
import {
  ApiOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { modelsApi } from "../../../lib/api/models";

const StyledCard = styled(Card)`
  margin-bottom: 16px;

  .ant-card-body {
    padding: 20px;
  }
`;

const StatsRow = styled(Row)`
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
`;

const API_TYPE_OPTIONS = [
  {
    label: "OpenAI 格式",
    value: "openai",
    description: "OpenAI、DeepSeek、Moonshot等",
  },
  {
    label: "Anthropic 格式",
    value: "anthropic",
    description: "Claude、智谱GLM等",
  },
  {
    label: "Ollama 本地",
    value: "ollama",
    description: "本地Ollama部署（无需密钥）",
  },
  {
    label: "LM Studio 本地",
    value: "lmstudio",
    description: "本地LM Studio（无需密钥）",
  },
];

const API_ENDPOINT_TEMPLATES: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  ollama: "http://localhost:11434/api/chat",
  lmstudio: "http://localhost:1234/v1/chat/completions",
};

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  apiType: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
  isDefault: boolean;
}

interface UsageStats {
  totalCalls: number;
  successRate: number;
  totalTokens: number;
}

export default function ModelsSettings() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, UsageStats>>({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // 监听API类型变化，自动填充端点
  const apiType = Form.useWatch("apiType", form);

  useEffect(() => {
    loadModels();
    loadUsageStats();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await modelsApi.getConfigs();
      setModels(response.data);
    } catch (error) {
      message.error("加载模型配置失败");
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await modelsApi.getUsage();
      const data = response.data;

      if (data.byModel && Array.isArray(data.byModel)) {
        const statsMap: Record<string, UsageStats> = {};
        data.byModel.forEach((stat: any) => {
          statsMap[stat.modelId] = {
            totalCalls: stat.totalCalls || 0,
            successRate: stat.successRate || 0,
            totalTokens: stat.totalTokens || 0,
          };
        });
        setUsageStats(statsMap);
      } else {
        setUsageStats({});
      }
    } catch (error) {
      setUsageStats({});
    }
  };

  const handleCreate = () => {
    setEditingModel(null);
    form.resetFields();
    form.setFieldsValue({
      apiType: "openai",
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
    });
    setModalVisible(true);
  };

  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model);
    form.setFieldsValue(model);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await modelsApi.deleteConfig(id);
      message.success("删除成功");
      loadModels();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleToggleDefault = async (model: ModelConfig) => {
    try {
      await modelsApi.updateConfig(model.id, {
        ...model,
        isDefault: !model.isDefault,
      });
      message.success("设置成功");
      loadModels();
    } catch (error) {
      message.error("设置失败");
    }
  };

  const handleToggleEnabled = async (model: ModelConfig) => {
    try {
      await modelsApi.updateConfig(model.id, {
        ...model,
        enabled: !model.enabled,
      });
      message.success("操作成功");
      loadModels();
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingModel) {
        await modelsApi.updateConfig(editingModel.id, values);
        message.success("更新成功");
      } else {
        await modelsApi.createConfig(values);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadModels();
    } catch (error) {
      message.error("操作失败: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getAPITypeInfo = (type: string) => {
    return API_TYPE_OPTIONS.find((t) => t.value === type);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2>模型配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          添加模型
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={models}
        renderItem={(model) => {
          const stats = usageStats[model.id];
          const apiTypeInfo = getAPITypeInfo(model.apiType);
          return (
            <StyledCard
              key={model.id}
              extra={
                <Space>
                  <Tag color="blue">{apiTypeInfo?.label || model.apiType}</Tag>
                  {model.isDefault && (
                    <Tag color="blue" icon={<CheckCircleOutlined />}>
                      默认
                    </Tag>
                  )}
                  {model.enabled ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      启用
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<CloseCircleOutlined />}>
                      禁用
                    </Tag>
                  )}
                </Space>
              }
              actions={[
                <Button
                  key="default"
                  type="text"
                  onClick={() => handleToggleDefault(model)}
                  disabled={model.isDefault}
                >
                  设为默认
                </Button>,
                <Button
                  key="toggle"
                  type="text"
                  onClick={() => handleToggleEnabled(model)}
                >
                  {model.enabled ? "禁用" : "启用"}
                </Button>,
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(model)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定删除这个模型配置吗?"
                  onConfirm={() => handleDelete(model.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                avatar={
                  <ApiOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                }
                title={<Space>{model.name}</Space>}
                description={
                  <div>
                    <div style={{ marginBottom: 12, color: "#666" }}>
                      {model.description || "无描述"}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#999", marginBottom: 12 }}
                    >
                      <div>端点: {model.apiEndpoint}</div>
                      <div>模型: {model.model}</div>
                    </div>
                    {stats && stats.totalCalls > 0 && (
                      <StatsRow gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="调用次数"
                            value={stats.totalCalls}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="成功率"
                            value={stats.successRate}
                            suffix="%"
                            precision={1}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="总Token"
                            value={stats.totalTokens}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                      </StatsRow>
                    )}
                  </div>
                }
              />
            </StyledCard>
          );
        }}
      />

      <Modal
        title={editingModel ? "编辑模型配置" : "添加模型配置"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="配置名称"
            name="name"
            rules={[{ required: true, message: "请输入配置名称" }]}
          >
            <Input placeholder="例如: OpenAI GPT-3.5" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input placeholder="简要描述这个配置" />
          </Form.Item>

          <Form.Item
            label="API 类型"
            name="apiType"
            rules={[{ required: true, message: "请选择API类型" }]}
          >
            <Select>
              {API_TYPE_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  <div>
                    <div>{option.label}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {option.description}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {apiType !== "ollama" && apiType !== "lmstudio" && (
            <Form.Item
              label="API Key"
              name="apiKey"
              rules={
                editingModel
                  ? []
                  : [{ required: true, message: "请输入 API Key" }]
              }
              tooltip={
                apiType === "anthropic"
                  ? "Anthropic API Key (sk-ant-...)"
                  : undefined
              }
            >
              <Input.Password
                placeholder={apiType === "anthropic" ? "sk-ant-..." : "sk-..."}
              />
            </Form.Item>
          )}

          <Form.Item
            label={
              <Space>
                API 端点
                {apiType && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      const template = API_ENDPOINT_TEMPLATES[apiType];
                      if (template) {
                        form.setFieldsValue({ apiEndpoint: template });
                      }
                    }}
                  >
                    使用默认端点
                  </Button>
                )}
              </Space>
            }
            name="apiEndpoint"
            rules={[{ required: true, message: "请输入 API 端点" }]}
          >
            <Input placeholder="https://api.openai.com/v1/chat/completions" />
          </Form.Item>

          <Form.Item
            label="模型 ID"
            name="model"
            rules={[{ required: true, message: "请输入模型 ID" }]}
            tooltip={
              <Space>
                <InfoCircleOutlined />
                <span>
                  {apiType === "ollama" && "例如: llama2, llama3, mistral 等"}
                  {apiType === "anthropic" && "例如: claude-3-sonnet-20240229"}
                  {apiType === "openai" && "例如: gpt-3.5-turbo, gpt-4"}
                  {apiType === "lmstudio" && "本地加载的模型名称"}
                </span>
              </Space>
            }
          >
            <Input placeholder="gpt-3.5-turbo" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="温度" name="temperature">
                <InputNumber
                  min={0}
                  max={2}
                  step={0.1}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最大Token" name="maxTokens">
                <InputNumber
                  min={100}
                  max={32000}
                  step={100}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Top-P" name="topP">
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="是否启用"
            name="enabled"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="设为默认"
            name="isDefault"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Divider />

          <div style={{ fontSize: 12, color: "#999" }}>
            <p>
              <strong>API类型说明：</strong>
            </p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>
                <strong>OpenAI</strong>:
                OpenAI、DeepSeek、Moonshot、通义千问等兼容OpenAI格式的API
              </li>
              <li>
                <strong>Anthropic</strong>:
                Claude系列、智谱GLM等兼容Anthropic格式的API
              </li>
              <li>
                <strong>Ollama</strong>: 本地Ollama部署的开源模型，无需API密钥
              </li>
              <li>
                <strong>LM Studio</strong>: 本地LM Studio部署的模型，无需API密钥
              </li>
            </ul>
          </div>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingModel ? "更新" : "创建"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

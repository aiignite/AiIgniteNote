import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  Segmented,
  App,
  Divider,
  Select,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  ApiOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarsOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";
import { useModelStore } from "../../../store/modelStore";
import { ModelConfig } from "../../../types";
import { db } from "../../../db";
import { modelsApi } from "../../../lib/api/models";

// ============================================
// 动画
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// Styled Components
// ============================================

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${SPACING.lg};

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const Description = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkLight};
  margin: 0;
`;

const ViewToggle = styled(Segmented)`
  .ant-segmented-item {
    border-radius: ${BORDER.radius.sm} !important;
    transition: all ${TRANSITION.fast};
  }
`;

const CardGrid = styled(Row)`
  gap: ${SPACING.lg};
  align-items: stretch;
`;

const ModelCard = styled(Card)`
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  transition: all ${TRANSITION.fast};
  animation: ${fadeIn} 0.3s ease-out;
  background: ${COLORS.paper};
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: ${COLORS.inkLight};
    box-shadow: ${SHADOW.md};
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: ${SPACING.md};
    flex: 1;
    overflow-y: auto;
    max-height: 350px;
  }

  .ant-card-actions {
    background: ${COLORS.background};
    flex-shrink: 0;
    > li {
      margin: 0;

      > span {
        padding: 4px 0;
        font-size: 11px;
        color: ${COLORS.inkLight};
        transition: color ${TRANSITION.fast};

        &:hover {
          color: ${COLORS.accent};
        }
      }
    }
  }
`;

const ModelIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$color || COLORS.background};
  border-radius: ${BORDER.radius.md};
  margin-bottom: ${SPACING.sm};
  font-size: ${TYPOGRAPHY.fontSize.xl};
  color: ${(props) => props.$color || COLORS.ink};
`;

const ModelTitle = styled.div`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.xs};
`;

const ModelDescription = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkLight};
  margin-bottom: ${SPACING.sm};
  min-height: 32px;
  line-height: 1.4;
`;

const ModelMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: ${SPACING.sm};
`;

const StyledTag = styled(Tag)`
  font-size: 11px;
  border-radius: ${BORDER.radius.full};
  padding: 1px 6px;
  margin: 0;
`;

const StatsRow = styled(Row)`
  padding: 6px;
  background: ${COLORS.background};
  border-radius: ${BORDER.radius.sm};
  margin-top: ${SPACING.sm};
`;

const ListItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.md};
  padding: ${SPACING.md};
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  margin-bottom: ${SPACING.sm};
  transition: all ${TRANSITION.fast};
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    border-color: ${COLORS.inkLight};
    box-shadow: ${SHADOW.sm};
  }
`;

const ListItemIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$color || COLORS.background};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xl};
  color: ${(props) => props.$color || COLORS.ink};
  flex-shrink: 0;
`;

const ListItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ListItemTitle = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin-bottom: 4px;
`;

const ListItemMeta = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
  display: flex;
  gap: ${SPACING.sm};
  align-items: center;
  flex-wrap: wrap;
`;

const ListItemActions = styled(Space)`
  flex-shrink: 0;
`;

// ============================================
// Constants
// ============================================

const API_TYPE_OPTIONS = [
  {
    label: "OpenAI 格式",
    value: "openai",
    description: "OpenAI、DeepSeek、Moonshot等",
    color: "green",
    iconColor: "#52c41a",
  },
  {
    label: "Anthropic 格式",
    value: "anthropic",
    description: "Claude、智谱GLM等",
    color: "blue",
    iconColor: "#1890ff",
  },
  {
    label: "Ollama 本地",
    value: "ollama",
    description: "本地Ollama部署（无需密钥）",
    color: "orange",
    iconColor: "#fa8c16",
  },
  {
    label: "LM Studio 本地",
    value: "lmstudio",
    description: "本地LM Studio（无需密钥）",
    color: "purple",
    iconColor: "#722ed1",
  },
];

const API_ENDPOINT_TEMPLATES: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234/v1",
};

type ViewMode = "list" | "grid";

// ============================================
// Types
// ============================================

interface UsageStats {
  totalCalls: number;
  successRate: number;
  totalTokens: number;
}

// ============================================
// Main Component
// ============================================

export default function AiModels() {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [detectingModels, setDetectingModels] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { configs, loadConfigs, updateConfig, deleteConfig, createConfig } =
    useModelStore();

  // 加载状态（使用统计数据）
  const [usageStats, setUsageStats] = useState<Record<string, UsageStats>>({});

  useEffect(() => {
    loadConfigs();
    loadUsageStats();
  }, []);

  const apiType = Form.useWatch("apiType", form);

  // 当 apiType 变化时，自动设置端点并检测本地模型
  useEffect(() => {
    if (!modalVisible || !apiType) return; // 只在模态框打开时响应

    const autoDetect = async () => {
      if (apiType === "ollama") {
        const template = API_ENDPOINT_TEMPLATES.ollama;
        form.setFieldsValue({
          apiEndpoint: template,
          temperature: 0.8,
          maxTokens: 2048,
        });
        setDetectedModels([]);
        // 等待表单更新后自动检测
        await new Promise((resolve) => setTimeout(resolve, 100));
        await handleDetectModels();
      } else if (apiType === "lmstudio") {
        const template = API_ENDPOINT_TEMPLATES.lmstudio;
        form.setFieldsValue({
          apiEndpoint: template,
          temperature: 0.7,
          maxTokens: 4096,
        });
        setDetectedModels([]);
        // 等待表单更新后自动检测
        await new Promise((resolve) => setTimeout(resolve, 100));
        await handleDetectModels();
      } else {
        setDetectedModels([]);
      }
    };

    autoDetect();
  }, [apiType, modalVisible]);

  const loadUsageStats = async () => {
    try {
      // 从 IndexedDB 加载使用日志
      const allLogs = await db.usageLogs.toArray();

      // 按模型分组统计
      const statsMap: Record<string, UsageStats> = {};
      const successMap: Record<string, number> = {};

      for (const log of allLogs) {
        const modelId = log.modelId || "unknown";
        if (!statsMap[modelId]) {
          statsMap[modelId] = {
            totalCalls: 0,
            successRate: 0,
            totalTokens: 0,
          };
          successMap[modelId] = 0;
        }

        statsMap[modelId].totalCalls++;

        // 统计成功次数
        if (log.success !== false) {
          successMap[modelId]++;
        }

        // 统计 tokens
        const inputTokens = (log as any).inputTokens || 0;
        const outputTokens = (log as any).outputTokens || 0;
        statsMap[modelId].totalTokens += inputTokens + outputTokens;
      }

      // 计算成功率
      for (const modelId in statsMap) {
        const stat = statsMap[modelId];
        stat.successRate =
          stat.totalCalls > 0
            ? (successMap[modelId] / stat.totalCalls) * 100
            : 0;
      }

      setUsageStats(statsMap);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
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
    setDetectedModels([]);
    setModalVisible(true);
  };

  // 检测本地模型
  const handleDetectModels = async () => {
    const endpoint = form.getFieldValue("apiEndpoint");
    const currentApiType = form.getFieldValue("apiType"); // 直接从表单获取当前值

    if (!endpoint) {
      message.warning("请先输入 API 端点");
      return;
    }

    if (!currentApiType) {
      message.warning("请先选择 API 类型");
      return;
    }

    setDetectingModels(true);
    try {
      console.log("开始检测模型...", { currentApiType, endpoint });
      const response = await modelsApi.detectModels({
        apiType: currentApiType,
        apiEndpoint: endpoint,
      });
      const models = response.data?.models || [];
      console.log("检测到的模型:", models);

      if (models.length === 0) {
        message.warning("未检测到可用模型，请确认服务已启动");
        setDetectedModels([]);
      } else {
        message.success(`检测到 ${models.length} 个模型`);
        setDetectedModels(models);
        // 自动选择第一个模型
        form.setFieldValue("model", models[0]);
      }
    } catch (error: any) {
      console.error("检测模型失败:", error);
      const errorMsg =
        error.response?.data?.error?.message || error.message || "未知错误";
      message.error(`检测失败: ${errorMsg}`);
      setDetectedModels([]);
    } finally {
      setDetectingModels(false);
    }
  };

  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model);
    form.setFieldsValue(model);
    setDetectedModels([]); // 清空检测的模型
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id);
      message.success("删除成功");
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 确保 Ollama 和 LM Studio 有空的 apiKey
      if ((values.apiType === "ollama" || values.apiType === "lmstudio") && !values.apiKey) {
        values.apiKey = "";
      }

      if (editingModel) {
        await updateConfig(editingModel.id, values);
        message.success("更新成功");
      } else {
        await createConfig(values);
        message.success("创建成功");
      }
      setModalVisible(false);
    } catch (error: any) {
      message.error("操作失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDefault = async (model: ModelConfig) => {
    try {
      await updateConfig(model.id, { isDefault: !model.isDefault });
      message.success("设置成功");
    } catch (error) {
      message.error("设置失败");
    }
  };

  const handleToggleEnabled = async (model: ModelConfig) => {
    try {
      await updateConfig(model.id, { enabled: !model.enabled });
      message.success("操作成功");
    } catch (error) {
      message.error("操作失败");
    }
  };

  const getAPITypeInfo = (type: string) => {
    return API_TYPE_OPTIONS.find((t) => t.value === type);
  };

  // 渲染模型卡片（网格视图）
  const renderModelCard = (model: ModelConfig) => {
    const stats = usageStats[model.id];
    const apiTypeInfo = getAPITypeInfo(model.apiType);

    return (
      <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={4}>
        <ModelCard
          actions={[
            <Button
              key="default"
              type="text"
              size="small"
              style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }}
              disabled={model.isDefault}
              onClick={() => handleToggleDefault(model)}
            >
              {model.isDefault ? "默认" : "设默认"}
            </Button>,
            <Button
              key="toggle"
              type="text"
              size="small"
              style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }}
              onClick={() => handleToggleEnabled(model)}
            >
              {model.enabled ? "禁用" : "启用"}
            </Button>,
            <Button
              key="edit"
              type="text"
              size="small"
              style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }}
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
              <Button type="text" size="small" danger style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }} icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>,
          ]}
        >
          <ModelIcon $color={apiTypeInfo?.iconColor}>
            <ApiOutlined />
          </ModelIcon>
          <ModelTitle>{model.name}</ModelTitle>
          <ModelDescription>{model.description || "暂无描述"}</ModelDescription>
          <ModelMeta>
            <StyledTag color={apiTypeInfo?.color || "default"}>
              {apiTypeInfo?.label || model.apiType}
            </StyledTag>
            {model.isDefault && (
              <StyledTag color="blue" icon={<CheckCircleOutlined />}>
                默认
              </StyledTag>
            )}
            {model.enabled ? (
              <StyledTag color="green" icon={<CheckCircleOutlined />}>
                启用
              </StyledTag>
            ) : (
              <StyledTag color="red" icon={<CloseCircleOutlined />}>
                禁用
              </StyledTag>
            )}
          </ModelMeta>
          <div style={{ fontSize: 11, color: COLORS.inkMuted, lineHeight: 1.4 }}>
            <div>模型: {model.model}</div>
            <div style={{ marginTop: 2 }}>
              端点: {model.apiEndpoint.slice(0, 25)}
              {model.apiEndpoint.length > 25 ? "..." : ""}
            </div>
          </div>
          {stats && stats.totalCalls > 0 && (
            <StatsRow gutter={8}>
              <Col span={8}>
                <Statistic
                  title="调用"
                  value={stats.totalCalls}
                  valueStyle={{ fontSize: 12 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="成功率"
                  value={stats.successRate}
                  suffix="%"
                  precision={1}
                  valueStyle={{ fontSize: 12 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Token"
                  value={stats.totalTokens}
                  valueStyle={{ fontSize: 12 }}
                />
              </Col>
            </StatsRow>
          )}
        </ModelCard>
      </Col>
    );
  };

  // 渲染列表项（列表视图）
  const renderListItem = (model: ModelConfig) => {
    const stats = usageStats[model.id];
    const apiTypeInfo = getAPITypeInfo(model.apiType);

    return (
      <ListItemContainer key={model.id}>
        <ListItemIcon $color={apiTypeInfo?.iconColor}>
          <ApiOutlined />
        </ListItemIcon>
        <ListItemContent>
          <ListItemTitle>{model.name}</ListItemTitle>
          <ListItemMeta>
            <StyledTag color={apiTypeInfo?.color || "default"}>
              {apiTypeInfo?.label || model.apiType}
            </StyledTag>
            {model.isDefault && (
              <StyledTag color="blue" icon={<CheckCircleOutlined />}>
                默认
              </StyledTag>
            )}
            {model.enabled ? (
              <StyledTag color="green" icon={<CheckCircleOutlined />}>
                启用
              </StyledTag>
            ) : (
              <StyledTag color="red" icon={<CloseCircleOutlined />}>
                禁用
              </StyledTag>
            )}
            <span>模型: {model.model}</span>
            {stats && stats.totalCalls > 0 && (
              <span>
                调用 {stats.totalCalls} 次 · 成功率 {stats.successRate}%
              </span>
            )}
          </ListItemMeta>
        </ListItemContent>
        <ListItemActions>
          <Button
            size="small"
            disabled={model.isDefault}
            onClick={() => handleToggleDefault(model)}
          >
            设为默认
          </Button>
          <Button size="small" onClick={() => handleToggleEnabled(model)}>
            {model.enabled ? "禁用" : "启用"}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(model)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个模型配置吗?"
            onConfirm={() => handleDelete(model.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </ListItemActions>
      </ListItemContainer>
    );
  };

  return (
    <Container>
      <Header>
        <div>
          <h2>AI 模型</h2>
          <Description>
            配置和管理 AI 模型，支持多种 API 格式和本地模型
          </Description>
        </div>
        <Space>
          <ViewToggle
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { label: "列表", value: "list", icon: <BarsOutlined /> },
              { label: "卡片", value: "grid", icon: <AppstoreOutlined /> },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加模型
          </Button>
        </Space>
      </Header>

      {viewMode === "grid" ? (
        <CardGrid gutter={16}>{configs.map(renderModelCard)}</CardGrid>
      ) : (
        <div>
          {configs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: SPACING["3xl"],
                color: COLORS.inkMuted,
              }}
            >
              暂无模型配置，点击右上角"添加模型"进行添加
            </div>
          ) : (
            configs.map(renderListItem)
          )}
        </div>
      )}

      {/* 添加/编辑模型弹窗 */}
      <Modal
        title={editingModel ? "编辑模型配置" : "添加模型配置"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="配置名称"
                name="name"
                rules={[{ required: true, message: "请输入配置名称" }]}
              >
                <Input placeholder="例如: OpenAI GPT-3.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Form.Item label="描述" name="description">
            <Input placeholder="简要描述这个配置" />
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
            label={
              <Space>
                模型 ID
                {(apiType === "ollama" || apiType === "lmstudio") && (
                  <Button
                    type="link"
                    size="small"
                    onClick={handleDetectModels}
                    loading={detectingModels}
                    icon={<SearchOutlined />}
                  >
                    检测模型
                  </Button>
                )}
              </Space>
            }
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
            {detectedModels.length > 0 ? (
              <Select
                placeholder="选择检测到的模型"
                showSearch
                allowClear
                optionFilterProp="children"
              >
                {detectedModels.map((model) => (
                  <Select.Option key={model} value={model}>
                    {model}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input placeholder="gpt-3.5-turbo" />
            )}
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
                  max={256000}
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

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="是否启用"
                name="enabled"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="设为默认"
                name="isDefault"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
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
    </Container>
  );
}

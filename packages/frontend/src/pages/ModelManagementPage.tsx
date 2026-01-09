import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Divider,
  Statistic,
  Row,
  Col,
  Progress,
  Switch,
  App,
  Select,
  message,
} from "antd";
import {
  ApiOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useModelStore } from "../store/modelStore";
import { ModelConfig } from "../types";
import dayjs from "dayjs";
import { modelsApi } from "../lib/api/models";

const { Option } = Select;

function ModelManagementPage() {
  const { message: messageApi } = App.useApp();
  const {
    configs,
    currentConfig,
    usageLogs,
    quota,
    isLoading,
    isDetecting,
    detectedModels,
    loadConfigs,
    loadUsageLogs,
    createConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    detectModels,
    clearDetectedModels,
  } = useModelStore();

  const [form] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [apiType, setApiType] = useState<string>("openai");

  useEffect(() => {
    loadConfigs();
    console.log("ModelManagementPage 组件已加载");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentConfig) {
      loadUsageLogs(currentConfig.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConfig?.id]);

  // 打开新建/编辑模态框
  const handleOpenEditModal = async (config?: ModelConfig) => {
    if (config) {
      // 编辑模式：先从服务器获取完整配置（包括 API Key）
      setLoadingConfig(true);
      try {
        const response = await modelsApi.getConfigWithKey(config.id);
        const fullConfig = response.data;
        setEditingConfig(fullConfig);
        form.setFieldsValue(fullConfig);
        setApiType(fullConfig.apiType || "openai");
      } catch (error) {
        console.error("Failed to load config:", error);
        messageApi.error("加载配置失败");
        // 如果加载失败，使用本地配置
        setEditingConfig(config);
        form.setFieldsValue(config);
        setApiType(config.apiType || "openai");
      } finally {
        setLoadingConfig(false);
      }
    } else {
      // 新建模式
      setEditingConfig(null);
      form.resetFields();
      setApiType("openai");
    }
    clearDetectedModels();
    setEditModalVisible(true);
  };

  // 检测模型
  const handleDetectModels = async () => {
    const endpoint = form.getFieldValue("apiEndpoint");
    const apiKey = form.getFieldValue("apiKey");
    const currentApiType = form.getFieldValue("apiType"); // 直接从表单获取当前值

    if (!endpoint) {
      messageApi.warning("请先输入 API 端点");
      return;
    }

    if (!currentApiType) {
      messageApi.warning("请先选择 API 类型");
      return;
    }

    console.log("开始检测模型...", { currentApiType, endpoint });

    try {
      const models = await detectModels(currentApiType, endpoint, apiKey);
      console.log("检测到的模型:", models);

      if (models.length === 0) {
        messageApi.warning("未检测到可用模型，请确认服务已启动");
      } else {
        messageApi.success(`检测到 ${models.length} 个模型`);
        // 自动选择第一个模型
        form.setFieldValue("model", models[0]);
      }
    } catch (error: any) {
      console.error("检测模型失败:", error);
      const errorMsg =
        error.response?.data?.error?.message || error.message || "未知错误";
      messageApi.error(`检测失败: ${errorMsg}`);
    }
  };

  // 处理 API 类型变更
  const handleApiTypeChange = async (value: string) => {
    console.log("API类型变更:", value);
    setApiType(value);
    clearDetectedModels();

    // 设置默认端点和参数（统一使用基础 URL）
    if (value === "ollama") {
      form.setFieldsValue({
        apiEndpoint: "http://localhost:11434",
        apiKey: "",
        temperature: 0.8,
        maxTokens: 2048,
        topP: 0.9,
      });
      // 等待表单更新后再检测
      await new Promise((resolve) => setTimeout(resolve, 100));
      handleDetectModels();
    } else if (value === "lmstudio") {
      form.setFieldsValue({
        apiEndpoint: "http://localhost:1234", // 简化，后端会自动处理路径
        apiKey: "",
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.95,
      });
      // 等待表单更新后再检测
      await new Promise((resolve) => setTimeout(resolve, 100));
      handleDetectModels();
    } else if (value === "openai") {
      form.setFieldsValue({
        apiEndpoint: "https://api.openai.com/v1",
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
      });
    } else if (value === "anthropic") {
      form.setFieldsValue({
        apiEndpoint: "https://api.anthropic.com/v1",
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
      });
    } else if (value === "glm") {
      form.setFieldsValue({
        apiEndpoint: "https://open.bigmodel.cn/api/paas/v4",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
      });
    }
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();

      if (editingConfig) {
        await updateConfig(editingConfig.id, values);
        messageApi.success("配置更新成功");
      } else {
        await createConfig({
          ...values,
          enabled: false,
        });
        messageApi.success("配置创建成功");
      }

      setEditModalVisible(false);
      loadConfigs();
    } catch (error) {
      messageApi.error("操作失败");
    }
  };

  // 删除配置
  const handleDeleteConfig = async (config: ModelConfig) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除配置"${config.name}"吗？`,
      okText: "确定",
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteConfig(config.id);
          messageApi.success("删除成功");
          loadConfigs();
        } catch (error) {
          messageApi.error("删除失败");
        }
      },
    });
  };

  // 启用/禁用配置
  const handleToggleEnabled = async (config: ModelConfig, enabled: boolean) => {
    try {
      // 如果启用，先禁用其他配置
      if (enabled) {
        for (const c of configs) {
          if (c.id !== config.id && c.enabled) {
            await updateConfig(c.id, { enabled: false });
          }
        }
      }

      await updateConfig(config.id, { enabled });
      messageApi.success(enabled ? "已启用" : "已禁用");
      loadConfigs();
    } catch (error) {
      messageApi.error("操作失败");
    }
  };

  // 测试连接
  const handleTestConnection = async (config: ModelConfig) => {
    setTesting(true);
    try {
      // 需要获取完整配置（包括 API Key）
      const response = await modelsApi.getConfigWithKey(config.id);
      const fullConfig = response.data;
      const success = await testConnection(fullConfig);
      if (success) {
        messageApi.success("连接测试成功");
      } else {
        messageApi.error("连接测试失败");
      }
    } catch (error) {
      messageApi.error("连接测试失败");
    } finally {
      setTesting(false);
    }
  };

  // 配置表格列
  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ModelConfig) => (
        <Space>
          <ApiOutlined />
          <span>{text}</span>
          {record.enabled && <Tag color="success">已启用</Tag>}
        </Space>
      ),
    },
    {
      title: "模型",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "API端点",
      dataIndex: "apiEndpoint",
      key: "apiEndpoint",
      ellipsis: true,
    },
    {
      title: "温度",
      dataIndex: "temperature",
      key: "temperature",
      render: (value: number) => value.toFixed(1),
    },
    {
      title: "最大Token",
      dataIndex: "maxTokens",
      key: "maxTokens",
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: ModelConfig) => (
        <Space>
          <Switch
            checked={record.enabled}
            onChange={(checked) => handleToggleEnabled(record, checked)}
            size="small"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            onClick={() => handleTestConnection(record)}
            loading={testing}
          >
            测试
          </Button>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfig(record)}
          />
        </Space>
      ),
    },
  ];

  // 使用日志表格列
  const logColumns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: number) =>
        dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作类型",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        const actionMap: Record<string, string> = {
          generate: "内容生成",
          rewrite: "改写润色",
          summarize: "摘要提取",
          keywords: "关键词生成",
          expand: "内容扩展",
          translate: "翻译",
          fixGrammar: "语法修正",
          custom: "自定义",
        };
        return actionMap[action] || action;
      },
    },
    {
      title: "输入Token",
      dataIndex: "inputTokens",
      key: "inputTokens",
    },
    {
      title: "输出Token",
      dataIndex: "outputTokens",
      key: "outputTokens",
    },
    {
      title: "状态",
      dataIndex: "success",
      key: "success",
      render: (success: boolean) =>
        success ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            成功
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            失败
          </Tag>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* 左侧：模型配置 */}
        <Col span={16}>
          <Card
            title="模型配置"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenEditModal()}
              >
                添加配置
              </Button>
            }
          >
            <Table
              dataSource={configs}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={false}
            />
          </Card>

          <Divider />

          {/* 使用日志 */}
          <Card title="调用日志">
            <Table
              dataSource={usageLogs}
              columns={logColumns}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        {/* 右侧：统计信息 */}
        <Col span={8}>
          {/* 配额统计 */}
          <Card title="使用配额">
            {quota ? (
              <>
                <Statistic
                  title="已用Token"
                  value={quota.used}
                  suffix={`/ ${quota.total}`}
                  prefix={<DollarOutlined />}
                />
                <Progress
                  percent={Math.round((quota.used / quota.total) * 100)}
                  status="active"
                  style={{ marginTop: 16 }}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "rgba(0, 0, 0, 0.45)",
                  }}
                >
                  重置时间: {dayjs(quota.resetAt).format("YYYY-MM-DD HH:mm")}
                </div>
              </>
            ) : (
              <p style={{ color: "rgba(0, 0, 0, 0.45)" }}>暂无配额信息</p>
            )}
          </Card>

          <Divider />

          {/* 快速统计 */}
          <Card title="快速统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总调用次数"
                  value={usageLogs.length}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="成功次数"
                  value={usageLogs.filter((l) => l.success).length}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="总输入Token"
                  value={usageLogs.reduce((sum, l) => sum + l.inputTokens, 0)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="总输出Token"
                  value={usageLogs.reduce((sum, l) => sum + l.outputTokens, 0)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 编辑模态框 */}
      <Modal
        title={editingConfig ? "编辑配置" : "添加配置"}
        open={editModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => {
          setEditModalVisible(false);
          clearDetectedModels();
        }}
        width={600}
        confirmLoading={loadingConfig}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="配置名称"
            name="name"
            rules={[{ required: true, message: "请输入配置名称" }]}
          >
            <Input placeholder="例如: GML-4.7" />
          </Form.Item>

          <Form.Item
            label="API类型"
            name="apiType"
            initialValue="openai"
            rules={[{ required: true, message: "请选择API类型" }]}
          >
            <Select onChange={handleApiTypeChange}>
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic">Anthropic</Option>
              <Option value="ollama">Ollama</Option>
              <Option value="lmstudio">LM Studio</Option>
              <Option value="glm">智谱 GLM</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="apiKey"
            rules={
              apiType === "ollama" || apiType === "lmstudio"
                ? []
                : [{ required: true, message: "请输入API密钥" }]
            }
          >
            <Input.Password
              placeholder={
                apiType === "ollama" || apiType === "lmstudio"
                  ? "本地模型无需密钥"
                  : "请输入API密钥"
              }
            />
          </Form.Item>

          <Form.Item
            label="API端点"
            name="apiEndpoint"
            rules={[{ required: true, message: "请输入API端点" }]}
            extra={
              <Space style={{ fontSize: 12, color: "#999" }}>
                <span>
                  {apiType === "ollama" && "默认: http://localhost:11434"}
                  {apiType === "lmstudio" && "默认: http://localhost:1234"}
                  {apiType === "openai" && "OpenAI API 端点"}
                  {apiType === "anthropic" && "Anthropic API 端点"}
                  {apiType === "glm" && "智谱 GLM API 端点"}
                </span>
                {(apiType === "ollama" || apiType === "lmstudio") && (
                  <Button
                    size="small"
                    type="link"
                    icon={<SearchOutlined />}
                    onClick={handleDetectModels}
                    loading={isDetecting}
                  >
                    检测模型
                  </Button>
                )}
              </Space>
            }
          >
            <Input
              placeholder={
                apiType === "ollama"
                  ? "http://localhost:11434"
                  : apiType === "lmstudio"
                    ? "http://localhost:1234"
                    : apiType === "openai"
                      ? "https://api.openai.com/v1"
                      : apiType === "anthropic"
                        ? "https://api.anthropic.com/v1"
                        : apiType === "glm"
                          ? "https://open.bigmodel.cn/api/paas/v4"
                          : "https://api.example.com/v1"
              }
            />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model"
            rules={[{ required: true, message: "请选择或输入模型名称" }]}
          >
            {detectedModels.length > 0 ? (
              <Select
                placeholder="选择检测到的模型"
                showSearch
                allowClear
                optionFilterProp="children"
                optionLabelProp="label"
              >
                {detectedModels.map((model) => (
                  <Option key={model} value={model} label={model}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={model}>
                      {model}
                    </div>
                  </Option>
                ))}
              </Select>
            ) : (
              <Input
                placeholder={
                  apiType === "ollama"
                    ? "例如: llama2"
                    : apiType === "lmstudio"
                      ? "例如: gpt-3.5-turbo"
                      : apiType === "glm"
                        ? "glm-4"
                        : "gpt-4"
                }
              />
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="温度" name="temperature" initialValue={0.7}>
                <Input type="number" step={0.1} min={0} max={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最大Token" name="maxTokens" initialValue={2000}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Top P" name="topP" initialValue={0.9}>
                <Input type="number" step={0.1} min={0} max={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default ModelManagementPage;

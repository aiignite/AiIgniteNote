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
} from "antd";
import {
  ApiOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useModelStore } from "../store/modelStore";
import { ModelConfig } from "../types";
import dayjs from "dayjs";

function ModelManagementPage() {
  const { message } = App.useApp();
  const {
    configs,
    currentConfig,
    usageLogs,
    quota,
    isLoading,
    loadConfigs,
    loadUsageLogs,
    createConfig,
    updateConfig,
    deleteConfig,
    testConnection,
  } = useModelStore();

  const [form] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentConfig) {
      loadUsageLogs(currentConfig.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConfig?.id]);

  // 打开新建/编辑模态框
  const handleOpenEditModal = (config?: ModelConfig) => {
    if (config) {
      setEditingConfig(config);
      form.setFieldsValue(config);
    } else {
      setEditingConfig(null);
      form.resetFields();
    }
    setEditModalVisible(true);
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();

      if (editingConfig) {
        await updateConfig(editingConfig.id, values);
        message.success("配置更新成功");
      } else {
        await createConfig({
          ...values,
          enabled: false,
        });
        message.success("配置创建成功");
      }

      setEditModalVisible(false);
      loadConfigs();
    } catch (error) {
      message.error("操作失败");
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
          message.success("删除成功");
          loadConfigs();
        } catch (error) {
          message.error("删除失败");
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
      message.success(enabled ? "已启用" : "已禁用");
      loadConfigs();
    } catch (error) {
      message.error("操作失败");
    }
  };

  // 测试连接
  const handleTestConnection = async (config: ModelConfig) => {
    setTesting(true);
    try {
      const success = await testConnection(config);
      if (success) {
        message.success("连接测试成功");
      } else {
        message.error("连接测试失败");
      }
    } catch (error) {
      message.error("连接测试失败");
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
        onCancel={() => setEditModalVisible(false)}
        width={600}
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
            label="API密钥"
            name="apiKey"
            rules={[{ required: true, message: "请输入API密钥" }]}
          >
            <Input.Password placeholder="请输入API密钥" />
          </Form.Item>

          <Form.Item
            label="API端点"
            name="apiEndpoint"
            rules={[{ required: true, message: "请输入API端点" }]}
          >
            <Input placeholder="https://open.bigmodel.cn/api/paas/v4/chat/completions" />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model"
            rules={[{ required: true, message: "请输入模型名称" }]}
          >
            <Input placeholder="glm-4" />
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

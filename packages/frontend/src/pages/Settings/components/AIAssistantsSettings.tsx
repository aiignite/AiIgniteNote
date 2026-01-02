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
  message,
  Popconfirm,
} from "antd";
import {
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { aiApi } from "../../../lib/api/ai";

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ant-card-body {
    padding: 16px;
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

interface AIAssistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isBuiltIn: boolean;
  isActive: boolean;
}

export default function AIAssistantsSettings() {
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<AIAssistant | null>(
    null,
  );
  const [form] = Form.useForm();

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const response = await aiApi.getAssistants();
      setAssistants(response.data);
    } catch (error) {
      message.error("加载助手列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAssistant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (assistant: AIAssistant) => {
    setEditingAssistant(assistant);
    form.setFieldsValue(assistant);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await aiApi.deleteAssistant(id);
      message.success("删除成功");
      loadAssistants();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingAssistant) {
        await aiApi.updateAssistant(editingAssistant.id, values);
        message.success("更新成功");
      } else {
        await aiApi.createAssistant(values);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadAssistants();
    } catch (error) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
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
        <h2>AI助手管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建助手
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={assistants}
        grid={{ gutter: 16, column: 2 }}
        renderItem={(assistant) => (
          <List.Item>
            <StyledCard
              hoverable
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(assistant)}
                >
                  编辑
                </Button>,
                !assistant.isBuiltIn && (
                  <Popconfirm
                    key="delete"
                    title="确定删除这个助手吗?"
                    onConfirm={() => handleDelete(assistant.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <Card.Meta
                avatar={
                  <Avatar>{assistant.avatar || <RobotOutlined />}</Avatar>
                }
                title={
                  <Space>
                    {assistant.name}
                    {assistant.isBuiltIn && <Tag color="blue">内置</Tag>}
                    {assistant.isActive && <Tag color="green">启用</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      {assistant.description}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      模型: {assistant.model}
                    </div>
                  </div>
                }
              />
            </StyledCard>
          </List.Item>
        )}
      />

      <Modal
        title={editingAssistant ? "编辑助手" : "新建助手"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="助手名称"
            name="name"
            rules={[{ required: true, message: "请输入助手名称" }]}
          >
            <Input placeholder="例如: 写作助手" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: "请输入描述" }]}
          >
            <Input.TextArea rows={2} placeholder="简要描述这个助手的用途" />
          </Form.Item>

          <Form.Item label="图标" name="avatar">
            <Input placeholder="例如: ✍️" />
          </Form.Item>

          <Form.Item
            label="系统提示词"
            name="systemPrompt"
            rules={[{ required: true, message: "请输入系统提示词" }]}
          >
            <Input.TextArea rows={4} placeholder="定义助手的行为和角色" />
          </Form.Item>

          <Form.Item
            label="模型"
            name="model"
            rules={[{ required: true, message: "请选择模型" }]}
          >
            <Input placeholder="例如: gpt-3.5-turbo" />
          </Form.Item>

          <Form.Item label="温度" name="temperature">
            <InputNumber min={0} max={2} step={0.1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="最大Token数" name="maxTokens">
            <InputNumber
              min={100}
              max={8000}
              step={100}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="是否启用"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingAssistant ? "更新" : "创建"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

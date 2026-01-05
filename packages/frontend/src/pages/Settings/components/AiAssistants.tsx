import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
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
  Segmented,
  App,
  Divider,
  Select,
  Row,
  Col,
} from "antd";
import {
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  BarsOutlined,
  AppstoreOutlined,
  CopyOutlined,
  GlobalOutlined,
  LockOutlined,
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
import { useAIStore } from "../../../store/aiStore";
import { useModelStore } from "../../../store/modelStore";
import { useAuthStore } from "../../../store/authStore";
import { aiApi } from "../../../lib/api/ai";
import { db } from "../../../db";

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
  margin-bottom: ${SPACING.xl};

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const ViewToggle = styled(Segmented)`
  .ant-segmented-item {
    border-radius: ${BORDER.radius.sm} !important;
    transition: all ${TRANSITION.fast};
  }
`;

const CardGrid = styled(List)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${SPACING.md};
`;

const StyledCard = styled(Card)`
  height: 100%;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  transition: all ${TRANSITION.fast};
  animation: ${fadeIn} 0.3s ease-out;
  background: ${COLORS.paper};

  &:hover {
    border-color: ${COLORS.inkLight};
    box-shadow: ${SHADOW.md};
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: ${SPACING.lg};
    height: calc(100% - 1px);
  }

  .ant-card-actions {
    background: ${COLORS.background};
    > li {
      margin: 0;

      > span {
        padding: ${SPACING.sm} 0;
        font-size: ${TYPOGRAPHY.fontSize.sm};
        color: ${COLORS.inkLight};
        transition: color ${TRANSITION.fast};

        &:hover {
          color: ${COLORS.accent};
        }
      }
    }
  }
`;

const Avatar = styled.div<{ $gradient?: string }>`
  width: 56px;
  height: 56px;
  border-radius: ${BORDER.radius.lg};
  background: ${(props) =>
    props.$gradient || `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: ${SPACING.md};
  box-shadow: ${SHADOW.sm};
`;

const AssistantTitle = styled.div`
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.lg};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.ink};
  margin-bottom: ${SPACING.xs};
`;

const AssistantDescription = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.inkLight};
  margin-bottom: ${SPACING.md};
  line-height: 1.5;
  min-height: 40px;
`;

const PromptPreview = styled.div`
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  padding: ${SPACING.sm};
  margin-top: ${SPACING.md};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkLight};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const StyledTag = styled(Tag)`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  border-radius: ${BORDER.radius.full};
  padding: 2px ${SPACING.sm};
  margin: 0;
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

const ListItemAvatar = styled.div<{ $gradient?: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${BORDER.radius.md};
  background: ${(props) =>
    props.$gradient || `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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

// 助手渐变色配置
const AVATAR_GRADIENTS: Record<string, string> = {
  general: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  translator: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  writer: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  coder: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  summarizer: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
};

type ViewMode = "list" | "grid";

// ============================================
// Types
// ============================================

interface AIAssistant {
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

// ============================================
// Main Component
// ============================================

export default function AiAssistants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<AIAssistant | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { configs } = useModelStore();
  const { user } = useAuthStore();
  const {
    assistants: dbAssistants,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  } = useAIStore();

  useEffect(() => {
    loadAssistantsData();
  }, [loadAssistants]);

  // 处理 URL 参数，打开编辑弹窗
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && assistants.length > 0) {
      const assistant = assistants.find((a) => a.id === editId);
      if (assistant) {
        handleEdit(assistant);
        // 清除 URL 参数
        setSearchParams((params) => {
          const newParams = new URLSearchParams(params);
          newParams.delete("edit");
          return newParams;
        });
      }
    }
  }, [searchParams, assistants]);

  const loadAssistantsData = async () => {
    setLoading(true);
    try {
      await loadAssistants();
      const { assistants } = useAIStore.getState();
      setAssistants(assistants);
    } catch (error) {
      console.error("加载助手列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAssistant(null);
    form.resetFields();
    form.setFieldsValue({
      model: "",
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEdit = async (assistant: AIAssistant) => {
    try {
      // 在编辑前,检查是否有待同步的数据
      const dbAssistant = await db.aiAssistants.get(assistant.id);

      if (dbAssistant && dbAssistant._pendingSync) {
        console.log("[AiAssistants] 检测到待同步数据,正在同步到后端...");
        message.loading("正在同步数据...");

        try {
          // 同步到后端
          const response = await aiApi.updateAssistant(assistant.id, {
            name: dbAssistant.name,
            description: dbAssistant.description,
            systemPrompt: dbAssistant.systemPrompt,
            avatar: dbAssistant.avatar,
            model: dbAssistant.model,
            temperature: dbAssistant.temperature,
            maxTokens: dbAssistant.maxTokens,
            isActive: dbAssistant.isActive,
            isPublic: dbAssistant.isPublic,
          });

          // 清除待同步标记
          await db.aiAssistants.update(assistant.id, {
            _pendingSync: undefined,
          });

          message.success("数据同步成功");
        } catch (syncError) {
          console.warn("[AiAssistants] 同步失败,但允许继续编辑:", syncError);
          message.warning("数据同步失败,将以离线模式编辑");
        }
      }

      setEditingAssistant(assistant);
      form.setFieldsValue(assistant);
      setModalVisible(true);
    } catch (error) {
      console.error("[AiAssistants] 准备编辑失败:", error);
      message.error("准备编辑失败");
    }
  };

  const handleCopy = async (assistant: AIAssistant) => {
    try {
      const newAssistant = await createAssistant({
        name: `${assistant.name} (副本)`,
        description: assistant.description,
        systemPrompt: assistant.systemPrompt,
        avatar: assistant.avatar,
        model: assistant.model,
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
        isActive: true,
      });
      await loadAssistantsData();
      message.success("已创建副本");
    } catch (error: any) {
      console.error("复制助手失败:", error);
      message.error(error.message || "复制失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 只能删除自己创建的助手
      const assistant = assistants.find((a) => a.id === id);
      const { user } = useAuthStore.getState();

      if (assistant?.userId !== user?.id) {
        message.warning("不能删除公共助手");
        return;
      }

      await deleteAssistant(id);
      await loadAssistantsData();
      message.success("删除成功");
    } catch (error: any) {
      console.error("删除失败:", error);
      message.error(error.message || "删除失败");
    }
  };

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

      if (editingAssistant) {
        // 更新现有助手
        await updateAssistant(editingAssistant.id, assistantData);
      } else {
        // 创建新助手
        await createAssistant(assistantData);
      }

      // 重新加载助手列表
      await loadAssistantsData();

      message.success(editingAssistant ? "更新成功" : "创建成功");
      setModalVisible(false);
    } catch (error: any) {
      console.error("保存助手失败:", error);
      message.error(error.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  // 渲染助手卡片（网格视图）
  const renderAssistantCard = (assistant: AIAssistant) => {
    const gradient = AVATAR_GRADIENTS[assistant.id] || AVATAR_GRADIENTS.general;

    return (
      <List.Item key={assistant.id} style={{ margin: 0, border: "none" }}>
        <StyledCard
          actions={[
            <Button
              key="copy"
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(assistant)}
            >
              复制
            </Button>,
            <Button
              key="edit"
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(assistant)}
            >
              编辑
            </Button>,
            assistant.userId === user?.id && (
              <Popconfirm
                key="delete"
                title="确定删除这个助手吗?"
                onConfirm={() => handleDelete(assistant.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            ),
          ].filter(Boolean)}
        >
          <Avatar $gradient={gradient}>
            {assistant.avatar || <RobotOutlined />}
          </Avatar>
          <AssistantTitle>{assistant.name}</AssistantTitle>
          <AssistantDescription>{assistant.description}</AssistantDescription>
          <Space size={4} wrap>
            {assistant.isPublic && assistant.userId !== user?.id && (
              <StyledTag color="blue" icon={<CheckCircleOutlined />}>
                公共
              </StyledTag>
            )}
            {assistant.isActive && (
              <StyledTag color="green" icon={<CheckCircleOutlined />}>
                启用
              </StyledTag>
            )}
            <StyledTag>{assistant.model}</StyledTag>
          </Space>
          <PromptPreview>{assistant.systemPrompt}</PromptPreview>
        </StyledCard>
      </List.Item>
    );
  };

  // 渲染列表项（列表视图）
  const renderListItem = (assistant: AIAssistant) => {
    const gradient = AVATAR_GRADIENTS[assistant.id] || AVATAR_GRADIENTS.general;

    return (
      <ListItemContainer key={assistant.id}>
        <ListItemAvatar $gradient={gradient}>
          {assistant.avatar || <RobotOutlined />}
        </ListItemAvatar>
        <ListItemContent>
          <ListItemTitle>{assistant.name}</ListItemTitle>
          <ListItemMeta>
            {assistant.isPublic && assistant.userId !== user?.id && (
              <StyledTag color="blue" icon={<CheckCircleOutlined />}>
                公共
              </StyledTag>
            )}
            {assistant.isActive && (
              <StyledTag color="green" icon={<CheckCircleOutlined />}>
                启用
              </StyledTag>
            )}
            <span>{assistant.description}</span>
          </ListItemMeta>
          <PromptPreview style={{ marginTop: 8 }}>
            {assistant.systemPrompt}
          </PromptPreview>
        </ListItemContent>
        <ListItemActions>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(assistant)}
          >
            复制
          </Button>
          {assistant.userId === user?.id && (
            <Popconfirm
              title="确定删除这个助手吗?"
              onConfirm={() => handleDelete(assistant.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(assistant)}
          >
            编辑
          </Button>
        </ListItemActions>
      </ListItemContainer>
    );
  };

  return (
    <Container>
      <Header>
        <h2>AI 助手</h2>
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
            新建助手
          </Button>
        </Space>
      </Header>

      {viewMode === "grid" ? (
        <CardGrid
          dataSource={assistants}
          renderItem={(item: unknown) =>
            renderAssistantCard(item as AIAssistant)
          }
        />
      ) : (
        <div>
          {assistants.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: SPACING["3xl"],
                color: COLORS.inkMuted,
              }}
            >
              暂无 AI 助手，点击右上角"新建助手"进行添加
            </div>
          ) : (
            assistants.map(renderListItem)
          )}
        </div>
      )}

      <Modal
        title={
          <div>
            {editingAssistant ? "编辑助手" : "新建助手"}
            {editingAssistant?.isPublic &&
              editingAssistant?.userId !== user?.id && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  公共助手
                </Tag>
              )}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        {editingAssistant?.isPublic &&
          editingAssistant?.userId !== user?.id && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: 4,
                fontSize: 13,
                color: "#d46b08",
              }}
            >
              ⚠️ 您正在编辑公共助手，修改将<b>仅保存在本地浏览器</b>
              中，不会同步到服务器。刷新页面或更换设备后，修改会恢复为默认设置。
              <br />
              <br />
              💡 <b>建议</b>
              ：如需长期使用自定义配置，请点击"复制"创建一个自定义副本。
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 8 }}
                onClick={() => {
                  handleCopy(editingAssistant);
                  setModalVisible(false);
                }}
              >
                复制为自定义助手
              </Button>
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

          {/* 第三行: 使用模型 + 是否启用 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="使用模型"
                name="model"
                rules={[{ required: true, message: "请选择模型" }]}
                initialValue=""
              >
                <Select placeholder="选择模型">
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
                  max={8000}
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
              {editingAssistant ? "更新" : "创建"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}

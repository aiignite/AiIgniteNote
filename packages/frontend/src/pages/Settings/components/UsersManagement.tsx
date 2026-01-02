import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  MailOutlined,
  CheckCircleOutlined,
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

const SectionContainer = styled.div`
  max-width: 1200px;
`;

const HeaderSection = styled.div`
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

const PrimaryButton = styled(Button)`
  height: 40px;
  padding: 0 ${SPACING.xl};
  background: ${COLORS.ink};
  border-color: ${COLORS.ink};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.paper};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accent};
    border-color: ${COLORS.accent};
    transform: translateY(-1px);
    box-shadow: ${SHADOW.accent};
  }
`;

const StatCard = styled.div`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING.xl};
  text-align: center;
  box-shadow: ${SHADOW.sm};
  animation: ${fadeIn} 0.3s ease-out;

  .stat-value {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["4xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.xs};
  }

  .stat-label {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
  }
`;

const TableCard = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING.xl};
  box-shadow: ${SHADOW.sm};

  h3 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.lg} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const StyledTable = styled(Table)`
  .ant-table {
    font-size: ${TYPOGRAPHY.fontSize.sm};
  }

  .ant-table-thead > tr > th {
    background: ${COLORS.background};
    border-color: ${COLORS.subtle};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    padding: ${SPACING.md} ${SPACING.lg};
  }

  .ant-table-tbody > tr > td {
    border-color: ${COLORS.subtleLight};
    padding: ${SPACING.md} ${SPACING.lg};
  }

  .ant-table-tbody > tr:hover > td {
    background: ${COLORS.background};
  }

  .ant-pagination {
    margin-top: ${SPACING.lg};

    .ant-pagination-item {
      border-color: ${COLORS.subtle};

      a {
        color: ${COLORS.ink};
      }

      &:hover {
        border-color: ${COLORS.ink};
      }

      &.ant-pagination-item-active {
        background: ${COLORS.ink};
        border-color: ${COLORS.ink};

        a {
          color: ${COLORS.paper};
        }
      }
    }

    .ant-pagination-prev,
    .ant-pagination-next {
      button {
        border-color: ${COLORS.subtle};
        color: ${COLORS.ink};

        &:hover {
          border-color: ${COLORS.ink};
          color: ${COLORS.ink};
        }
      }
    }
  }
`;

const LinkButton = styled(Button)`
  padding: 0;
  height: auto;
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.xs};

  &:hover {
    color: ${COLORS.ink};
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: ${COLORS.paper};
    border: 1px solid ${COLORS.subtle};
    border-radius: ${BORDER.radius.md};
    box-shadow: ${SHADOW.lg};
  }

  .ant-modal-header {
    border-bottom: 1px solid ${COLORS.subtle};
    padding: ${SPACING.xl} ${SPACING["3xl"]};

    .ant-modal-title {
      font-family: ${TYPOGRAPHY.fontFamily.display};
      font-size: ${TYPOGRAPHY.fontSize.xl};
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
    }
  }

  .ant-modal-body {
    padding: ${SPACING["3xl"]};
  }

  .ant-modal-footer {
    border-top: 1px solid ${COLORS.subtle};
    padding: ${SPACING.lg} ${SPACING["3xl"]};
  }
`;

const StyledInput = styled(Input)`
  height: 40px;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  .ant-input {
    background: ${COLORS.paper};
  }

  .ant-input-prefix {
    color: ${COLORS.inkMuted};
    margin-right: ${SPACING.sm};
  }
`;

const PasswordInput = styled(Input.Password)`
  height: 40px;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  .ant-input {
    background: ${COLORS.paper};
  }

  .ant-input-prefix {
    color: ${COLORS.inkMuted};
    margin-right: ${SPACING.sm};
  }
`;

const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background: ${COLORS.success};
  }
`;

// ============================================
// Types
// ============================================

interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// ============================================
// Main Component
// ============================================

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "password">(
    "create",
  );
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // 模拟数据
      setUsers([
        {
          id: "1",
          email: "demo@ainote.com",
          username: "demo",
          displayName: "Demo User",
          isActive: true,
          emailVerified: true,
          lastLoginAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          createdAt: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "2",
          email: "user@example.com",
          username: "testuser",
          displayName: "Test User",
          isActive: true,
          emailVerified: false,
          createdAt: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "3",
          email: "inactive@example.com",
          username: "inactive",
          displayName: "Inactive User",
          isActive: false,
          emailVerified: true,
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ]);
    } catch (error) {
      message.error("加载用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType("create");
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setModalType("edit");
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handlePassword = (user: User) => {
    setModalType("password");
    setEditingUser(user);
    form.resetFields();
    setModalVisible(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u,
        ),
      );
      message.success(`用户已${user.isActive ? "禁用" : "启用"}`);
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setUsers(users.filter((u) => u.id !== id));
      message.success("用户已删除");
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async (values: unknown) => {
    setLoading(true);
    try {
      if (modalType === "create") {
        const newUser: User = {
          id: Date.now().toString(),
          email: (values as any).email,
          username: (values as any).username,
          displayName: (values as any).displayName,
          isActive: (values as any).isActive ?? true,
          emailVerified: (values as any).emailVerified ?? false,
          createdAt: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        message.success("用户创建成功");
      } else if (modalType === "edit") {
        setUsers(
          users.map((u) =>
            u.id === editingUser?.id ? { ...u, ...(values as any) } : u,
          ),
        );
        message.success("用户信息更新成功");
      } else if (modalType === "password") {
        message.success("密码已重置");
      }
      setModalVisible(false);
    } catch (error) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "用户",
      dataIndex: "displayName",
      key: "user",
      render: (text: string, record: unknown) => {
        const user = record as User;
        return (
          <Space>
            <Avatar
              size={36}
              src={user.avatar}
              icon={<UserOutlined />}
              style={{
                backgroundColor: user.isActive ? COLORS.ink : COLORS.inkMuted,
              }}
            >
              {user.displayName?.charAt(0) ||
                user.email.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 500 }}>
                {text || user.username || user.email}
              </div>
              <div style={{ fontSize: "12px", color: COLORS.inkMuted }}>
                {user.email}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      render: (text: string) => text || "-",
    },
    {
      title: "状态",
      key: "status",
      render: (_: unknown, record: unknown) => {
        const user = record as User;
        return (
          <Space size={4}>
            <Tag
              color={user.isActive ? "success" : "default"}
              style={{ margin: 0 }}
            >
              {user.isActive ? "活跃" : "已禁用"}
            </Tag>
            {user.emailVerified && (
              <Tag
                icon={<CheckCircleOutlined />}
                color="success"
                style={{ margin: 0 }}
              >
                已验证
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "最后登录",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (text: string) =>
        text ? new Date(text).toLocaleString("zh-CN") : "从未登录",
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: unknown) => {
        const user = record as User;
        return (
          <Space size="small">
            <LinkButton
              icon={<EditOutlined />}
              onClick={() => handleEdit(user)}
            >
              编辑
            </LinkButton>
            <LinkButton
              icon={<LockOutlined />}
              onClick={() => handlePassword(user)}
            >
              重置密码
            </LinkButton>
            <LinkButton onClick={() => handleToggleStatus(user)}>
              {user.isActive ? "禁用" : "启用"}
            </LinkButton>
            {user.id !== "1" && (
              <Popconfirm
                title="确定删除这个用户吗？"
                onConfirm={() => handleDelete(user.id)}
                okText="确定"
                cancelText="取消"
              >
                <LinkButton danger icon={<DeleteOutlined />}>
                  删除
                </LinkButton>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // 统计数据
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    verified: users.filter((u) => u.emailVerified).length,
    newThisMonth: users.filter((u) => {
      const createdAt = new Date(u.createdAt);
      const now = new Date();
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <SectionContainer>
      <HeaderSection>
        <h2>用户管理</h2>
        <PrimaryButton icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </PrimaryButton>
      </HeaderSection>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: SPACING.xl }}>
        <Col span={6}>
          <StatCard>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总用户数</div>
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <div className="stat-value" style={{ color: COLORS.success }}>
              {stats.active}
            </div>
            <div className="stat-label">活跃用户</div>
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <div className="stat-value" style={{ color: COLORS.info }}>
              {stats.verified}
            </div>
            <div className="stat-label">已验证邮箱</div>
          </StatCard>
        </Col>
        <Col span={6}>
          <StatCard>
            <div className="stat-value" style={{ color: COLORS.error }}>
              {stats.newThisMonth}
            </div>
            <div className="stat-label">本月新增</div>
          </StatCard>
        </Col>
      </Row>

      {/* 用户列表 */}
      <TableCard>
        <StyledTable
          dataSource={users}
          rowKey="id"
          loading={loading}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个用户`,
          }}
        />
      </TableCard>

      {/* 新建/编辑用户弹窗 */}
      <StyledModal
        title={modalType === "create" ? "新建用户" : "编辑用户"}
        open={modalVisible && (modalType === "create" || modalType === "edit")}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={540}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            emailVerified: false,
          }}
        >
          {modalType === "create" && (
            <>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: "请输入邮箱" },
                  { type: "email", message: "请输入有效的邮箱地址" },
                ]}
              >
                <StyledInput
                  prefix={<MailOutlined />}
                  placeholder="user@example.com"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: "请输入密码" },
                  { min: 6, message: "密码至少6位" },
                ]}
              >
                <PasswordInput
                  prefix={<LockOutlined />}
                  placeholder="至少6位"
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="用户名" name="username">
            <StyledInput placeholder="可选" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: "请输入显示名称" }]}
          >
            <StyledInput placeholder="显示名称" />
          </Form.Item>

          <Form.Item
            label="邮箱已验证"
            name="emailVerified"
            valuePropName="checked"
          >
            <StyledSwitch />
          </Form.Item>

          <Form.Item label="账户状态" name="isActive" valuePropName="checked">
            <StyledSwitch checkedChildren="活跃" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <PrimaryButton htmlType="submit" loading={loading} block>
              {modalType === "create" ? "创建" : "保存"}
            </PrimaryButton>
          </Form.Item>
        </Form>
      </StyledModal>

      {/* 重置密码弹窗 */}
      <StyledModal
        title="重置密码"
        open={modalVisible && modalType === "password"}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={440}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="用户">
            <StyledInput
              value={editingUser?.displayName || editingUser?.email}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码至少6位" },
            ]}
          >
            <PasswordInput placeholder="至少6位" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <PasswordInput placeholder="再次输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <PrimaryButton htmlType="submit" loading={loading} block>
              重置密码
            </PrimaryButton>
          </Form.Item>
        </Form>
      </StyledModal>
    </SectionContainer>
  );
}

import { useState } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useAuthStore } from "../../../store/authStore";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const SectionContainer = styled.div`
  width: 100%;
`;

const Card = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  margin-bottom: ${SPACING.xl};
  box-shadow: ${SHADOW.sm};

  h3 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.xs} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0 0 ${SPACING.xl} 0;
    line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: ${SPACING.lg};
  }

  .ant-form-item-label > label {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    color: ${COLORS.ink};
    height: auto;
  }

  .ant-form-item-explain-error {
    font-size: ${TYPOGRAPHY.fontSize.xs};
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

  &:disabled {
    background: ${COLORS.background};
    border-color: ${COLORS.subtle};
    color: ${COLORS.inkMuted};
  }
`;

const PasswordInput = styled(Input.Password)`
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

  &:disabled {
    background: ${COLORS.subtle};
    border-color: ${COLORS.subtle};
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled(Button)`
  height: 40px;
  padding: 0 ${SPACING.xl};
  background: transparent;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.ink};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.ink};
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

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} 0;
  border-bottom: 1px solid ${COLORS.subtleLight};

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
  }

  .info-value {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    color: ${COLORS.ink};
  }
`;

// ============================================
// Main Component
// ============================================

export default function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const handleUpdateProfile = async (values: unknown) => {
    const { username, displayName } = values as {
      username: string;
      displayName: string;
    };
    setLoading(true);
    try {
      await updateUser({ username, displayName });
      message.success("个人信息更新成功");
    } catch (error) {
      message.error("更新失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: unknown) => {
    const { currentPassword, newPassword } = values as {
      currentPassword: string;
      newPassword: string;
    };
    setLoading(true);
    try {
      // TODO: 调用修改密码 API
      console.log("Changing password:", { currentPassword, newPassword });
      message.success("密码修改成功");
      setPasswordModalVisible(false);
    } catch (error) {
      message.error("密码修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionContainer>
      {/* 基本信息 */}
      <Card>
        <h3>基本信息</h3>
        <p>管理您的账号基本信息</p>

        <StyledForm
          layout="vertical"
          initialValues={user || {}}
          onFinish={handleUpdateProfile}
        >
          <Form.Item label="邮箱地址" name="email" tooltip="邮箱地址不可修改">
            <StyledInput
              prefix={<MailOutlined />}
              disabled
              placeholder="邮箱地址"
            />
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <StyledInput prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: "请输入显示名称" }]}
          >
            <StyledInput placeholder="显示名称" />
          </Form.Item>

          <Form.Item>
            <PrimaryButton htmlType="submit" loading={loading}>
              保存更改
            </PrimaryButton>
          </Form.Item>
        </StyledForm>
      </Card>

      {/* 安全设置 */}
      <Card>
        <h3>安全设置</h3>
        <p>定期修改密码可以保护您的账号安全</p>

        <InfoRow>
          <span className="info-label">登录密码</span>
          <span className="info-value">••••••••</span>
        </InfoRow>

        <div style={{ marginTop: SPACING.xl }}>
          <SecondaryButton
            icon={<LockOutlined />}
            onClick={() => setPasswordModalVisible(true)}
          >
            修改密码
          </SecondaryButton>
        </div>
      </Card>

      {/* 修改密码弹窗 */}
      <StyledModal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={480}
      >
        <StyledForm layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: "请输入当前密码" }]}
          >
            <PasswordInput placeholder="当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码至少6位" },
            ]}
          >
            <PasswordInput placeholder="新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
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
            <PasswordInput placeholder="确认新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <PrimaryButton htmlType="submit" loading={loading} block>
              确认修改
            </PrimaryButton>
          </Form.Item>
        </StyledForm>
      </StyledModal>
    </SectionContainer>
  );
}

import { useState } from "react";
import { Modal, Form, Input, Button, App, Progress } from "antd";
import { LockOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { COLORS, TYPOGRAPHY, SPACING, BORDER, TRANSITION, SHADOW } from "../styles/design-tokens";
import { useAuthStore } from "../store/authStore";

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: ${BORDER.radius.lg};
    overflow: hidden;
    box-shadow: ${SHADOW.lg};
  }

  .ant-modal-header {
    background: linear-gradient(135deg, ${COLORS.accent} 0%, #E87856 100%);
    border-bottom: none;
    padding: ${SPACING.xl} ${SPACING.xl};
  }

  .ant-modal-title {
    color: ${COLORS.paper};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  }

  .ant-modal-close-x {
    color: ${COLORS.paper};
    &:hover {
      color: ${COLORS.paper};
    }
  }

  .ant-modal-body {
    padding: ${SPACING.xl};
  }
`;

const PasswordStrength = styled.div`
  margin-top: ${SPACING.md};
  margin-bottom: ${SPACING.lg};

  .strength-label {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin-bottom: ${SPACING.xs};
    display: flex;
    justify-content: space-between;
  }

  .ant-progress {
    .ant-progress-bg {
      transition: all ${TRANSITION.normal};
    }
  }
`;

const WarningText = styled.p`
  color: #faad14;
  font-size: ${TYPOGRAPHY.fontSize.sm};
  margin-top: ${SPACING.md};
  padding: ${SPACING.sm} ${SPACING.md};
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: ${BORDER.radius.sm};
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.lg};
`;

interface ChangePasswordModalProps {
  visible: boolean;
  onConfirm: (newPassword?: string) => void;
}

export default function ChangePasswordModal({ visible, onConfirm }: ChangePasswordModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { user, changePassword } = useAuthStore();
  const { message: messageApi } = App.useApp();

  // 检查密码强度
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return "#ff4d4f";
    if (strength < 70) return "#faad14";
    return "#52c41a";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return "弱";
    if (strength < 70) return "中";
    return "强";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(checkPasswordStrength(password));
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const newPassword = values.newPassword;
      // 调用修改密码 API（当前密码使用默认密码 seeyao123）
      await changePassword("seeyao123", newPassword);
      messageApi.success("密码修改成功！请重新登录");
      form.resetFields();
      // 登出并让用户重新登录
      const { logout } = useAuthStore.getState();
      await logout();
      // 传递新密码给父组件，用于填充登录表单
      onConfirm(newPassword);
    } catch (error: any) {
      messageApi.error(error.response?.data?.error?.message || error.message || "密码修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledModal
      title={
        <>
          <LockOutlined /> 修改密码
        </>
      }
      open={visible}
      onCancel={onConfirm}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <WarningText>
        <LockOutlined />
        检测到您正在使用默认密码，为了账户安全，请立即修改密码
      </WarningText>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: "请输入新密码" },
            { min: 8, message: "密码至少8位" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码（至少8位）"
            onChange={handlePasswordChange}
            size="large"
          />
        </Form.Item>

        <PasswordStrength>
          <div className="strength-label">
            <span>密码强度</span>
            <span style={{ color: getPasswordStrengthColor(passwordStrength), fontWeight: 500 }}>
              {getPasswordStrengthText(passwordStrength)}
            </span>
          </div>
          <Progress
            percent={passwordStrength}
            strokeColor={getPasswordStrengthColor(passwordStrength)}
            showInfo={false}
            size="small"
          />
        </PasswordStrength>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "请确认密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新密码"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            style={{
              height: "48px",
              fontSize: TYPOGRAPHY.fontSize.md,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              background: COLORS.accent,
              border: "none",
              borderRadius: BORDER.radius.md,
            }}
          >
            确认修改
          </Button>
        </Form.Item>
      </Form>
    </StyledModal>
  );
}

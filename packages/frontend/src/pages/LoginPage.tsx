import { useState } from "react";
import { Form, Input, Button, Checkbox, App } from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { BrandLogo } from "../components/BrandLogo";
import ChangePasswordModal from "../components/ChangePasswordModal";

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

const COLORS = {
  background: "#F7F4EF",
  ink: "#1A1814",
  inkLight: "#4A4640",
  accent: "#C85A3A",
  paper: "#FFFEF8",
  subtle: "#D4CFC7",
};

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${COLORS.background};
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }
`;

// 左侧编辑区域
const EditorialPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 80px;
  position: relative;
  z-index: 2;

  @media (max-width: 968px) {
    display: none;
  }
`;

const EditorialContent = styled.div`
  max-width: 480px;
`;

const IssueBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${COLORS.accent};
  color: ${COLORS.paper};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 2px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const MainTitle = styled.h1`
  font-family: Georgia, serif;
  font-size: clamp(48px, 8vw, 88px);
  font-weight: 400;
  line-height: 0.95;
  color: ${COLORS.ink};
  margin: 0 0 24px 0;
  letter-spacing: -0.03em;
  animation: ${fadeInUp} 0.8s ease-out 0.1s both;

  .highlight {
    font-style: italic;
    position: relative;
    color: ${COLORS.accent};

    &::after {
      content: "";
      position: absolute;
      bottom: 4px;
      left: 0;
      width: 100%;
      height: 3px;
      background: ${COLORS.accent};
      opacity: 0.3;
    }
  }
`;

const EditorialSubtitle = styled.div`
  font-size: 18px;
  line-height: 1.6;
  color: ${COLORS.inkLight};
  margin: 0 0 48px 0;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  animation: ${fadeInUp} 0.8s ease-out 0.3s both;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 15px;
  color: ${COLORS.inkLight};

  &::before {
    content: "—";
    color: ${COLORS.accent};
    font-weight: 300;
  }
`;

const FloatingChar = styled.span<{
  $top: string;
  $left: string;
  $delay: number;
  $rotate: number;
}>`
  position: absolute;
  font-family: Georgia, serif;
  font-size: 180px;
  color: ${COLORS.subtle};
  opacity: 0.15;
  top: ${(props) => props.$top};
  left: ${(props) => props.$left};
  transform: rotate(${(props) => props.$rotate}deg);
  animation: ${float} ${(props) => 6 + props.$delay}s ease-in-out infinite;
  user-select: none;
`;

// 右侧登录表单区域
const FormPanel = styled.div`
  width: 100%;
  max-width: 500px;
  background: ${COLORS.paper};
  padding: 80px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow: -20px 0 60px rgba(26, 24, 20, 0.08);

  @media (max-width: 968px) {
    max-width: 100%;
    padding: 48px 32px;
    box-shadow: none;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 120px;
    background: linear-gradient(to bottom, ${COLORS.accent}, transparent);
  }
`;

const FormHeader = styled.div`
  margin-bottom: 48px;
  animation: ${slideInLeft} 0.6s ease-out;
`;

const FormTitle = styled.h2<{ $mode: string }>`
  font-family: Georgia, serif;
  font-size: 36px;
  font-weight: 400;
  color: ${COLORS.ink};
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;

  .italic {
    font-style: italic;
    color: ${COLORS.accent};
  }
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  color: ${COLORS.inkLight};
  margin: 0;
`;

const ModeToggle = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 40px;
  background: ${COLORS.background};
  padding: 4px;
  border-radius: 2px;
  animation: ${slideInLeft} 0.6s ease-out 0.1s both;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.$active ? COLORS.paper : COLORS.inkLight)};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-radius: 2px;

  ${(props) =>
    props.$active &&
    css`
      background: ${COLORS.ink};
    `}

  &:hover {
    ${(props) =>
      !props.$active &&
      css`
        color: ${COLORS.ink};
      `}
  }
`;

const StyledForm = styled(Form)<{ $shake?: boolean }>`
  ${(props) =>
    props.$shake &&
    css`
      animation: ${keyframes`
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    `} 0.4s ease-in-out;
    `}
`;

const InputWrapper = styled.div<{ $delay: number }>`
  margin-bottom: 28px;
  animation: ${slideInLeft} 0.5s ease-out ${(props) => props.$delay}s both;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.inkLight};
  margin-bottom: 10px;
`;

const StyledInput = styled(Input)`
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  padding: 16px 20px;
  font-size: 16px;
  color: ${COLORS.ink};
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  &.ant-input-focused {
    background: ${COLORS.paper};
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  &::placeholder {
    color: ${COLORS.inkLight};
    opacity: 0.5;
  }

  .ant-input {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none !important;
  }

  .ant-input:focus {
    box-shadow: none !important;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: ${COLORS.inkLight};
    opacity: 0.6;
  }
`;

const StyledPasswordInput = styled(Input.Password)`
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  padding: 16px 20px;
  font-size: 16px;
  color: ${COLORS.ink};
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  &.ant-input-focused {
    background: ${COLORS.paper};
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  .ant-input {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none !important;
  }

  .ant-input:focus {
    box-shadow: none !important;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: ${COLORS.inkLight};
    opacity: 0.6;
  }

  .ant-input-suffix {
    color: ${COLORS.inkLight};
    opacity: 0.6;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }
`;

const FormActions = styled.div<{ $delay: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: ${slideInLeft} 0.5s ease-out ${(props) => props.$delay}s both;
`;

const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox {
    .ant-checkbox-inner {
      width: 18px;
      height: 18px;
      border: 1px solid ${COLORS.subtle};
      border-radius: 2px;
      background: ${COLORS.background};
      transition: all 0.3s;
    }

    &.ant-checkbox-checked .ant-checkbox-inner {
      background: ${COLORS.ink};
      border-color: ${COLORS.ink};
    }

    &.ant-checkbox:hover .ant-checkbox-inner {
      border-color: ${COLORS.ink};
    }
  }

  .ant-checkbox + span {
    font-size: 14px;
    color: ${COLORS.inkLight};
  }
`;

const ForgotLink = styled.a`
  font-size: 14px;
  color: ${COLORS.inkLight};
  position: relative;
  transition: color 0.3s;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: ${COLORS.accent};
    transition: width 0.3s ease-out;
  }

  &:hover {
    color: ${COLORS.accent};

    &::after {
      width: 100%;
    }
  }
`;

const SubmitButton = styled(Button)<{ $delay: number }>`
  width: 100%;
  height: 56px;
  background: ${COLORS.ink};
  border: none;
  border-radius: 2px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${COLORS.paper};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: ${slideInLeft} 0.5s ease-out ${(props) => props.$delay}s both;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover {
    background: ${COLORS.accent};
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(200, 90, 58, 0.3);

    &::before {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .anticon {
    transition: transform 0.3s;
  }

  &:hover:not(:disabled) .anticon {
    transform: translateX(4px);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${COLORS.subtle};
  }

  span {
    font-size: 12px;
    color: ${COLORS.inkLight};
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const ToggleText = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  color: ${COLORS.inkLight};
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: color 0.3s;

  .accent {
    color: ${COLORS.accent};
    font-weight: 500;
  }

  &:hover .accent {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

// ============================================
// MAIN COMPONENT
// ============================================

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loginForm] = Form.useForm();
  const navigate = useNavigate();
  const { message: messageApi } = App.useApp();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const handleLogin = async (values: unknown) => {
    setLoading(true);
    try {
      const { email, password } = values as { email: string; password: string };

      // 检查是否使用默认密码
      if (password === "seeyao123") {
        // 先登录，然后提示修改密码
        await login(email, password);
        messageApi.warning("检测到您正在使用默认密码，请修改密码");
        setShowChangePassword(true);
        setLoading(false);
        return;
      }

      await login(email, password);
      messageApi.success("欢迎回来！");
      // 直接导航，isAuthenticated 在内存中已更新
      navigate("/notes");
    } catch (error: any) {
      console.error("Login error:", error);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const msg = error.response?.data?.error?.message || "登录失败";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordConfirm = (newPassword?: string) => {
    setShowChangePassword(false);
    // 密码修改成功后，用户已被登出，保持在登录页面
    // 如果有新密码，填充到登录表单中
    if (newPassword) {
      loginForm.setFieldsValue({ password: newPassword });
    }
  };

  const handleRegister = async (values: unknown) => {
    const { email, password, confirmPassword, username } = values as {
      email: string;
      password: string;
      confirmPassword: string;
      username?: string;
    };
    if (password !== confirmPassword) {
      messageApi.error("两次密码不一致");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        username,
        displayName: username,
      });
      messageApi.success("注册成功");
      setTimeout(() => navigate("/notes"), 300);
    } catch (error: any) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const msg = error.response?.data?.error?.message || "注册失败";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
      </style>
      <PageWrapper>
        <EditorialPanel>
          <FloatingChar $top="10%" $left="5%" $delay={0} $rotate={-15}>
            A
          </FloatingChar>
          <FloatingChar $top="60%" $left="85%" $delay={2} $rotate={10}>
            i
          </FloatingChar>

          <EditorialContent>
            <IssueBadge>
              <span>Vol. 1</span>
              <span>•</span>
              <span>智能笔记新时代</span>
            </IssueBadge>

            <MainTitle>
              思维
              <br />
              <span className="highlight">流淌</span>之地
            </MainTitle>

            <EditorialSubtitle>
              <BrandLogo size="medium" /> 将先进的 AI
              技术与优雅的笔记体验融合，让每一次记录都成为灵感的延伸。
            </EditorialSubtitle>

            <FeatureList>
              <FeatureItem>智能写作助手</FeatureItem>
              <FeatureItem>实时 AI 对话</FeatureItem>
              <FeatureItem>云端同步存储</FeatureItem>
              <FeatureItem>版本历史管理</FeatureItem>
            </FeatureList>
          </EditorialContent>
        </EditorialPanel>

        <FormPanel>
          <FormHeader>
            <FormTitle $mode={mode}>
              {mode === "login" ? "欢迎" : "加入"}
              <span className="italic">
                {mode === "login" ? "回来" : <BrandLogo size="small" />}
              </span>
            </FormTitle>
            <FormSubtitle>
              {mode === "login" ? "继续你的思维旅程" : "开启你的智能笔记体验"}
            </FormSubtitle>
          </FormHeader>

          <ModeToggle>
            <ModeButton
              $active={mode === "login"}
              onClick={() => setMode("login")}
            >
              登录
            </ModeButton>
            <ModeButton
              $active={mode === "register"}
              onClick={() => setMode("register")}
            >
              注册
            </ModeButton>
          </ModeToggle>

          {mode === "login" ? (
            <StyledForm
              form={loginForm}
              name="login"
              onFinish={handleLogin}
              $shake={shake}
              layout="vertical"
              initialValues={{
                email: "demo@ainote.com",
                password: "demo123456",
              }}
            >
              <InputWrapper $delay={0.1}>
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: "请输入邮箱" }]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <InputLabel>邮箱地址</InputLabel>
                    <StyledInput
                      prefix={<MailOutlined />}
                      placeholder="your@email.com"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <InputWrapper $delay={0.2}>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <InputLabel>密码</InputLabel>
                    <StyledPasswordInput
                      prefix={<LockOutlined />}
                      placeholder="••••••••"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <FormActions $delay={0.3}>
                <StyledCheckbox>记住我</StyledCheckbox>
                <ForgotLink>忘记密码？</ForgotLink>
              </FormActions>

              <SubmitButton htmlType="submit" loading={loading} $delay={0.4}>
                登录
                <ArrowRightOutlined />
              </SubmitButton>

              <Divider>
                <span>Or</span>
              </Divider>

              <div style={{ textAlign: "center" }}>
                <ToggleText onClick={() => setMode("register")}>
                  还没有账号？<span className="accent">立即注册</span>
                </ToggleText>
              </div>
            </StyledForm>
          ) : (
            <StyledForm
              name="register"
              onFinish={handleRegister}
              $shake={shake}
              layout="vertical"
            >
              <InputWrapper $delay={0.1}>
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: "请输入邮箱" }]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <InputLabel>邮箱地址</InputLabel>
                    <StyledInput
                      prefix={<MailOutlined />}
                      placeholder="your@email.com"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <InputWrapper $delay={0.2}>
                <Form.Item name="username" style={{ marginBottom: 0 }}>
                  <div>
                    <InputLabel>用户名</InputLabel>
                    <StyledInput
                      prefix={<UserOutlined />}
                      placeholder="如何称呼你？"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <InputWrapper $delay={0.3}>
                <Form.Item
                  name="password"
                  rules={[{ min: 6, message: "密码至少6位" }]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <InputLabel>密码</InputLabel>
                    <StyledPasswordInput
                      prefix={<LockOutlined />}
                      placeholder="至少6位"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <InputWrapper $delay={0.4}>
                <Form.Item
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "请确认密码" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("密码不一致"));
                      },
                    }),
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <div>
                    <InputLabel>确认密码</InputLabel>
                    <StyledPasswordInput
                      prefix={<LockOutlined />}
                      placeholder="再次输入密码"
                      size="large"
                    />
                  </div>
                </Form.Item>
              </InputWrapper>

              <SubmitButton htmlType="submit" loading={loading} $delay={0.5}>
                创建账号
                <ArrowRightOutlined />
              </SubmitButton>

              <Divider>
                <span>Or</span>
              </Divider>

              <div style={{ textAlign: "center" }}>
                <ToggleText onClick={() => setMode("login")}>
                  已有账号？<span className="accent">立即登录</span>
                </ToggleText>
              </div>
            </StyledForm>
          )}
        </FormPanel>
      </PageWrapper>

      {/* 修改密码模态框 */}
      <ChangePasswordModal
        visible={showChangePassword}
        onConfirm={handleChangePasswordConfirm}
      />
    </>
  );
}

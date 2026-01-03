import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  LinkOutlined,
} from "@ant-design/icons";
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
    margin: 0 0 ${SPACING.sm} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0;
    line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  }
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xl};
  padding: ${SPACING.xl} 0;
  margin-bottom: ${SPACING.xl};
  border-bottom: 1px solid ${COLORS.subtleLight};

  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: ${(props) =>
    props.$hasImage
      ? COLORS.background
      : `linear-gradient(135deg, ${COLORS.ink} 0%, ${COLORS.inkLight} 100%)`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${TYPOGRAPHY.fontSize["4xl"]};
  color: ${COLORS.paper};
  border: 3px solid ${COLORS.paper};
  box-shadow: ${SHADOW.md};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarUploadBtn = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: ${COLORS.accent};
  border: 2px solid ${COLORS.paper};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${TRANSITION.fast};
  box-shadow: ${SHADOW.sm};

  &:hover {
    background: ${COLORS.accentHover};
    transform: scale(1.1);
  }

  input {
    display: none;
  }
`;

const AvatarInfo = styled.div`
  flex: 1;

  h4 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.md};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.xs} 0;
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0;
  }
`;

const SecondaryButton = styled(Button)`
  height: 36px;
  padding: 0 ${SPACING.lg};
  background: transparent;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.ink};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  margin-top: ${SPACING.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
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
`;

const StyledTextArea = styled(Input.TextArea)`
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.fast};
  resize: vertical;

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

// ============================================
// Main Component
// ============================================

export default function ProfileSettings() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const handleUpdateProfile = async (values: unknown) => {
    const { displayName, bio, location, website } = values as {
      displayName: string;
      bio?: string;
      location?: string;
      website?: string;
    };
    setLoading(true);
    try {
      await updateUser({
        displayName,
        bio,
        location,
        website,
        avatar: avatarUrl,
      });
      message.success("个人资料更新成功");
    } catch (error) {
      message.error("更新失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === "done") {
      setAvatarUrl(
        info.file.response?.url || URL.createObjectURL(info.file.originFileObj),
      );
      message.success("头像上传成功");
    } else if (info.file.status === "error") {
      message.error("头像上传失败");
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("只能上传图片文件");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("图片大小不能超过 2MB");
      return false;
    }
    return true;
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SectionContainer>
      {/* 头像设置 */}
      <Card>
        <h3>头像</h3>
        <AvatarSection>
          <AvatarWrapper>
            <Avatar $hasImage={!!avatarUrl}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                getInitials(user?.displayName)
              )}
            </Avatar>
            <AvatarUploadBtn>
              <CameraOutlined
                style={{ fontSize: "14px", color: COLORS.paper }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && beforeUpload(file)) {
                    handleAvatarChange({
                      file: { status: "done", originFileObj: file },
                    });
                  }
                }}
              />
            </AvatarUploadBtn>
          </AvatarWrapper>
          <AvatarInfo>
            <h4>个人头像</h4>
            <p>支持 JPG、PNG 格式，建议尺寸 200x200 像素</p>
            <SecondaryButton
              onClick={() => {
                setAvatarUrl(undefined);
                message.info("已移除头像");
              }}
            >
              移除头像
            </SecondaryButton>
          </AvatarInfo>
        </AvatarSection>
      </Card>

      {/* 个人信息 */}
      <Card>
        <h3>个人信息</h3>
        <p>完善您的个人资料</p>

        <StyledForm
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            displayName: user?.displayName || "",
            bio: user?.bio || "",
            location: user?.location || "",
            website: user?.website || "",
          }}
        >
          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: "请输入显示名称" }]}
          >
            <StyledInput prefix={<UserOutlined />} placeholder="显示名称" />
          </Form.Item>

          <Form.Item label="个人简介" name="bio">
            <StyledTextArea
              rows={4}
              placeholder="介绍一下自己..."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item label="所在地" name="location">
            <StyledInput
              prefix={<EnvironmentOutlined />}
              placeholder="城市或地区"
            />
          </Form.Item>

          <Form.Item label="个人网站" name="website">
            <StyledInput prefix={<LinkOutlined />} placeholder="https://" />
          </Form.Item>

          <Form.Item>
            <PrimaryButton htmlType="submit" loading={loading}>
              保存更改
            </PrimaryButton>
          </Form.Item>
        </StyledForm>
      </Card>
    </SectionContainer>
  );
}

import { useState } from "react";
import { Form, Slider, Switch, Button, message, Select } from "antd";
import styled from "styled-components";
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
  max-width: 680px;
`;

const CardSection = styled.section`
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

const ThemePreview = styled.div<{ $active: boolean }>`
  padding: ${SPACING.lg};
  border-radius: ${BORDER.radius.md};
  margin-bottom: ${SPACING.md};
  border: 2px solid
    ${(props) => (props.$active ? COLORS.accent : COLORS.subtle)};
  background: ${COLORS.paper};
  color: ${COLORS.ink};
  cursor: pointer;
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  ${(props) =>
    props.$active &&
    `
    border-color: ${COLORS.accent};
    box-shadow: ${SHADOW.accent};
  `}
`;

const DarkThemePreview = styled(ThemePreview)`
  background: ${COLORS.dark.background};
  color: ${COLORS.dark.ink};
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
`;

const StyledSlider = styled(Slider)`
  .ant-slider-rail {
    background: ${COLORS.subtleLight};
  }

  .ant-slider-track {
    background: ${COLORS.ink};
  }

  .ant-slider-handle {
    border-color: ${COLORS.ink};

    &:hover,
    &:focus {
      border-color: ${COLORS.accent};
    }
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-color: ${COLORS.subtle} !important;
    border-radius: ${BORDER.radius.sm} !important;

    &:hover {
      border-color: ${COLORS.inkLight} !important;
    }
  }

  &.ant-select-focused .ant-select-selector {
    border-color: ${COLORS.ink} !important;
    box-shadow: none !important;
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

const SwitchLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} 0;
  border-bottom: 1px solid ${COLORS.subtleLight};

  &:last-child {
    border-bottom: none;
  }

  .label-text {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.ink};
  }

  .label-desc {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkMuted};
    margin-top: 2px;
  }
`;

// ============================================
// Main Component
// ============================================

export default function AppearanceSettings() {
  const [form] = Form.useForm();
  const [selectedTheme, setSelectedTheme] = useState<string>("light");

  const handleSave = async (values: unknown) => {
    const { theme, fontSize, fontFamily, editorTheme } = values as {
      theme: string;
      fontSize: number;
      fontFamily: string;
      editorTheme: string;
    };
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("fontSize", fontSize.toString());
      localStorage.setItem("fontFamily", fontFamily);
      localStorage.setItem("editorTheme", editorTheme);
      message.success("外观设置已保存");
    } catch (error) {
      message.error("保存失败");
    }
  };

  return (
    <SectionContainer>
      {/* 主题设置 */}
      <CardSection>
        <h3>主题</h3>
        <p>选择您喜欢的界面主题</p>

        <div style={{ marginTop: SPACING.lg }}>
          <ThemePreview
            $active={selectedTheme === "light"}
            onClick={() => {
              setSelectedTheme("light");
              form.setFieldsValue({ theme: "light" });
            }}
          >
            <div style={{ marginBottom: SPACING.sm }}>
              <strong>☀️ 亮色主题</strong>
            </div>
            <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>适合白天使用</div>
          </ThemePreview>

          <DarkThemePreview
            $active={selectedTheme === "dark"}
            onClick={() => {
              setSelectedTheme("dark");
              form.setFieldsValue({ theme: "dark" });
            }}
          >
            <div style={{ marginBottom: SPACING.sm }}>
              <strong>🌙 暗色主题</strong>
            </div>
            <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>适合夜间使用</div>
          </DarkThemePreview>

          <ThemePreview
            $active={selectedTheme === "auto"}
            onClick={() => {
              setSelectedTheme("auto");
              form.setFieldsValue({ theme: "auto" });
            }}
          >
            <div style={{ marginBottom: SPACING.sm }}>
              <strong>🔄 跟随系统</strong>
            </div>
            <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>自动切换主题</div>
          </ThemePreview>
        </div>
      </CardSection>

      {/* 字体设置 */}
      <CardSection>
        <h3>字体</h3>
        <p>调整文字显示效果</p>

        <StyledForm
          form={form}
          layout="vertical"
          initialValues={{
            theme: localStorage.getItem("theme") || "light",
            fontSize: 14,
            fontFamily: "system",
            editorTheme: "github",
          }}
          onFinish={handleSave}
        >
          <Form.Item name="theme" hidden>
            <input type="hidden" />
          </Form.Item>

          <Form.Item
            label="字体大小"
            name="fontSize"
            tooltip="调整应用内的文字大小"
          >
            <StyledSlider
              min={12}
              max={20}
              marks={{
                12: "小",
                14: "标准",
                16: "中",
                18: "大",
                20: "特大",
              }}
            />
          </Form.Item>

          <Form.Item label="字体" name="fontFamily">
            <StyledSelect style={{ width: 240 }}>
              <Select.Option value="system">系统默认</Select.Option>
              <Select.Option value="georgia">Georgia</Select.Option>
              <Select.Option value="arial">Arial</Select.Option>
              <Select.Option value="helvetica">Helvetica</Select.Option>
            </StyledSelect>
          </Form.Item>

          <Form.Item label="编辑器主题" name="editorTheme">
            <StyledSelect style={{ width: 240 }}>
              <Select.Option value="github">GitHub</Select.Option>
              <Select.Option value="monokai">Monokai</Select.Option>
              <Select.Option value="nord">Nord</Select.Option>
              <Select.Option value="dracula">Dracula</Select.Option>
            </StyledSelect>
          </Form.Item>

          <Form.Item>
            <PrimaryButton htmlType="submit">保存设置</PrimaryButton>
          </Form.Item>
        </StyledForm>
      </CardSection>

      {/* 编辑器设置 */}
      <CardSection>
        <h3>编辑器</h3>
        <p>自定义编辑器行为</p>

        <div style={{ marginTop: SPACING.lg }}>
          <SwitchLabel>
            <div>
              <div className="label-text">显示行号</div>
              <div className="label-desc">在编辑器中显示行号</div>
            </div>
            <Switch defaultChecked />
          </SwitchLabel>

          <SwitchLabel>
            <div>
              <div className="label-text">代码折叠</div>
              <div className="label-desc">允许在编辑器中折叠代码块</div>
            </div>
            <Switch defaultChecked />
          </SwitchLabel>

          <SwitchLabel>
            <div>
              <div className="label-text">自动保存</div>
              <div className="label-desc">编辑时自动保存笔记</div>
            </div>
            <Switch defaultChecked />
          </SwitchLabel>

          <SwitchLabel>
            <div>
              <div className="label-text">拼写检查</div>
              <div className="label-desc">实时检查拼写错误</div>
            </div>
            <Switch />
          </SwitchLabel>
        </div>
      </CardSection>
    </SectionContainer>
  );
}

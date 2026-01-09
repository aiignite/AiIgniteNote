import { useState } from "react";
import { Slider, Switch, Button, message, Select } from "antd";
import styled from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";
import {
  useThemeStore,
  FONT_FAMILIES,
  EDITOR_THEMES,
  type ThemeMode,
} from "../../../store/themeStore";

// ============================================
// Styled Components
// ============================================

const SectionContainer = styled.div`
  width: 100%;
`;

const TitleSection = styled.div`
  margin-bottom: ${SPACING.xl};

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.xs} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0;
  }
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
  background: #1a1a1a;
  color: #e8e8e8;

  &:hover {
    background: #242424;
  }
`;

const PrimaryButton = styled(Button)`
  height: 40px;
  padding: 0 ${SPACING.xl};
  background: ${COLORS.accent};
  border-color: ${COLORS.accent};
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

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} 0;

  .setting-info {
    flex: 1;

    .setting-label {
      font-size: ${TYPOGRAPHY.fontSize.sm};
      font-weight: ${TYPOGRAPHY.fontWeight.medium};
      color: ${COLORS.ink};
      margin-bottom: 2px;
    }

    .setting-desc {
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
    }
  }

  .setting-control {
    margin-left: ${SPACING.lg};
  }
`;

// ============================================
// Main Component
// ============================================
export default function AppearanceSettings() {
  const themeStore = useThemeStore();

  const {
    theme,
    fontSize,
    fontFamily,
    editorTheme,
    showLineNumbers,
    codeFolding,
    autoSave,
    spellCheck,
  } = themeStore;

  const [localTheme, setLocalTheme] = useState<ThemeMode>(theme);
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  // 实时预览字体大小变化
  const handleFontSizeChange = (value: number) => {
    setLocalFontSize(value);
    themeStore.setFontSize(value);
  };

  // 主题切换
  const handleThemeChange = (newTheme: ThemeMode) => {
    setLocalTheme(newTheme);
    themeStore.setTheme(newTheme);
  };

  // 字体切换
  const handleFontFamilyChange = (value: unknown) => {
    themeStore.setFontFamily(value as string);
    message.success("字体已切换");
  };

  // 编辑器主题切换
  const handleEditorThemeChange = (value: unknown) => {
    themeStore.setEditorTheme(value as string);
    message.success("编辑器主题已切换");
  };

  // 编辑器设置切换
  const handleEditorSettingChange = (
    key: "showLineNumbers" | "codeFolding" | "autoSave" | "spellCheck",
    value: boolean,
  ) => {
    switch (key) {
      case "showLineNumbers":
        themeStore.setShowLineNumbers(value);
        break;
      case "codeFolding":
        themeStore.setCodeFolding(value);
        break;
      case "autoSave":
        themeStore.setAutoSave(value);
        break;
      case "spellCheck":
        themeStore.setSpellCheck(value);
        break;
    }
    message.success("设置已更新");
  };

  // 重置所有设置
  const handleReset = () => {
    themeStore.resetSettings();
    setLocalTheme("light");
    setLocalFontSize(14);
    message.success("外观设置已重置");
  };

  return (
    <SectionContainer>
      <TitleSection>
        <h2>外观设置</h2>
        <p>自定义应用的外观和编辑器行为</p>
      </TitleSection>

      {/* 主题设置 */}
      <CardSection>
        <h3>主题</h3>
        <p>选择您喜欢的界面主题</p>

        <div style={{ marginTop: SPACING.lg }}>
          <ThemePreview
            $active={localTheme === "light"}
            onClick={() => handleThemeChange("light")}
          >
            <div style={{ marginBottom: SPACING.sm }}>
              <strong>☀️ 亮色主题</strong>
            </div>
            <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>适合白天使用</div>
          </ThemePreview>

          <DarkThemePreview
            $active={localTheme === "dark"}
            onClick={() => handleThemeChange("dark")}
          >
            <div style={{ marginBottom: SPACING.sm }}>
              <strong>🌙 暗色主题</strong>
            </div>
            <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>适合夜间使用</div>
          </DarkThemePreview>

          <ThemePreview
            $active={localTheme === "auto"}
            onClick={() => handleThemeChange("auto")}
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

        <div style={{ marginTop: SPACING.xl }}>
          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">字体大小</div>
              <div className="setting-desc">当前大小: {localFontSize}px</div>
            </div>
            <div className="setting-control" style={{ width: 200 }}>
              <StyledSlider
                min={12}
                max={20}
                value={localFontSize}
                onChange={handleFontSizeChange}
                marks={{
                  12: "小",
                  14: "标准",
                  16: "中",
                  18: "大",
                  20: "特大",
                }}
              />
            </div>
          </SettingRow>

          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">字体</div>
              <div className="setting-desc">选择应用的字体</div>
            </div>
            <div className="setting-control">
              <StyledSelect
                style={{ width: 200 }}
                value={fontFamily}
                onChange={handleFontFamilyChange}
              >
                {Object.values(FONT_FAMILIES).map((font) => (
                  <Select.Option key={font.value} value={font.value}>
                    {font.label}
                  </Select.Option>
                ))}
              </StyledSelect>
            </div>
          </SettingRow>
        </div>
      </CardSection>

      {/* 编辑器主题 */}
      <CardSection>
        <h3>编辑器主题</h3>
        <p>选择代码和 Markdown 编辑器的配色方案</p>

        <div style={{ marginTop: SPACING.xl }}>
          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">编辑器主题</div>
              <div className="setting-desc">
                当前: {EDITOR_THEMES[editorTheme]?.label}
              </div>
            </div>
            <div className="setting-control">
              <StyledSelect
                style={{ width: 200 }}
                value={editorTheme}
                onChange={handleEditorThemeChange}
              >
                {Object.values(EDITOR_THEMES).map((theme) => (
                  <Select.Option key={theme.value} value={theme.value}>
                    {theme.label}
                  </Select.Option>
                ))}
              </StyledSelect>
            </div>
          </SettingRow>
        </div>
      </CardSection>

      {/* 编辑器设置 */}
      <CardSection>
        <h3>编辑器行为</h3>
        <p>自定义编辑器的默认行为</p>

        <div style={{ marginTop: SPACING.lg }}>
          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">显示行号</div>
              <div className="setting-desc">在编辑器中显示行号</div>
            </div>
            <div className="setting-control">
              <Switch
                checked={showLineNumbers}
                onChange={(checked) =>
                  handleEditorSettingChange("showLineNumbers", checked)
                }
              />
            </div>
          </SettingRow>

          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">代码折叠</div>
              <div className="setting-desc">允许在编辑器中折叠代码块</div>
            </div>
            <div className="setting-control">
              <Switch
                checked={codeFolding}
                onChange={(checked) =>
                  handleEditorSettingChange("codeFolding", checked)
                }
              />
            </div>
          </SettingRow>

          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">自动保存</div>
              <div className="setting-desc">编辑时自动保存笔记</div>
            </div>
            <div className="setting-control">
              <Switch
                checked={autoSave}
                onChange={(checked) =>
                  handleEditorSettingChange("autoSave", checked)
                }
              />
            </div>
          </SettingRow>

          <SettingRow>
            <div className="setting-info">
              <div className="setting-label">拼写检查</div>
              <div className="setting-desc">实时检查拼写错误</div>
            </div>
            <div className="setting-control">
              <Switch
                checked={spellCheck}
                onChange={(checked) =>
                  handleEditorSettingChange("spellCheck", checked)
                }
              />
            </div>
          </SettingRow>
        </div>
      </CardSection>

      {/* 重置按钮 */}
      <CardSection>
        <h3>重置设置</h3>
        <p>将所有外观设置恢复为默认值</p>

        <div style={{ marginTop: SPACING.lg }}>
          <PrimaryButton onClick={handleReset}>重置所有设置</PrimaryButton>
        </div>
      </CardSection>
    </SectionContainer>
  );
}

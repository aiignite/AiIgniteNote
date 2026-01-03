/**
 * 选择内容设置面板
 * 允许用户配置选择内容的发送模式和相关选项
 */

import {
  Modal,
  Radio,
  Slider,
  Switch,
  Space,
  Typography,
  Divider,
  Tooltip,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useSelectionSettingsStore } from "../../store/selectionSettingsStore";
import styled from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
} from "../../styles/design-tokens";

const { Text, Paragraph } = Typography;

const SettingItem = styled.div`
  margin-bottom: ${SPACING.lg};
`;

const SettingLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  margin-bottom: ${SPACING.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.ink};
`;

const SettingDescription = styled(Paragraph)`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
  margin-bottom: ${SPACING.md};
`;

const StyledRadioGroup = styled(Radio.Group)`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};

  .ant-radio-button-wrapper {
    height: auto;
    padding: ${SPACING.sm} ${SPACING.md};
    line-height: ${TYPOGRAPHY.lineHeight.normal};
    text-align: left;
    border-radius: ${BORDER.radius.sm} !important;

    &.ant-radio-button-wrapper-checked {
      background: ${COLORS.accent}15;
      border-color: ${COLORS.accent};
      color: ${COLORS.accent};
    }
  }
`;

const ModeOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  .mode-title {
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    font-size: ${TYPOGRAPHY.fontSize.sm};
  }

  .mode-desc {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkMuted};
  }
`;

interface SelectionSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SelectionSettingsModal({
  visible,
  onClose,
}: SelectionSettingsModalProps) {
  const {
    sendMode,
    maxNodes,
    maxTextLength,
    showPreview,
    autoClearOnSend,
    setSendMode,
    setMaxNodes,
    setMaxTextLength,
    setShowPreview,
    setAutoClearOnSend,
  } = useSelectionSettingsStore();

  return (
    <Modal
      title="选择内容设置"
      open={visible}
      onCancel={onClose}
      onOk={onClose}
      okText="完成"
      width={500}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* 发送模式设置 */}
        <SettingItem>
          <SettingLabel>
            <span>发送模式</span>
            <Tooltip title="决定选择内容发送到 AI 助手时的格式">
              <QuestionCircleOutlined style={{ color: COLORS.inkMuted }} />
            </Tooltip>
          </SettingLabel>
          <SettingDescription>
            选择内容发送到 AI 助手时使用的格式
          </SettingDescription>
          <StyledRadioGroup
            value={sendMode}
            onChange={(e) => setSendMode(e.target.value)}
          >
            <Radio value="text">
              <ModeOption>
                <span className="mode-title">文本模式（推荐）</span>
                <span className="mode-desc">
                  发送格式化后的文本，节省 Token，易于理解
                </span>
              </ModeOption>
            </Radio>
            <Radio value="json">
              <ModeOption>
                <span className="mode-title">JSON 模式</span>
                <span className="mode-desc">
                  发送完整的结构化数据，包含所有元数据
                </span>
              </ModeOption>
            </Radio>
            <Radio value="hybrid">
              <ModeOption>
                <span className="mode-title">混合模式</span>
                <span className="mode-desc">
                  同时发送文本和 JSON，AI 可以选择使用哪个
                </span>
              </ModeOption>
            </Radio>
          </StyledRadioGroup>
        </SettingItem>

        <Divider />

        {/* 节点数量限制 */}
        <SettingItem>
          <SettingLabel>
            <span>最大节点数量</span>
            <Tooltip title="单次选择的节点数量上限">
              <QuestionCircleOutlined style={{ color: COLORS.inkMuted }} />
            </Tooltip>
          </SettingLabel>
          <SettingDescription>
            限制单次选择的节点数量，避免消耗过多 Token
          </SettingDescription>
          <Space style={{ width: "100%" }}>
            <Slider
              style={{ flex: 1 }}
              min={1}
              max={50}
              value={maxNodes}
              onChange={setMaxNodes}
              marks={{
                5: "5",
                10: "10",
                20: "20",
                30: "30",
                50: "50",
              }}
            />
            <Text strong style={{ minWidth: 60, textAlign: "right" }}>
              {maxNodes} 个
            </Text>
          </Space>
        </SettingItem>

        {/* 文本长度限制 */}
        <SettingItem>
          <SettingLabel>
            <span>最大文本长度</span>
            <Tooltip title="选择文本的最大字符数">
              <QuestionCircleOutlined style={{ color: COLORS.inkMuted }} />
            </Tooltip>
          </SettingLabel>
          <SettingDescription>
            选择文本时的最大字符数，超出部分将被截断
          </SettingDescription>
          <Space style={{ width: "100%" }}>
            <Slider
              style={{ flex: 1 }}
              min={500}
              max={5000}
              step={100}
              value={maxTextLength}
              onChange={setMaxTextLength}
              marks={{
                500: "500",
                1000: "1K",
                2000: "2K",
                3000: "3K",
                5000: "5K",
              }}
            />
            <Text strong style={{ minWidth: 60, textAlign: "right" }}>
              {maxTextLength > 1000
                ? `${(maxTextLength / 1000).toFixed(1)}K`
                : `${maxTextLength}`}
            </Text>
          </Space>
        </SettingItem>

        <Divider />

        {/* 其他选项 */}
        <SettingItem>
          <SettingLabel>其他选项</SettingLabel>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div>显示预览</div>
                <Text
                  type="secondary"
                  style={{ fontSize: TYPOGRAPHY.fontSize.xs }}
                >
                  在 AI 助手输入框显示选择内容预览
                </Text>
              </div>
              <Switch checked={showPreview} onChange={setShowPreview} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div>发送后自动清除</div>
                <Text
                  type="secondary"
                  style={{ fontSize: TYPOGRAPHY.fontSize.xs }}
                >
                  发送消息后自动清除选择内容
                </Text>
              </div>
              <Switch checked={autoClearOnSend} onChange={setAutoClearOnSend} />
            </div>
          </Space>
        </SettingItem>
      </Space>
    </Modal>
  );
}

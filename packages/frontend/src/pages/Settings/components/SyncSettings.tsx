import { useState } from "react";
import { Button, Row, Col, Tag, Switch, Select, message } from "antd";
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
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

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============================================
// Styled Components
// ============================================

const SectionContainer = styled.div`
  max-width: 800px;
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

const StatusCard = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  margin-bottom: ${SPACING.xl};
  box-shadow: ${SHADOW.sm};
  animation: ${fadeIn} 0.3s ease-out;

  h3 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.lg} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const StatusGrid = styled(Row)`
  margin-bottom: ${SPACING.xl};

  .ant-col {
    text-align: center;
    padding: ${SPACING.md};
  }
`;

const StatusItem = styled.div`
  padding: ${SPACING.lg};
  background: ${COLORS.background};
  border-radius: ${BORDER.radius.md};

  .label {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkMuted};
    letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
    text-transform: uppercase;
    margin-bottom: ${SPACING.sm};
  }

  .value {
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
  }

  .sub-value {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkLight};
    margin-top: ${SPACING.xs};
  }
`;

const SyncButton = styled(Button)<{ $primary?: boolean }>`
  height: 48px;
  width: 100%;
  margin-bottom: ${SPACING.md};
  border-radius: ${BORDER.radius.md};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  transition: all ${TRANSITION.normal};

  ${(props) =>
    props.$primary
      ? `
    background: ${COLORS.ink};
    border-color: ${COLORS.ink};
    color: ${COLORS.paper};

    &:hover {
      background: ${COLORS.accent};
      border-color: ${COLORS.accent};
      transform: translateY(-1px);
      box-shadow: ${SHADOW.accent};
    }
  `
      : `
    background: ${COLORS.paper};
    border-color: ${COLORS.subtle};
    color: ${COLORS.ink};

    &:hover {
      border-color: ${COLORS.ink};
      color: ${COLORS.ink};
    }
  `}

  .anticon {
    ${(props) =>
      props.loading &&
      `
      animation: ${rotate} 1s linear infinite;
    `}
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
    margin: 0 0 ${SPACING.lg} 0;
  }
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.md} 0;
  border-bottom: 1px solid ${COLORS.subtleLight};

  &:last-child {
    border-bottom: none;
  }

  .setting-info {
    flex: 1;

    .setting-name {
      font-size: ${TYPOGRAPHY.fontSize.sm};
      font-weight: ${TYPOGRAPHY.fontWeight.medium};
      color: ${COLORS.ink};
    }

    .setting-desc {
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
      margin-top: 2px;
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

const ConflictItem = styled.div`
  padding: ${SPACING.md};
  background: ${COLORS.background};
  border-radius: ${BORDER.radius.sm};
  border: 1px solid ${COLORS.subtle};

  .conflict-title {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    color: ${COLORS.ink};
    margin-bottom: ${SPACING.xs};
  }

  .conflict-time {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkMuted};
    margin-bottom: ${SPACING.sm};
  }

  .conflict-actions {
    display: flex;
    gap: ${SPACING.sm};
  }
`;

const StatusBadge = styled(Tag)`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  border-radius: ${BORDER.radius.full};
  padding: 2px ${SPACING.sm};
`;

// ============================================
// Main Component
// ============================================

export default function SyncSettings() {
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5);

  // 模拟同步状态
  const [syncStatus] = useState({
    lastSync: new Date(Date.now() - 10 * 60 * 1000).toLocaleString("zh-CN"),
    pendingSync: 3,
    conflicts: [
      {
        id: "1",
        title: "项目会议笔记",
        conflictAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  });

  const handleSync = async (type: "pull" | "push") => {
    setSyncing(true);
    try {
      // 模拟同步过程
      await new Promise((resolve) => setTimeout(resolve, 2000));
      message.success(type === "pull" ? "拉取成功" : "推送成功");
    } catch (error) {
      message.error("同步失败");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SectionContainer>
      <TitleSection>
        <h2>同步设置</h2>
        <p>配置数据同步和备份</p>
      </TitleSection>

      {/* 同步状态 */}
      <StatusCard>
        <h3>同步状态</h3>

        <StatusGrid gutter={16}>
          <Col span={8}>
            <StatusItem>
              <div className="label">状态</div>
              <div className="value" style={{ color: COLORS.success }}>
                <CheckCircleOutlined /> 已同步
              </div>
              {syncStatus.pendingSync > 0 && (
                <div className="sub-value">
                  有 {syncStatus.pendingSync} 项待同步
                </div>
              )}
            </StatusItem>
          </Col>
          <Col span={8}>
            <StatusItem>
              <div className="label">最后同步</div>
              <div className="value">10分钟前</div>
              <div className="sub-value">{syncStatus.lastSync}</div>
            </StatusItem>
          </Col>
          <Col span={8}>
            <StatusItem>
              <div className="label">待同步</div>
              <div className="value">{syncStatus.pendingSync}</div>
              <div className="sub-value">项更改</div>
            </StatusItem>
          </Col>
        </StatusGrid>

        <SyncButton
          $primary
          type="primary"
          icon={<CloudDownloadOutlined />}
          onClick={() => handleSync("pull")}
          loading={syncing}
        >
          从云端拉取
        </SyncButton>
        <SyncButton
          icon={<CloudUploadOutlined />}
          onClick={() => handleSync("push")}
          loading={syncing}
        >
          推送到云端
        </SyncButton>
      </StatusCard>

      {/* 同步设置 */}
      <CardSection>
        <h3>自动同步</h3>
        <p>配置自动同步行为</p>

        <SettingRow>
          <div className="setting-info">
            <div className="setting-name">启用自动同步</div>
            <div className="setting-desc">在后台自动同步数据</div>
          </div>
          <Switch
            checked={autoSync}
            onChange={setAutoSync}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        </SettingRow>

        <SettingRow>
          <div className="setting-info">
            <div className="setting-name">同步间隔</div>
            <div className="setting-desc">自动同步的时间间隔</div>
          </div>
          <StyledSelect
            value={syncInterval}
            onChange={(value) => setSyncInterval(value as number)}
            style={{ width: 160 }}
            disabled={!autoSync}
          >
            <Select.Option value={1}>1 分钟</Select.Option>
            <Select.Option value={5}>5 分钟</Select.Option>
            <Select.Option value={10}>10 分钟</Select.Option>
            <Select.Option value={30}>30 分钟</Select.Option>
          </StyledSelect>
        </SettingRow>

        <SettingRow>
          <div className="setting-info">
            <div className="setting-name">仅在 Wi-Fi 下同步</div>
            <div className="setting-desc">节省移动数据流量</div>
          </div>
          <Switch defaultChecked />
        </SettingRow>
      </CardSection>

      {/* 同步冲突 */}
      {syncStatus.conflicts && syncStatus.conflicts.length > 0 && (
        <CardSection>
          <h3>同步冲突</h3>
          <p>需要手动解决的冲突项</p>

          {syncStatus.conflicts.map((conflict) => (
            <ConflictItem key={conflict.id}>
              <div className="conflict-title">
                <StatusBadge color="warning">冲突</StatusBadge>
                {conflict.title}
              </div>
              <div className="conflict-time">
                冲突时间:{" "}
                {new Date(conflict.conflictAt).toLocaleString("zh-CN")}
              </div>
              <div className="conflict-actions">
                <Button
                  size="small"
                  onClick={() => message.success("已选择本地版本")}
                >
                  使用本地版本
                </Button>
                <Button
                  size="small"
                  onClick={() => message.success("已选择云端版本")}
                >
                  使用云端版本
                </Button>
              </div>
            </ConflictItem>
          ))}
        </CardSection>
      )}
    </SectionContainer>
  );
}

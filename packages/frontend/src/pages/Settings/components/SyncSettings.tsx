import { useState, useEffect } from "react";
import { Button, Switch, Select, message } from "antd";
import { CloudDownloadOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";
import { useNoteStore } from "../../../store/noteStore";

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

    &:disabled {
      background: ${COLORS.subtle};
      border-color: ${COLORS.subtle};
      color: ${COLORS.inkMuted};
      transform: none;
    }
  `
      : `
    background: ${COLORS.paper};
    border-color: ${COLORS.subtle};
    color: ${COLORS.ink};

    &:hover:not(:disabled) {
      border-color: ${COLORS.ink};
      color: ${COLORS.ink};
    }

    &:disabled {
      color: ${COLORS.inkMuted};
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

const ConnectionStatus = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.md};
  background: ${(props) =>
    props.$online ? "rgba(82, 196, 26, 0.1)" : "rgba(255, 77, 79, 0.1)"};
  border: 1px solid
    ${(props) => (props.$online ? COLORS.success : "rgba(255, 77, 79, 0.3)")};
  border-radius: ${BORDER.radius.md};
  margin-bottom: ${SPACING.lg};

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.$online ? COLORS.success : "#ff4d4f")};
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .status-text {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.ink};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
  }
`;

const DataSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${SPACING.md};
  margin-bottom: ${SPACING.lg};

  .summary-item {
    padding: ${SPACING.md};
    background: ${COLORS.background};
    border-radius: ${BORDER.radius.sm};
    text-align: center;

    .item-value {
      font-size: ${TYPOGRAPHY.fontSize.xl};
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
    }

    .item-label {
      font-size: ${TYPOGRAPHY.fontSize.xs};
      color: ${COLORS.inkMuted};
      margin-top: ${SPACING.xs};
    }
  }
`;

// ============================================
// Main Component
// ============================================

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  wifiOnly: boolean;
}

export default function SyncSettings() {
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 5,
    wifiOnly: true,
  });

  // 从 noteStore 获取同步状态
  const { isOnline, syncStatus, lastSyncTime, notes, syncAllNotes } =
    useNoteStore();

  // 从 localStorage 加载设置
  useEffect(() => {
    const saved = localStorage.getItem("syncSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse sync settings:", e);
      }
    }
  }, []);

  // 保存设置到 localStorage
  const saveSettings = (newSettings: SyncSettings) => {
    setSettings(newSettings);
    localStorage.setItem("syncSettings", JSON.stringify(newSettings));
  };

  // 处理同步
  const handleSync = async () => {
    if (!isOnline) {
      message.warning("当前离线，无法同步");
      return;
    }

    setSyncing(true);
    try {
      await syncAllNotes();

      if (syncStatus === "success") {
        message.success("同步成功");
      } else if (syncStatus === "error") {
        message.error("同步失败，请检查网络连接");
      }
    } catch (error) {
      message.error("同步失败");
    } finally {
      setSyncing(false);
    }
  };

  // 格式化同步时间
  const formatSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "从未同步";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  const pendingNotes = notes.filter((n) => !n.isDeleted).length;

  return (
    <SectionContainer>
      <TitleSection>
        <h2>同步设置</h2>
        <p>配置本地数据与云端服务器的同步</p>
      </TitleSection>

      {/* 连接状态 */}
      <ConnectionStatus $online={isOnline}>
        <div className="status-dot" />
        <span className="status-text">
          {isOnline ? "已连接到服务器" : "未连接到服务器"}
        </span>
      </ConnectionStatus>

      {/* 同步状态 */}
      <StatusCard>
        <h3>同步状态</h3>

        <DataSummary>
          <div className="summary-item">
            <div className="item-value">{notes.length}</div>
            <div className="item-label">本地笔记</div>
          </div>
          <div className="summary-item">
            <div className="item-value">{pendingNotes}</div>
            <div className="item-label">可同步</div>
          </div>
          <div className="summary-item">
            <div className="item-value">{formatSyncTime(lastSyncTime)}</div>
            <div className="item-label">上次同步</div>
          </div>
        </DataSummary>

        <SyncButton
          $primary
          type="primary"
          icon={<CloudDownloadOutlined />}
          onClick={handleSync}
          loading={syncing || syncStatus === "syncing"}
          disabled={!isOnline}
        >
          {syncing || syncStatus === "syncing" ? "同步中..." : "立即同步"}
        </SyncButton>
      </StatusCard>

      {/* 同步设置 */}
      <CardSection>
        <h3>自动同步</h3>
        <p>配置自动同步行为</p>

        <SettingRow>
          <div className="setting-info">
            <div className="setting-name">启用自动同步</div>
            <div className="setting-desc">在后台自动同步数据到服务器</div>
          </div>
          <Switch
            checked={settings.autoSync}
            onChange={(checked) =>
              saveSettings({ ...settings, autoSync: checked })
            }
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
            value={settings.syncInterval}
            onChange={(value: unknown) =>
              saveSettings({ ...settings, syncInterval: value as number })
            }
            style={{ width: 160 }}
            disabled={!settings.autoSync || !isOnline}
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
            <div className="setting-desc">
              节省移动数据流量（桌面端仅作参考）
            </div>
          </div>
          <Switch
            checked={settings.wifiOnly}
            onChange={(checked) =>
              saveSettings({ ...settings, wifiOnly: checked })
            }
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        </SettingRow>
      </CardSection>

      {/* 数据说明 */}
      <CardSection>
        <h3>关于同步</h3>
        <p style={{ marginBottom: SPACING.md }}>
          本应用使用双存储架构：本地 IndexedDB + 云端 PostgreSQL
        </p>

        <div
          style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.inkLight }}
        >
          <p style={{ marginBottom: SPACING.sm }}>
            <strong>本地存储 (IndexedDB)</strong>:
            浏览器本地数据库，离线可用，数据持久化
          </p>
          <p style={{ marginBottom: SPACING.sm }}>
            <strong>云端存储 (PostgreSQL)</strong>: 服务器数据库，支持多设备同步
          </p>
          <p>
            <strong>同步机制</strong>: 当您联网时，数据会自动同步到服务器，
            确保多设备间数据一致性。
          </p>
        </div>
      </CardSection>
    </SectionContainer>
  );
}

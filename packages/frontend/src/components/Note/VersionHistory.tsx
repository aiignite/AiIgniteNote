import { useState, useEffect } from "react";
import {
  Modal,
  List,
  Tag,
  Button,
  Space,
  Tooltip,
  Typography,
  Popconfirm,
} from "antd";
import {
  HistoryOutlined,
  RestOutlined,
  ClockCircleOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import { NoteVersion } from "../../types";
import { db } from "../../db";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import styled from "styled-components";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const { Text, Paragraph } = Typography;

const VersionList = styled(List)`
  .ant-list-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    &.selected {
      background: rgba(24, 144, 255, 0.08);
    }
  }
`;

const VersionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const VersionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

const VersionContent = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
  max-height: 100px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.02));
  }
`;

interface VersionHistoryProps {
  visible: boolean;
  onClose: () => void;
  noteId: string;
  onRestore: (version: NoteVersion) => void;
}

function VersionHistory({
  visible,
  onClose,
  noteId,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && noteId) {
      loadVersions();
    }
  }, [visible, noteId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const allVersions = await db.getNoteVersions(noteId);
      setVersions(allVersions.reverse());
    } catch (error) {
      console.error("Failed to load versions:", error);
    }
    setLoading(false);
  };

  const handleVersionSelect = (version: NoteVersion) => {
    if (selectedVersions.length === 2 && !selectedVersions.includes(version)) {
      // 替换最早选择的版本
      setSelectedVersions([selectedVersions[1], version]);
    } else if (selectedVersions.includes(version)) {
      // 取消选择
      setSelectedVersions(selectedVersions.filter((v) => v.id !== version.id));
    } else {
      // 添加选择
      setSelectedVersions([...selectedVersions, version]);
    }
  };

  const handleRestore = (version: NoteVersion) => {
    onRestore(version);
    onClose();
  };

  const compareVersions = () => {
    if (selectedVersions.length === 2) {
      // TODO: 实现版本对比功能
      console.log("Comparing versions:", selectedVersions);
    }
  };

  // 渲染版本列表项
  const renderVersionItem = (version: NoteVersion, index: number) => {
    return (
      <List.Item
        key={version.id}
        className={selectedVersions.includes(version) ? "selected" : ""}
        onClick={() => handleVersionSelect(version)}
      >
        <VersionHeader>
          <Space>
            <Text strong>版本 {versions.length - index}</Text>
            {index === 0 && <Tag color="green">当前版本</Tag>}
          </Space>
          <Space>
            {index !== 0 && (
              <Popconfirm
                title="确定要恢复到这个版本吗？"
                description="当前内容将被替换"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleRestore(version);
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<RestOutlined />}
                  onClick={(e) => e.stopPropagation()}
                >
                  恢复
                </Button>
              </Popconfirm>
            )}
          </Space>
        </VersionHeader>

        <VersionMeta>
          <Space>
            <ClockCircleOutlined />
            <Tooltip
              title={dayjs(version.createdAt).format("YYYY-MM-DD HH:mm:ss")}
            >
              <span>{dayjs(version.createdAt).fromNow()}</span>
            </Tooltip>
          </Space>
          <span>V{index + 1}</span>
        </VersionMeta>

        <VersionContent>
          <Paragraph
            ellipsis={{ rows: 3 }}
            style={{ margin: 0, color: "rgba(0,0,0,0.65)" }}
          >
            {version.content || "无内容"}
          </Paragraph>
        </VersionContent>
      </List.Item>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>版本历史</span>
          <Tag color="blue">{versions.length} 个版本</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={
        selectedVersions.length === 2
          ? [
              <Button key="cancel" onClick={() => setSelectedVersions([])}>
                取消选择
              </Button>,
              <Button
                key="compare"
                type="primary"
                icon={<DiffOutlined />}
                onClick={compareVersions}
              >
                对比版本
              </Button>,
            ]
          : undefined
      }
    >
      {selectedVersions.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            background: "#e6f7ff",
            borderRadius: 4,
          }}
        >
          <Text type="secondary">
            已选择 {selectedVersions.length} 个版本
            {selectedVersions.length === 2 && " - 可以进行对比"}
          </Text>
        </div>
      )}

      <VersionList
        loading={loading}
        dataSource={versions}
        renderItem={(item: unknown, index: number) =>
          renderVersionItem(item as NoteVersion, index)
        }
      />
    </Modal>
  );
}

export default VersionHistory;

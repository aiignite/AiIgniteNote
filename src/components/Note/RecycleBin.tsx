import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Modal,
  message,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  RestOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNoteStore } from "../../store/noteStore";
import { db } from "../../db";
import { Note } from "../../types";
import dayjs from "dayjs";
import styled from "styled-components";

const { Text } = Typography;

const RecycleBinContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow: auto;

  .ant-table {
    background: #fff;
    border-radius: 8px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: rgba(0, 0, 0, 0.45);

  .anticon {
    font-size: 64px;
    margin-bottom: 16px;
    color: rgba(0, 0, 0, 0.2);
  }
`;

function RecycleBinPage() {
  const { notes, loadNotes, restoreNote } = useNoteStore();
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const loadDeletedNotes = async () => {
    await loadNotes();
    const deleted = notes.filter((note) => note.isDeleted);
    setDeletedNotes(deleted);
  };

  const handleRestore = async (noteId: string) => {
    try {
      await restoreNote(noteId);
      message.success("笔记已恢复");
      await loadDeletedNotes();
    } catch (error) {
      message.error("恢复失败");
    }
  };

  const handlePermanentDelete = async (noteId: string) => {
    try {
      await db.permanentDeleteNote(noteId);
      message.success("笔记已永久删除");
      await loadDeletedNotes();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleBatchRestore = async () => {
    try {
      for (const noteId of selectedRowKeys) {
        await restoreNote(noteId as string);
      }
      message.success(`已恢复 ${selectedRowKeys.length} 篇笔记`);
      setSelectedRowKeys([]);
      await loadDeletedNotes();
    } catch (error) {
      message.error("批量恢复失败");
    }
  };

  const handleBatchDelete = async () => {
    Modal.confirm({
      title: "确认永久删除",
      icon: <ExclamationCircleOutlined />,
      content: `确定要永久删除这 ${selectedRowKeys.length} 篇笔记吗？此操作不可撤销。`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          for (const noteId of selectedRowKeys) {
            await db.permanentDeleteNote(noteId as string);
          }
          message.success(`已永久删除 ${selectedRowKeys.length} 篇笔记`);
          setSelectedRowKeys([]);
          await loadDeletedNotes();
        } catch (error) {
          message.error("批量删除失败");
        }
      },
    });
  };

  const handleClearAll = () => {
    Modal.confirm({
      title: "确认清空回收站",
      icon: <ExclamationCircleOutlined />,
      content: "确定要清空回收站吗？所有笔记将被永久删除，此操作不可撤销。",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          for (const note of deletedNotes) {
            await db.permanentDeleteNote(note.id);
          }
          message.success("回收站已清空");
          await loadDeletedNotes();
        } catch (error) {
          message.error("清空失败");
        }
      },
    });
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text: string) => <Text strong>{text || "无标题"}</Text>,
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: string) => {
        const categoryMap: Record<string, string> = {
          default: "未分类",
          work: "工作",
          study: "学习",
          life: "生活",
          ideas: "灵感",
        };
        return <Tag color="blue">{categoryMap[category] || category}</Tag>;
      },
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} color="geekblue">
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && <Tag>+{tags.length - 2}</Tag>}
        </>
      ),
    },
    {
      title: "删除时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (time: number) => (
        <Tooltip title={dayjs(time).format("YYYY-MM-DD HH:mm:ss")}>
          <span>{dayjs(time).fromNow()}</span>
        </Tooltip>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: Note) => (
        <Space>
          <Tooltip title="恢复">
            <Button
              type="link"
              size="small"
              icon={<RestOutlined />}
              onClick={() => handleRestore(record.id)}
            >
              恢复
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定要永久删除这篇笔记吗？"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okType="danger"
          >
            <Tooltip title="永久删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <RecycleBinContainer>
      <Header>
        <h1>回收站</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
              <Button onClick={handleBatchRestore}>
                批量恢复 ({selectedRowKeys.length})
              </Button>
              <Button danger onClick={handleBatchDelete}>
                批量删除
              </Button>
            </>
          )}
          {deletedNotes.length > 0 && (
            <Popconfirm
              title="确认清空回收站"
              description="所有笔记将被永久删除，此操作不可撤销"
              onConfirm={handleClearAll}
              okText="确定"
              okType="danger"
              cancelText="取消"
            >
              <Button danger icon={<ClearOutlined />}>
                清空回收站
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Header>

      {deletedNotes.length === 0 ? (
        <EmptyState>
          <DeleteOutlined />
          <p>回收站为空</p>
          <Text type="secondary">删除的笔记会显示在这里</Text>
        </EmptyState>
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={deletedNotes}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 篇笔记`,
          }}
        />
      )}
    </RecycleBinContainer>
  );
}

export default RecycleBinPage;

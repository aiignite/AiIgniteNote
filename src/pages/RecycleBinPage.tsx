import { useEffect, useState } from "react";
import {
  List,
  Button,
  Space,
  Popconfirm,
  Modal,
  Empty,
  Input,
  Tag,
  App,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  RollbackOutlined,
  ClearOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNoteStore } from "../store/noteStore";
import { Note } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

function RecycleBinPage() {
  const { message } = App.useApp();
  const { getDeletedNotes, restoreNote, deleteNote } = useNoteStore();
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDeletedNotes = async () => {
    setLoading(true);
    try {
      const notes = await getDeletedNotes();
      setDeletedNotes(notes);
    } catch (error) {
      message.error("加载回收站失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  // 过滤笔记
  const filteredNotes = deletedNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      note.content.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // 恢复笔记
  const handleRestore = async (noteId: string) => {
    try {
      await restoreNote(noteId);
      message.success("恢复成功");
      loadDeletedNotes();
    } catch (error) {
      message.error("恢复失败");
    }
  };

  // 永久删除笔记
  const handlePermanentDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      message.success("删除成功");
      loadDeletedNotes();
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 批量清空回收站
  const handleClearAll = async () => {
    Modal.confirm({
      title: "确认清空",
      icon: <ExclamationCircleOutlined />,
      content: "确定要永久清空回收站吗？此操作不可恢复！",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const promises = deletedNotes.map((note) =>
            handlePermanentDelete(note.id),
          );
          await Promise.all(promises);
          message.success("回收站已清空");
        } catch (error) {
          message.error("清空失败");
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 头部操作栏 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Input
            placeholder="搜索已删除的笔记..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          {deletedNotes.length > 0 && (
            <Popconfirm
              title="确定要清空回收站吗？"
              description="此操作将永久删除所有笔记，不可恢复！"
              onConfirm={handleClearAll}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<ClearOutlined />}>
                清空回收站
              </Button>
            </Popconfirm>
          )}
        </Space>
        <div style={{ color: "rgba(0,0,0,0.45)" }}>
          共 {filteredNotes.length} 个笔记
        </div>
      </div>

      {/* 笔记列表 */}
      {filteredNotes.length === 0 ? (
        <Empty
          description={searchValue ? "没有找到匹配的笔记" : "回收站为空"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          loading={loading}
          dataSource={filteredNotes}
          renderItem={(note) => (
            <List.Item
              actions={[
                <Tooltip title="恢复笔记" key="restore">
                  <Button
                    type="link"
                    icon={<RollbackOutlined />}
                    onClick={() => handleRestore(note.id)}
                  >
                    恢复
                  </Button>
                </Tooltip>,
                <Popconfirm
                  title="确定要永久删除吗？"
                  description="此操作不可恢复！"
                  onConfirm={() => handlePermanentDelete(note.id)}
                  okText="确定"
                  cancelText="取消"
                  key="delete"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    永久删除
                  </Button>
                </Popconfirm>,
              ]}
              style={{
                padding: 16,
                background: "#fff",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {note.title || "无标题"}
                    </span>
                    {note.tags.map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                }
                description={
                  <div>
                    <div
                      style={{
                        color: "rgba(0,0,0,0.65)",
                        marginBottom: 8,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "60vw",
                      }}
                    >
                      {note.content || "无内容"}
                    </div>
                    <div
                      style={{
                        color: "rgba(0,0,0,0.25)",
                        fontSize: 12,
                      }}
                    >
                      删除于 {dayjs(note.updatedAt).fromNow()}
                      {" · "}
                      {dayjs(note.updatedAt).format("YYYY-MM-DD HH:mm")}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export default RecycleBinPage;

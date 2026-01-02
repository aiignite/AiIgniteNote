import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  ColorPicker,
  Space,
  Popconfirm,
  message,
  Tag,
  App,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  TagsOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useTagStore } from "../../../store/tagStore";
import { LocalTag as TagType } from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  NOISE_TEXTURE,
} from "../../../styles/design-tokens";

// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xl};
`;

const StyledCard = styled(Card)`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-head {
    border-bottom: 1px solid ${COLORS.subtle};
    padding: ${SPACING.lg} ${SPACING.xl};

    .ant-card-head-title {
      font-family: ${TYPOGRAPHY.fontFamily.display};
      font-size: ${TYPOGRAPHY.fontSize.xl};
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
    }
  }

  .ant-card-body {
    padding: ${SPACING.xl};
  }
`;

const StatsCard = styled(Card)`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  text-align: center;

  .ant-statistic-title {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
  }

  .ant-statistic-content {
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
  }
`;

const TagPreview = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${SPACING.xs} ${SPACING.md};
  border-radius: ${BORDER.radius.sm};
  background: ${(props) => props.$color || COLORS.subtleLight};
  color: ${COLORS.ink};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${SPACING.sm};
`;

// ============================================
// Main Component
// ============================================

function TagsSettings() {
  const { message: messageApi } = App.useApp();
  const { tags, isLoading, loadTags, createTag, updateTag, deleteTag } =
    useTagStore();

  const [form] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // 打开新建/编辑模态框
  const handleOpenEditModal = (tag?: TagType) => {
    if (tag) {
      setEditingTag(tag);
      form.setFieldsValue({
        ...tag,
        color: tag.color || "#1890ff",
      });
    } else {
      setEditingTag(null);
      form.resetFields();
      form.setFieldsValue({
        color: "#1890ff",
      });
    }
    setEditModalVisible(true);
  };

  // 保存标签
  const handleSaveTag = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 转换颜色格式
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || "#1890ff";

      const tagData = {
        name: values.name,
        color: colorValue,
      };

      if (editingTag) {
        await updateTag(editingTag.id, tagData);
        messageApi.success("标签更新成功");
      } else {
        await createTag(tagData);
        messageApi.success("标签创建成功");
      }

      setEditModalVisible(false);
      await loadTags();
    } catch (error: any) {
      console.error("Failed to save tag:", error);
      messageApi.error(error.message || "操作失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除标签
  const handleDeleteTag = async (tag: TagType) => {
    try {
      setSaving(true);
      await deleteTag(tag.id);
      messageApi.success("删除成功");
      await loadTags();
    } catch (error: any) {
      console.error("Failed to delete tag:", error);
      messageApi.error(error.message || "删除失败");
    } finally {
      setSaving(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: "标签名称",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: TagType) => (
        <TagPreview $color={record.color || COLORS.subtleLight}>
          <TagOutlined style={{ marginRight: 4 }} />
          {name}
        </TagPreview>
      ),
    },
    {
      title: "颜色",
      dataIndex: "color",
      key: "color",
      width: 120,
      render: (color: string) => (
        <div
          style={{
            width: 40,
            height: 24,
            borderRadius: 4,
            backgroundColor: color || COLORS.subtleLight,
            border: `1px solid ${COLORS.subtle}`,
          }}
        />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: number) => {
        const date = new Date(createdAt);
        return date.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_: any, record: TagType) => (
        <ActionButtons>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除标签"${record.name}"吗？该操作将从所有笔记中移除此标签。`}
            onConfirm={() => handleDeleteTag(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </ActionButtons>
      ),
    },
  ];

  return (
    <Container>
      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <StatsCard>
            <Statistic
              title="总标签数"
              value={tags.length}
              prefix={<TagsOutlined />}
            />
          </StatsCard>
        </Col>
        <Col span={8}>
          <StatsCard>
            <Statistic
              title="使用中的标签"
              value={tags.filter((t) => t.color).length}
              prefix={<TagOutlined />}
            />
          </StatsCard>
        </Col>
        <Col span={8}>
          <StatsCard>
            <Statistic
              title="最近创建"
              value={
                tags.filter(
                  (t) => Date.now() - t.createdAt < 7 * 24 * 60 * 60 * 1000,
                ).length
              }
              suffix="/ 7天"
            />
          </StatsCard>
        </Col>
      </Row>

      {/* 标签列表 */}
      <StyledCard
        title="标签管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenEditModal()}
          >
            新建标签
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tags.map((t) => ({ ...t, key: t.id }))}
          pagination={false}
          loading={isLoading}
          rowKey="id"
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", color: COLORS.inkMuted }}>
                <TagsOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无标签</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>
                  点击"新建标签"创建您的第一个标签
                </div>
              </div>
            ),
          }}
        />
      </StyledCard>

      {/* 编辑模态框 */}
      <Modal
        title={editingTag ? "编辑标签" : "新建标签"}
        open={editModalVisible}
        onOk={handleSaveTag}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={saving}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="标签名称"
            name="name"
            rules={[
              { required: true, message: "请输入标签名称" },
              { max: 20, message: "标签名称最多20个字符" },
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            label="标签颜色"
            name="color"
            rules={[{ required: true, message: "请选择颜色" }]}
          >
            <ColorPicker
              showText
              format="hex"
              presets={[
                {
                  label: "推荐颜色",
                  colors: [
                    "#f50",
                    "#faad14",
                    "#52c41a",
                    "#1890ff",
                    "#722ed1",
                    "#eb2f96",
                    "#fa541c",
                    "#a0d911",
                    "#13c2c2",
                    "#2f54eb",
                  ],
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}

export default TagsSettings;

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  ColorPicker,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  App,
} from "antd";
import {
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useNoteStore } from "../../../store/noteStore";
import { LocalCategory as Category } from "../../../types";
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

const CategoryIcon = styled.div<{ $color: string; $icon?: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${BORDER.radius.sm};
  background: ${(props) => props.$color || COLORS.subtleLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${TYPOGRAPHY.fontSize.xl};
  margin-right: ${SPACING.md};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${SPACING.sm};
`;

// ============================================
// Icon Options
// ============================================

const ICON_OPTIONS = [
  { label: "📁", value: "📁" },
  { label: "💼", value: "💼" },
  { label: "📚", value: "📚" },
  { label: "🏠", value: "🏠" },
  { label: "💡", value: "💡" },
  { label: "🎯", value: "🎯" },
  { label: "📊", value: "📊" },
  { label: "🔬", value: "🔬" },
  { label: "🎨", value: "🎨" },
  { label: "🎵", value: "🎵" },
  { label: "🏃", value: "🏃" },
  { label: "✈️", value: "✈️" },
  { label: "💰", value: "💰" },
  { label: "❤️", value: "❤️" },
  { label: "⭐", value: "⭐" },
  { label: "🔥", value: "🔥" },
];

// ============================================
// Main Component
// ============================================

function CategoriesSettings() {
  const { message: messageApi } = App.useApp();
  const {
    categories,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useNoteStore();

  const [form] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 打开新建/编辑模态框
  const handleOpenEditModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        ...category,
        color: category.color || "#1890ff",
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({
        icon: "📁",
        color: "#1890ff",
        sortOrder: categories.length,
      });
    }
    setEditModalVisible(true);
  };

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 转换颜色格式
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || "#1890ff";

      // 只发送后端需要的字段，避免发送额外字段导致 400 错误
      const categoryData = {
        name: values.name,
        icon: values.icon,
        color: colorValue,
        sortOrder:
          values.sortOrder !== undefined ? parseInt(values.sortOrder) : 0,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        messageApi.success("分类更新成功");
      } else {
        await createCategory(categoryData);
        messageApi.success("分类创建成功");
      }

      setEditModalVisible(false);
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      messageApi.error(error.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category: Category) => {
    try {
      setLoading(true);
      await deleteCategory(category.id);
      messageApi.success("删除成功");
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      messageApi.error(error.message || "删除失败");
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: "分类",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: Category) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <CategoryIcon
            $color={record.color || COLORS.subtleLight}
            $icon={record.icon}
          >
            {record.icon || <FolderOutlined />}
          </CategoryIcon>
          <span
            style={{
              fontSize: TYPOGRAPHY.fontSize.md,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
            }}
          >
            {record.name}
          </span>
        </div>
      ),
    },
    {
      title: "颜色",
      dataIndex: "color",
      key: "color",
      render: (color: string) => (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: color || COLORS.subtleLight,
            border: `1px solid ${COLORS.subtle}`,
          }}
        />
      ),
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_: any, record: Category) => (
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
            description={`确定要删除分类"${record.name}"吗？该分类下的笔记将变为"未分类"。`}
            onConfirm={() => handleDeleteCategory(record)}
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
      <StyledCard
        title="分类管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenEditModal()}
          >
            新建分类
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories.map((c) => ({ ...c, key: c.id }))}
          pagination={false}
          loading={loading}
          rowKey="id"
        />
      </StyledCard>

      {/* 编辑模态框 */}
      <Modal
        title={editingCategory ? "编辑分类" : "新建分类"}
        open={editModalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: "请输入分类名称" }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item label="图标" name="icon">
            <Select
              placeholder="选择图标"
              options={ICON_OPTIONS}
              optionRender={(option) => (
                <Space>
                  <span style={{ fontSize: "20px" }}>{option.data.label}</span>
                </Space>
              )}
            />
          </Form.Item>

          <Form.Item
            label="颜色"
            name="color"
            rules={[{ required: true, message: "请选择颜色" }]}
          >
            <ColorPicker showText />
          </Form.Item>

          <Form.Item label="排序" name="sortOrder">
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}

export default CategoriesSettings;

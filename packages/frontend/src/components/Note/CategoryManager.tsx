import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Tree,
  Tooltip,
  Popconfirm,
  App,
} from "antd";
import {
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useNoteStore } from "../../store/noteStore";
import { LocalCategory as Category } from "../../types";

const CategoryTreeContainer = styled.div`
  .ant-tree-node-content-wrapper {
    width: calc(100% - 24px);
  }
`;

const CategoryActions = styled.div`
  display: none;
  gap: 4px;
  margin-left: auto;

  .ant-tree-node-content-wrapper:hover & {
    display: flex;
  }
`;

interface CategoryManagerProps {
  visible: boolean;
  onClose: () => void;
}

function CategoryManager({ visible, onClose }: CategoryManagerProps) {
  const { message } = App.useApp();
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

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, loadCategories]);

  // 打开新建/编辑模态框
  const handleOpenEditModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setEditModalVisible(true);
  };

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields();

      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        message.success("分类更新成功");
      } else {
        await createCategory(values);
        message.success("分类创建成功");
      }

      setEditModalVisible(false);
      loadCategories();
    } catch (error) {
      message.error("操作失败");
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      message.success("删除成功");
      loadCategories();
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 构建树形数据
  const treeData = categories.map((category) => ({
    title: (
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <FolderOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        <span style={{ flex: 1 }}>{category.name}</span>
        <CategoryActions>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(category);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description={`确定要删除分类"${category.name}"吗？`}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteCategory(category);
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </CategoryActions>
      </div>
    ),
    key: category.id,
  }));

  return (
    <>
      <Modal
        title="分类管理"
        open={visible}
        onCancel={onClose}
        footer={
          <Button type="primary" onClick={onClose}>
            关闭
          </Button>
        }
        width={600}
      >
        <CategoryTreeContainer>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenEditModal()}
            >
              新建分类
            </Button>
          </div>

          <Tree showLine treeData={treeData} defaultExpandAll />
        </CategoryTreeContainer>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title={editingCategory ? "编辑分类" : "新建分类"}
        open={editModalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: "请输入分类名称" }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CategoryManager;

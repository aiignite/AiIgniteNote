import { useState } from 'react';
import { Layout, Menu, Input, Button } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  StarOutlined,
  DeleteOutlined,
  ApiOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNoteStore } from '../../store/noteStore';
import CategoryManager from '../Note/CategoryManager';
import './Sidebar.css';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, createNote } = useNoteStore();
  const [searchValue, setSearchValue] = useState('');
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);

  // 菜单项
  const menuItems = [
    {
      key: '/notes',
      icon: <FileTextOutlined />,
      label: '所有笔记',
    },
    {
      key: '/notes/favorites',
      icon: <StarOutlined />,
      label: '我的收藏',
    },
    {
      key: 'category-divider',
      type: 'divider' as const,
    },
    {
      key: 'category-group',
      label: '分类',
      type: 'group' as const,
      children: categories.map(cat => ({
        key: `/notes/category/${cat.id}`,
        icon: <FolderOutlined />,
        label: cat.name,
      })),
    },
    {
      key: 'bottom-divider',
      type: 'divider' as const,
    },
    {
      key: '/models',
      icon: <ApiOutlined />,
      label: '模型管理',
    },
    {
      key: '/trash',
      icon: <DeleteOutlined />,
      label: '回收站',
    },
  ];

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/notes')) {
      navigate(key);
    } else if (key === '/models' || key === '/trash') {
      navigate(key);
    }
  };

  // 创建新笔记
  const handleCreateNote = async () => {
    try {
      const note = await createNote({
        title: '新建笔记',
        content: '',
        htmlContent: '',
        tags: [],
        category: 'default',
        isDeleted: false,
        isFavorite: false,
      });
      navigate(`/notes/${note.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // 搜索笔记
  const handleSearch = (value: string) => {
    setSearchValue(value);
    // 这里可以触发搜索功能
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      }}
      theme="light"
    >
      {/* Logo区域 */}
      <div className="sidebar-logo">
        {collapsed ? (
          <div className="logo-icon">📝</div>
        ) : (
          <div className="logo-text">
            <span className="logo-emoji">📝</span>
            <span className="logo-name">AiNote</span>
          </div>
        )}
      </div>

      {/* 新建笔记按钮 */}
      <div className="sidebar-action">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateNote}
          block
          size={collapsed ? 'small' : 'middle'}
        >
          {!collapsed && '新建笔记'}
        </Button>
        {!collapsed && (
          <Button
            type="default"
            icon={<FolderAddOutlined />}
            onClick={() => setCategoryManagerVisible(true)}
            block
            style={{ marginTop: 8 }}
          >
            管理分类
          </Button>
        )}
      </div>

      {/* 搜索框 */}
      {!collapsed && (
        <div className="sidebar-search">
          <Input
            placeholder="搜索笔记..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>
      )}

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />

      {/* 折叠按钮 */}
      <div className="sidebar-collapse-trigger">
        {collapsed ? (
          <MenuUnfoldOutlined onClick={() => onCollapse(false)} />
        ) : (
          <MenuFoldOutlined onClick={() => onCollapse(true)} />
        )}
      </div>

      {/* 分类管理弹窗 */}
      <CategoryManager
        visible={categoryManagerVisible}
        onClose={() => setCategoryManagerVisible(false)}
      />
    </Sider>
  );
}

export default Sidebar;

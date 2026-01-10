import { useState, useEffect } from "react";
import { Input, Button, Dropdown, message, Divider, Tooltip, Tag } from "antd";
import {
  FileTextOutlined,
  StarOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  FileMarkdownOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  FolderOutlined,
  TagsOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CodeOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useNoteStore } from "../../store/noteStore";
import { useTagStore } from "../../store/tagStore";
import { NoteFileType } from "../../types";
import styled, { css } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  TRANSITION,
  SHADOW,
} from "../../styles/design-tokens";
import { BrandLogo } from "../BrandLogo";

// ============================================
// Styled Components
// ============================================

const SidebarContainer = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.paperDark};
  position: relative;
`;

const LogoSection = styled.div<{ $collapsed: boolean }>`
  padding: ${(props) => (props.$collapsed ? SPACING.lg : SPACING.xl)}
    ${SPACING.lg};
  border-bottom: 1px solid ${COLORS.subtle};
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.$collapsed ? "center" : "flex-start")};
  min-height: 64px;
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.md};

  .logo-icon {
    font-size: 24px;
  }

  .logo-name {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  .logo-accent {
    color: ${COLORS.accent};
    font-style: italic;
  }
`;

const LogoImage = styled.img`
  height: 28px;
  width: auto;
  object-fit: contain;
`;

const LogoIconCollapsed = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.ink};
  color: ${COLORS.paper};
  border-radius: ${BORDER.radius.md};
  font-family: ${TYPOGRAPHY.fontFamily.display};
  font-size: ${TYPOGRAPHY.fontSize.lg};
  font-weight: ${TYPOGRAPHY.fontWeight.bold};
`;

const ActionSection = styled.div<{ $collapsed: boolean }>`
  padding: ${SPACING.lg};
  border-bottom: 1px solid ${COLORS.subtle};
`;

const CreateButton = styled(Button)<{ $collapsed: boolean }>`
  height: 40px;
  width: ${(props) => (props.$collapsed ? "40px" : "100%")};
  background: ${COLORS.accent};
  border-color: ${COLORS.accent};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.paper};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
  text-transform: uppercase;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accentHover};
    border-color: ${COLORS.accentHover};
    transform: translateY(-1px);
    box-shadow: ${SHADOW.accent};
  }

  ${(props) =>
    props.$collapsed &&
    css`
      width: 40px !important;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    `}
`;

const SecondaryButton = styled(Button)`
  height: 36px;
  margin-top: ${SPACING.sm};
  border-radius: ${BORDER.radius.sm};
  border-color: ${COLORS.subtle};
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.normal};

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
  }
`;

const SearchSection = styled.div<{ $collapsed: boolean }>`
  padding: ${SPACING.lg};
  padding-bottom: ${SPACING.md};
`;

const StyledSearchInput = styled(Input)`
  background: ${COLORS.background};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  height: 36px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI",
    "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    background: ${COLORS.paper};
    border-color: ${COLORS.ink};
    box-shadow: none;
  }

  .ant-input {
    background: transparent;
    border: none;
    color: ${COLORS.ink};
  }

  .ant-input-prefix {
    color: ${COLORS.inkMuted};
    margin-right: ${SPACING.sm};
  }

  .ant-input-clear {
    color: ${COLORS.inkMuted};
  }
`;

const NavigationSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.md} ${SPACING.lg};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.subtle};
    border-radius: 2px;
  }
`;

const SectionLabel = styled.div<{ $collapsed: boolean; $clickable?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.inkMuted};
  margin-bottom: ${SPACING.sm};
  margin-top: ${SPACING.md};
  ${(props) => (props.$collapsed ? "text-align: center;" : "")};
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  user-select: none;
  transition: color ${TRANSITION.fast};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI",
    "Helvetica Neue", Arial, sans-serif;

  ${(props) =>
    props.$clickable &&
    `
    &:hover {
      color: ${COLORS.ink};
    }
  `}

  &:first-child {
    margin-top: 0;
  }
`;

const CollapseIcon = styled.span`
  margin-left: auto;
  font-size: 10px;
  transition: transform ${TRANSITION.fast};

  &.collapsed {
    transform: rotate(-90deg);
  }
`;

const NavItem = styled.div<{
  $active: boolean;
  $draggable?: boolean;
  $dragOver?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${SPACING.md};
  padding: ${SPACING.sm} ${SPACING.md};
  margin-bottom: 2px;
  border-radius: ${BORDER.radius.sm};
  cursor: pointer;
  transition: all ${TRANSITION.fast};
  color: ${COLORS.inkLight};
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI",
    "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
  letter-spacing: 0.01em;
  position: relative;

  ${(props) =>
    props.$active &&
    css`
      background: ${COLORS.accent};
      color: ${COLORS.paper};
      font-weight: ${TYPOGRAPHY.fontWeight.medium};

      &::before {
        content: "";
        position: absolute;
        left: -${SPACING.lg};
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background: ${COLORS.accentHover};
        border-radius: 0 ${BORDER.radius.sm} ${BORDER.radius.sm} 0;
      }
    `}

  &:hover {
    background: ${(props) => (props.$active ? COLORS.accent : COLORS.subtleLight)};
    color: ${(props) => (props.$active ? COLORS.paper : COLORS.ink)};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
  }

  ${(props) =>
    props.$dragOver &&
    css`
      background: ${COLORS.accent}20;
      border: 1px dashed ${COLORS.accent};
    `}
`;

const NavIcon = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${(props) => (props.$active ? COLORS.paper : COLORS.inkMuted)};
  transition: color ${TRANSITION.fast};

  /* NavItem 悬浮时，图标颜色也跟着变化 */
  ${NavItem}:hover & {
    color: ${(props) => (props.$active ? COLORS.paper : COLORS.ink)};
  }
`;

const BottomSection = styled.div`
  border-top: 1px solid ${COLORS.subtle};
  padding: ${SPACING.md};
`;

const CollapseButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm};
  border: none;
  background: transparent;
  color: ${COLORS.inkMuted};
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI",
    "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
  cursor: pointer;
  border-radius: ${BORDER.radius.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    background: ${COLORS.subtleLight};
    color: ${COLORS.ink};
  }
`;

// ============================================
// Main Component
// ============================================

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    categories,
    createNote,
    updateNote,
    loadCategories,
    setLastUsedFileType,
  } = useNoteStore();
  const { tags, loadTags } = useTagStore();
  const [searchValue, setSearchValue] = useState("");
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(
    null,
  );

  // 折叠状态
  const [navExpanded, setNavExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  // 从 URL 参数中获取当前选中的分类 ID
  const getCurrentCategoryId = () => {
    const match = location.pathname.match(/\/category\/([^/]+)/);
    return match ? match[1] : "";
  };

  // 加载分类和标签
  useEffect(() => {
    loadCategories();
    loadTags();
  }, [loadCategories, loadTags]);

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("noteId", noteId);
    e.dataTransfer.effectAllowed = "move";
  };

  // 处理拖拽经过
  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCategoryId(categoryId);
  };

  // 处理拖拽离开
  const handleDragLeave = () => {
    setDragOverCategoryId(null);
  };

  // 处理放置
  const handleDrop = async (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOverCategoryId(null);

    const noteId = e.dataTransfer.getData("noteId");
    if (noteId) {
      try {
        await updateNote(noteId, { category: categoryId });
        message.success("已移动到分类");
      } catch (error) {
        message.error("移动失败");
      }
    }
  };

  // 判断当前路径是否激活
  const isActive = (path: string) => {
    // 精确匹配路径
    if (location.pathname === path) {
      return true;
    }
    // 对于 /notes 路径，只有在精确匹配时才返回true，不匹配子路径
    // 对于其他路径（如分类、标签），允许子路径匹配
    if (path === "/notes") {
      return false;
    }
    // 其他路径支持子路径匹配（如 /category/:id）
    return location.pathname.startsWith(path + "/");
  };

  // 创建新笔记
  const handleCreateNote = async (
    fileType: NoteFileType = NoteFileType.MARKDOWN,
  ) => {
    try {
      const titles: Record<NoteFileType, string> = {
        [NoteFileType.MARKDOWN]: "新建 Markdown 笔记",
        [NoteFileType.RICH_TEXT]: "新建富文本笔记",
        [NoteFileType.MONACO]: "新建代码笔记",
        [NoteFileType.DRAWIO]: "新建 DrawIO 图表",
        [NoteFileType.MINDMAP]: "新建思维导图",
      };

      const note = await createNote({
        title: titles[fileType],
        content: "",
        htmlContent: "",
        tags: [],
        category: getCurrentCategoryId(), // 使用当前选中的分类，如果没有则使用空字符串
        isDeleted: false,
        isFavorite: false,
        fileType,
      });

      // 记住用户最后使用的文件类型
      setLastUsedFileType(fileType);

      navigate(`/notes/${note.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // 新建笔记下拉菜单项
  const createNoteMenuItems: MenuProps["items"] = [
    {
      key: "markdown",
      label: "Markdown 笔记",
      icon: <FileMarkdownOutlined />,
      onClick: () => handleCreateNote(NoteFileType.MARKDOWN),
    },
    {
      key: "richtext",
      label: "富文本笔记",
      icon: <FileTextOutlined />,
      onClick: () => handleCreateNote(NoteFileType.RICH_TEXT),
    },
    {
      key: "monaco",
      label: "代码笔记",
      icon: <CodeOutlined />,
      onClick: () => handleCreateNote(NoteFileType.MONACO),
    },
    {
      key: "drawio",
      label: "DrawIO 图表",
      icon: <ApartmentOutlined />,
      onClick: () => handleCreateNote(NoteFileType.DRAWIO),
    },
    {
      key: "mindmap",
      label: "思维导图",
      icon: <NodeIndexOutlined />,
      onClick: () => handleCreateNote(NoteFileType.MINDMAP),
    },
  ];

  // 主要导航项
  const mainNavItems = [
    { path: "/notes", icon: <FileTextOutlined />, label: "所有笔记" },
    { path: "/notes/favorites", icon: <StarOutlined />, label: "我的收藏" },
  ];

  // 底部导航项
  const bottomNavItems = [
    { path: "/settings", icon: <SettingOutlined />, label: "设置" },
    { path: "/help", icon: <QuestionCircleOutlined />, label: "帮助" },
    { path: "/trash", icon: <DeleteOutlined />, label: "回收站" },
  ];

  return (
    <SidebarContainer $collapsed={collapsed}>
      {/* Logo区域 */}
      <LogoSection $collapsed={collapsed}>
        {collapsed ? (
          <LogoIconCollapsed>A</LogoIconCollapsed>
        ) : (
          <LogoText>
            <LogoImage
              src="/src/assets/AIIgniteNoteSmall.png"
              alt="AIIgniteNote"
            />
            <BrandLogo size="small" />
          </LogoText>
        )}
      </LogoSection>

      {/* 新建笔记按钮 */}
      <ActionSection $collapsed={collapsed}>
        <Dropdown
          menu={{ items: createNoteMenuItems }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <CreateButton $collapsed={collapsed} icon={<PlusOutlined />}>
            {!collapsed && "新建"}
          </CreateButton>
        </Dropdown>
      </ActionSection>

      {/* 搜索框 */}
      {!collapsed && (
        <SearchSection $collapsed={collapsed}>
          <StyledSearchInput
            placeholder="搜索笔记..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
        </SearchSection>
      )}

      {/* 主导航 */}
      <NavigationSection>
        {!collapsed && (
          <SectionLabel
            $collapsed={false}
            $clickable={true}
            onClick={() => setNavExpanded(!navExpanded)}
          >
            <span>导航</span>
            <CollapseIcon className={navExpanded ? "" : "collapsed"}>
              {navExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </CollapseIcon>
          </SectionLabel>
        )}

        {navExpanded &&
          mainNavItems.map((item) => (
            <Tooltip
              key={item.path}
              title={collapsed ? item.label : undefined}
              placement="right"
            >
              <NavItem
                $active={isActive(item.path)}
                onClick={() => navigate(item.path)}
                draggable
                onDragStart={(e) => {
                  const noteId = localStorage.getItem("currentNoteId");
                  if (noteId) handleDragStart(e as any, noteId);
                }}
              >
                <NavIcon $active={isActive(item.path)}>{item.icon}</NavIcon>
                {!collapsed && <span>{item.label}</span>}
              </NavItem>
            </Tooltip>
          ))}

        {/* 分类 */}
        {categories.length > 0 && !collapsed && (
          <>
            <SectionLabel
              $collapsed={false}
              $clickable={true}
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            >
              <span>分类</span>
              <CollapseIcon className={categoriesExpanded ? "" : "collapsed"}>
                {categoriesExpanded ? (
                  <CaretDownOutlined />
                ) : (
                  <CaretRightOutlined />
                )}
              </CollapseIcon>
            </SectionLabel>
            {categoriesExpanded &&
              categories.map((cat) => (
                <NavItem
                  key={cat.id}
                  $active={isActive(`/notes/category/${cat.id}`)}
                  $draggable
                  $dragOver={dragOverCategoryId === cat.id}
                  onClick={() => navigate(`/notes/category/${cat.id}`)}
                  onDragOver={(e) => handleDragOver(e as any, cat.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e as any, cat.id)}
                >
                  <NavIcon $active={isActive(`/notes/category/${cat.id}`)}>
                    {cat.icon || <FolderOutlined />}
                  </NavIcon>
                  <span>{cat.name}</span>
                </NavItem>
              ))}
          </>
        )}

        {/* 标签 */}
        {tags.length > 0 && !collapsed && (
          <>
            <SectionLabel
              $collapsed={false}
              $clickable={true}
              onClick={() => setTagsExpanded(!tagsExpanded)}
            >
              <span>标签</span>
              <CollapseIcon className={tagsExpanded ? "" : "collapsed"}>
                {tagsExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </CollapseIcon>
            </SectionLabel>
            {tagsExpanded &&
              tags.map((tag) => (
                <NavItem
                  key={tag.id}
                  $active={isActive(`/notes/tag/${tag.id}`)}
                  onClick={() => navigate(`/notes/tag/${tag.id}`)}
                >
                  <NavIcon $active={isActive(`/notes/tag/${tag.id}`)}>
                    <TagsOutlined
                      style={{ color: tag.color || COLORS.inkMuted }}
                    />
                  </NavIcon>
                  <span style={{ flex: 1 }}>{tag.name}</span>
                  <Tag
                    color={tag.color}
                    style={{
                      margin: 0,
                      fontSize: TYPOGRAPHY.fontSize.xs,
                      padding: "2px 6px",
                    }}
                  >
                    {/* 这里可以显示该标签的笔记数量 */}
                  </Tag>
                </NavItem>
              ))}
          </>
        )}

        <Divider
          style={{ margin: `${SPACING.md} 0`, borderColor: COLORS.subtle }}
        />

        {bottomNavItems.map((item) => (
          <Tooltip
            key={item.path}
            title={collapsed ? item.label : undefined}
            placement="right"
          >
            <NavItem
              $active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            >
              <NavIcon $active={isActive(item.path)}>{item.icon}</NavIcon>
              {!collapsed && <span>{item.label}</span>}
            </NavItem>
          </Tooltip>
        ))}
      </NavigationSection>

      {/* 折叠按钮 */}
      <BottomSection>
        <CollapseButton onClick={() => onCollapse(!collapsed)}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </CollapseButton>
      </BottomSection>
    </SidebarContainer>
  );
}

export default Sidebar;

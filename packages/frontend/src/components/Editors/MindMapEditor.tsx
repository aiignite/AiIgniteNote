import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Space, Dropdown, message, Tooltip, Select, Input } from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  BgColorsOutlined,
  LayoutOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import MindMap from "simple-mind-map";
import Themes from "simple-mind-map-plugin-themes";
import MindMapSelect from "simple-mind-map/src/plugins/Select.js";
import MindMapDrag from "simple-mind-map/src/plugins/Drag.js";
import type { EditorProps } from "./BaseEditor";

// 注册主题插件 (只执行一次)
if (
  typeof window !== "undefined" &&
  !(window as any).__mindMapThemesRegistered__
) {
  Themes.init(MindMap);
  (window as any).__mindMapThemesRegistered__ = true;
}

// 注册 Select 框选插件 (只执行一次)
if (
  typeof window !== "undefined" &&
  !(window as any).__mindMapSelectRegistered__
) {
  MindMap.usePlugin(MindMapSelect);
  (window as any).__mindMapSelectRegistered__ = true;
}

// 注册 Drag 拖拽插件 (只执行一次)
if (
  typeof window !== "undefined" &&
  !(window as any).__mindMapDragRegistered__
) {
  MindMap.usePlugin(MindMapDrag);
  (window as any).__mindMapDragRegistered__ = true;
}

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  align-items: center;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;

  & * {
    margin: 0;
    padding: 0;
  }
`;

const TitleInput = styled(Input)`
  border: none;
  font-size: 24px;
  font-weight: 600;
  padding: 12px 16px;

  &:focus {
    box-shadow: none;
  }
`;

// 默认思维导图数据
const defaultMindData = {
  root: {
    data: {
      text: "中心主题",
      children: [
        { data: { text: "分支 1" } },
        { data: { text: "分支 2" } },
        { data: { text: "分支 3" } },
      ],
    },
  },
};

// 布局选项 - 使用正确的字符串值
const layoutOptions = [
  { label: "思维导图", value: "mindMap" },
  { label: "逻辑结构图", value: "logicalStructure" },
  { label: "组织结构图", value: "organizationStructure" },
  { label: "目录组织图", value: "catalogOrganization" },
  { label: "鱼骨图", value: "fishbone" },
  { label: "时间轴", value: "timeline" },
  { label: "竖向时间轴", value: "verticalTimeline" },
];

// 主题选项 - 来自 simple-mind-map-plugin-themes
const themeOptions = [
  // 亮色主题
  { label: "经典绿", value: "classicGreen" },
  { label: "经典蓝", value: "classicBlue" },
  { label: "天空蓝", value: "blueSky" },
  { label: "小黄人", value: "minions" },
  { label: "清新绿", value: "freshGreen" },
  { label: "清新红", value: "freshRed" },
  { label: "红色精神", value: "redSpirit" },
  { label: "浪漫紫", value: "romanticPurple" },
  { label: "天清绿", value: "skyGreen" },
  { label: "绿叶", value: "greenLeaf" },
  { label: "咖啡", value: "coffee" },
  { label: "牛油果", value: "avocado" },
  { label: "秋天", value: "autumn" },
  { label: "奥利奥", value: "oreo" },
  { label: "浅海", value: "shallowSea" },
  { label: "柠檬气泡", value: "lemonBubbles" },
  { label: "玫瑰", value: "rose" },
  { label: "莫兰迪", value: "morandi" },
  { label: "仙人掌", value: "cactus" },
  { label: "脑图经典2", value: "classic2" },
  { label: "脑图经典3", value: "classic3" },
  { label: "脑图经典4", value: "classic4" },
  { label: "脑图经典5", value: "classic5" },
  // 暗色主题
  { label: "脑图经典", value: "classic", dark: true },
  { label: "黑色幽默", value: "blackHumour", dark: true },
  { label: "深夜办公室", value: "lateNightOffice", dark: true },
  { label: "黑金", value: "blackGold", dark: true },
  { label: "橙汁", value: "orangeJuice", dark: true },
  { label: "霓虹灯", value: "neonLamp", dark: true },
  { label: "暗色", value: "dark", dark: true },
  { label: "暗色2", value: "dark2", dark: true },
  { label: "暗色3", value: "dark3", dark: true },
  { label: "暗色7", value: "dark7", dark: true },
];

function MindMapEditor({
  title,
  content,
  metadata,
  onChange,
  onTitleChange,
  onSave,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [data, setData] = useState<any>(defaultMindData);
  const [currentLayout, setCurrentLayout] = useState("logicalStructure");
  const [currentTheme, setCurrentTheme] = useState("classicGreen");

  // 初始化思维导图
  useEffect(() => {
    if (!containerRef.current) return;

    // 解析已有的思维导图数据
    let initialData = defaultMindData;
    try {
      if (metadata?.mindmapData) {
        initialData = JSON.parse(metadata.mindmapData);
      } else if (content) {
        initialData = JSON.parse(content);
      }
    } catch (error) {
      console.error("解析思维导图数据失败:", error);
    }

    setData(initialData);

    // 创建思维导图实例
    const instance = new MindMap({
      el: containerRef.current,
      data: initialData.root || initialData,
      layout: currentLayout,
      theme: currentTheme,
      // 画布操作
      enableDragCanvas: true,
      enableZoom: true,
      mouseWheelZoom: true,
      // 只读模式设置
      readonly: false,
      isReadonly: false,
      // 快捷键
      enableShortCut: true,
      // 节点编辑
      enableNodeEdit: true,
      enableNodeRichText: true,
      // 自由拖拽（可选，有连接线问题）
      enableFreeDrag: false,
      // 框选插件配置
      selectTranslateStep: 3,
      selectTranslateLimit: 20,
      // 拖拽插件配置
      autoMoveWhenMouseInEdgeOnDrag: true,
      dragPlaceholderRectFill: "rgb(94, 200, 248)",
      dragMultiNodeRectConfig: {
        width: 40,
        height: 20,
        fill: "rgb(94, 200, 248)",
      },
      dragOpacityConfig: { cloneNodeOpacity: 0.5, beingDragNodeOpacity: 0.3 },
    });

    mindMapRef.current = instance;

    // 监听容器大小变化，当 AI 助手打开/关闭时重新调整画布
    const resizeObserver = new ResizeObserver(() => {
      if (mindMapRef.current) {
        // 使用 requestAnimationFrame 确保在布局更新后再调整
        requestAnimationFrame(() => {
          mindMapRef.current.resize();
        });
      }
    });

    resizeObserverRef.current = resizeObserver;

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 监听数据变化
    instance.on("data_change", () => {
      try {
        const rootData = instance.getData();
        setData({ root: { data: rootData } });
      } catch (e) {
        console.error("获取数据失败:", e);
      }
    });

    // 渲染完成
    setTimeout(() => {
      try {
        const rootData = instance.getData();
        setData({ root: { data: rootData } });
      } catch (e) {
        console.error("获取数据失败:", e);
      }
    }, 500);

    return () => {
      // 断开 ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      try {
        instance.destroy();
      } catch (e) {
        console.error("销毁思维导图失败:", e);
      }
    };
  }, []);

  // 保存数据
  const handleSave = useCallback(() => {
    if (!mindMapRef.current) return;

    try {
      const currentData = mindMapRef.current.getData(true);
      const jsonData = JSON.stringify({ root: { data: currentData } }, null, 2);
      onChange(jsonData, {
        ...metadata,
        mindmapData: jsonData,
        mindmapLayout: currentLayout,
      });
      onSave?.();
      message.success("保存成功");
    } catch (e) {
      console.error("保存失败:", e);
      message.error("保存失败");
    }
  }, [metadata, onChange, onSave, currentLayout]);

  // 导出功能
  const handleDownload = useCallback(() => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current
        .export("png", true)
        .then((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${title || "mindmap"}.png`;
          a.click();
          URL.revokeObjectURL(url);
          message.success("已导出 PNG 图片");
        })
        .catch((e: any) => {
          console.error("导出失败:", e);
          message.error("导出失败，请使用浏览器的截图功能");
        });
    } catch (e) {
      message.error("导出功能不可用");
    }
  }, [title]);

  // 导入功能
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setData(importedData);
        if (mindMapRef.current) {
          const dataToSet = importedData.root || importedData;
          mindMapRef.current.setData(dataToSet);
          message.success("导入成功");
        }
      } catch (error) {
        console.error("导入失败:", error);
        message.error("导入失败：无效的 JSON 文件");
      }
    };
    reader.readAsText(file);
  }, []);

  const downloadItems = [
    { key: "png", label: "PNG 图片" },
    { key: "json", label: "JSON 数据" },
  ];

  // 添加子节点
  const handleAddChildNode = () => {
    if (!mindMapRef.current) return;
    // 检查是否有选中的节点
    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中一个节点");
      return;
    }
    try {
      mindMapRef.current.execCommand("INSERT_CHILD_NODE");
      message.success("已添加子节点");
    } catch (e) {
      message.error("添加失败");
    }
  };

  // 删除节点
  const handleDeleteNode = () => {
    if (!mindMapRef.current) return;
    // 检查是否有选中的节点
    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中一个节点");
      return;
    }
    try {
      mindMapRef.current.execCommand("REMOVE_NODE");
      message.success("已删除节点");
    } catch (e) {
      message.error("删除失败");
    }
  };

  // 撤销
  const handleUndo = () => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.execCommand("BACK");
    } catch (e) {
      // 忽略无法撤销的错误
    }
  };

  // 重做
  const handleRedo = () => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.execCommand("FORWARD");
    } catch (e) {
      // 忽略无法重做的错误
    }
  };

  // 放大
  const handleZoomIn = () => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.view.enlarge();
    } catch (e) {}
  };

  // 缩小
  const handleZoomOut = () => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.view.narrow();
    } catch (e) {}
  };

  // 适应画布
  const handleFitCanvas = () => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.view.fit();
    } catch (e) {}
  };

  // 切换布局
  const handleLayoutChange = (value: string) => {
    if (!mindMapRef.current) return;
    try {
      mindMapRef.current.setLayout(value);
      setCurrentLayout(value);
      const layoutName = layoutOptions.find((o) => o.value === value)?.label;
      message.success(`已切换到${layoutName}`);
    } catch (e: any) {
      console.error("切换布局失败:", e);
      message.error("切换布局失败");
    }
  };

  // 切换主题
  const handleThemeChange = (theme: string) => {
    if (!mindMapRef.current) {
      message.error("思维导图未初始化");
      return;
    }
    try {
      mindMapRef.current.setTheme(theme);
      setCurrentTheme(theme);
      const themeName = themeOptions.find((o) => o.value === theme)?.label;
      message.success(`已切换到${themeName}主题`);
    } catch (e: any) {
      console.error("切换主题失败:", e);
      message.error("切换主题失败");
    }
  };

  // 复制节点
  const handleCopyNode = () => {
    if (!mindMapRef.current) return;
    // 检查是否有选中的节点
    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中一个节点");
      return;
    }
    try {
      mindMapRef.current.renderer.copy();
      message.success("已复制");
    } catch (e) {
      console.error("复制节点失败:", e);
      message.error("复制失败");
    }
  };

  // 剪切节点
  const handleCutNode = () => {
    if (!mindMapRef.current) return;
    // 检查是否有选中的节点
    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中一个节点");
      return;
    }
    try {
      mindMapRef.current.renderer.cut();
      message.success("已剪切");
    } catch (e) {
      console.error("剪切节点失败:", e);
      message.error("剪切失败");
    }
  };

  // 粘贴节点
  const handlePasteNode = () => {
    if (!mindMapRef.current) return;
    // 检查是否有选中的节点作为粘贴目标
    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中一个节点作为粘贴目标");
      return;
    }
    try {
      mindMapRef.current.renderer.paste();
      message.success("已粘贴");
    } catch (e) {
      console.error("粘贴节点失败:", e);
      message.error("粘贴失败，请先复制节点");
    }
  };

  return (
    <EditorContainer>
      {/* 标题输入 */}
      <TitleInput
        placeholder="请输入标题..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        variant="borderless"
      />

      <Toolbar>
        {/* 节点操作 */}
        <Space size="small">
          <Tooltip title="添加子节点 (Tab)">
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddChildNode}
              size="small"
            >
              子节点
            </Button>
          </Tooltip>
          <Tooltip title="删除节点 (Delete)">
            <Button
              icon={<DeleteOutlined />}
              onClick={handleDeleteNode}
              size="small"
              danger
            />
          </Tooltip>
        </Space>

        {/* 复制粘贴 */}
        <Space size="small">
          <Tooltip title="复制 (Ctrl+C)">
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyNode}
              size="small"
            >
              复制
            </Button>
          </Tooltip>
          <Tooltip title="剪切 (Ctrl+X)">
            <Button
              icon={<ScissorOutlined />}
              onClick={handleCutNode}
              size="small"
            >
              剪切
            </Button>
          </Tooltip>
          <Tooltip title="粘贴 (Ctrl+V)">
            <Button
              icon={<SnippetsOutlined />}
              onClick={handlePasteNode}
              size="small"
            >
              粘贴
            </Button>
          </Tooltip>
        </Space>

        {/* 撤销重做 */}
        <Space size="small">
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button icon={<UndoOutlined />} onClick={handleUndo} size="small" />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button icon={<RedoOutlined />} onClick={handleRedo} size="small" />
          </Tooltip>
        </Space>

        {/* 视图控制 */}
        <Space size="small">
          <Tooltip title="放大 (Ctrl++)">
            <Button
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              size="small"
            />
          </Tooltip>
          <Tooltip title="缩小 (Ctrl+-)">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              size="small"
            />
          </Tooltip>
          <Tooltip title="适应画布 (Ctrl+I)">
            <Button
              icon={<FullscreenOutlined />}
              onClick={handleFitCanvas}
              size="small"
            />
          </Tooltip>
        </Space>

        {/* 布局切换 */}
        <Select
          value={currentLayout}
          onChange={(value) => handleLayoutChange(value as string)}
          options={layoutOptions}
          style={{ width: 120 }}
          size="small"
          suffixIcon={<LayoutOutlined />}
          placeholder="选择布局"
        />

        {/* 主题切换 */}
        <Select
          value={currentTheme}
          onChange={handleThemeChange}
          options={themeOptions}
          style={{ width: 120 }}
          size="small"
          suffixIcon={<BgColorsOutlined />}
          placeholder="选择主题"
        />

        {/* 文件操作 */}
        <Space style={{ marginLeft: "auto" }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json,.smm";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImport(file);
              };
              input.click();
            }}
            size="small"
          >
            导入
          </Button>
          <Dropdown
            menu={{
              items: downloadItems,
              onClick: ({ key }) => {
                if (key === "png") {
                  handleDownload();
                } else {
                  try {
                    const jsonData = JSON.stringify(data, null, 2);
                    const blob = new Blob([jsonData], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title || "mindmap"}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    message.success("已导出 JSON 文件");
                  } catch (e) {
                    message.error("导出失败");
                  }
                }
              },
            }}
          >
            <Button icon={<DownloadOutlined />} size="small">
              导出
            </Button>
          </Dropdown>
          {onSave && (
            <Button type="primary" onClick={handleSave} size="small">
              保存
            </Button>
          )}
        </Space>

        {/* 操作提示 */}
        <div style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>
          双击编辑 | Tab子节点 | Enter兄弟节点 | Delete删除 | 右键拖动框选
        </div>
      </Toolbar>

      <CanvasContainer ref={containerRef} />
    </EditorContainer>
  );
}

export default MindMapEditor;

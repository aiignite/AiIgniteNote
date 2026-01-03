import { useEffect, useRef, useState } from "react";
import { Button, Space, Dropdown, message, Tooltip, Input, Modal } from "antd";
import {
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
  QuestionCircleOutlined,
  SendOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import MindMap from "simple-mind-map";
import Themes from "simple-mind-map-plugin-themes";
import MindMapSelect from "simple-mind-map/src/plugins/Select.js";
import MindMapDrag from "simple-mind-map/src/plugins/Drag.js";
import type { EditorProps } from "./BaseEditor";
import { useAIStore } from "../../store/aiStore";
import {
  SelectedContent,
  SelectionHelper,
  MindMapNodeData,
} from "../../types/selection";
import {
  validateMindMapJSON,
  extractMindMapJSONFromResponse,
} from "../../prompts/mindmap-prompts";

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
      children: [],
    },
  },
};

// 布局选项 - 使用正确的字符串值
const layoutOptions = [
  { key: "mindMap", label: "思维导图", value: "mindMap" },
  { key: "logicalStructure", label: "逻辑结构图", value: "logicalStructure" },
  {
    key: "organizationStructure",
    label: "组织结构图",
    value: "organizationStructure",
  },
  {
    key: "catalogOrganization",
    label: "目录组织图",
    value: "catalogOrganization",
  },
  { key: "fishbone", label: "鱼骨图", value: "fishbone" },
  { key: "timeline", label: "时间轴", value: "timeline" },
  { key: "verticalTimeline", label: "竖向时间轴", value: "verticalTimeline" },
];

// 主题选项 - 来自 simple-mind-map-plugin-themes
const themeOptions = [
  // 亮色主题
  { key: "classicGreen", label: "经典绿", value: "classicGreen" },
  { key: "classicBlue", label: "经典蓝", value: "classicBlue" },
  { key: "blueSky", label: "天空蓝", value: "blueSky" },
  { key: "minions", label: "小黄人", value: "minions" },
  { key: "freshGreen", label: "清新绿", value: "freshGreen" },
  { key: "freshRed", label: "清新红", value: "freshRed" },
  { key: "redSpirit", label: "红色精神", value: "redSpirit" },
  { key: "romanticPurple", label: "浪漫紫", value: "romanticPurple" },
  { key: "skyGreen", label: "天清绿", value: "skyGreen" },
  { key: "greenLeaf", label: "绿叶", value: "greenLeaf" },
  { key: "coffee", label: "咖啡", value: "coffee" },
  { key: "avocado", label: "牛油果", value: "avocado" },
  { key: "autumn", label: "秋天", value: "autumn" },
  { key: "oreo", label: "奥利奥", value: "oreo" },
  { key: "shallowSea", label: "浅海", value: "shallowSea" },
  { key: "lemonBubbles", label: "柠檬气泡", value: "lemonBubbles" },
  { key: "rose", label: "玫瑰", value: "rose" },
  { key: "morandi", label: "莫兰迪", value: "morandi" },
  { key: "cactus", label: "仙人掌", value: "cactus" },
  { key: "classic2", label: "脑图经典2", value: "classic2" },
  { key: "classic3", label: "脑图经典3", value: "classic3" },
  { key: "classic4", label: "脑图经典4", value: "classic4" },
  { key: "classic5", label: "脑图经典5", value: "classic5" },
  // 暗色主题
  { key: "classic", label: "脑图经典", value: "classic", dark: true },
  { key: "blackHumour", label: "黑色幽默", value: "blackHumour", dark: true },
  {
    key: "lateNightOffice",
    label: "深夜办公室",
    value: "lateNightOffice",
    dark: true,
  },
  { key: "blackGold", label: "黑金", value: "blackGold", dark: true },
  { key: "orangeJuice", label: "橙汁", value: "orangeJuice", dark: true },
  { key: "neonLamp", label: "霓虹灯", value: "neonLamp", dark: true },
  { key: "dark", label: "暗色", value: "dark", dark: true },
  { key: "dark2", label: "暗色2", value: "dark2", dark: true },
  { key: "dark3", label: "暗色3", value: "dark3", dark: true },
  { key: "dark7", label: "暗色7", value: "dark7", dark: true },
];

function MindMapEditor({
  title,
  content,
  metadata,
  onChange,
  onTitleChange,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { setSelectedContent, sendMindmapToAI, importMindmapFromClipboard } =
    useAIStore();

  // 从 metadata 中读取保存的布局和主题,如果没有则使用默认值
  const [currentLayout, setCurrentLayout] = useState(
    metadata?.mindmapLayout || "logicalStructure",
  );
  const [currentTheme, setCurrentTheme] = useState(
    metadata?.mindmapTheme || "classicGreen",
  );
  const [helpVisible, setHelpVisible] = useState(false);
  const [selectedNodeCount, setSelectedNodeCount] = useState(0);

  // 初始化思维导图
  useEffect(() => {
    if (!containerRef.current) return;

    // 解析已有的思维导图数据
    let initialData = defaultMindData.root;
    try {
      let parsedData = null;

      if (metadata?.mindmapData) {
        parsedData = JSON.parse(metadata.mindmapData);
      } else if (content) {
        parsedData = JSON.parse(content);
      }

      if (parsedData) {
        // 验证并规范化数据
        const validation = validateMindMapJSON(parsedData);
        console.log("[MindMapEditor] 初始化数据验证结果:", validation);
        console.log("[MindMapEditor] parsedData:", parsedData);

        if (validation.valid && validation.normalized) {
          // 使用规范化后的数据
          initialData = validation.normalized;
          console.log(
            "[MindMapEditor] 使用规范化数据加载思维导图:",
            initialData,
          );
          console.log("[MindMapEditor] initialData.root:", initialData.root);
          console.log("[MindMapEditor] initialData.data:", initialData.data);
          console.log(
            "[MindMapEditor] initialData.data?.children 数量:",
            initialData.data?.children?.length,
          );
        } else {
          console.warn("思维导图数据格式验证失败:", validation.error);
          // 尝试直接使用(可能是旧格式)
          initialData = parsedData;
          console.log("[MindMapEditor] 尝试直接使用原始数据:", initialData);
        }
      } else {
        console.log("[MindMapEditor] 没有找到保存的数据,使用默认数据");
      }
    } catch (error) {
      console.error("解析思维导图数据失败:", error);
      initialData = defaultMindData.root;
    }

    // 创建思维导图实例
    // 注意：initialData 可能是 {data: {...}} 格式（从验证函数返回）
    // 或者是 {root: {data: {...}}} 格式（默认格式）
    // simple-mind-map 的构造函数期望 data 参数直接是节点数据对象
    const dataForConstructor = initialData.root
      ? initialData.root
      : initialData;
    console.log("[MindMapEditor] 传入构造函数的数据:", dataForConstructor);

    const instance = new MindMap({
      el: containerRef.current,
      data: dataForConstructor,
      layout: currentLayout as any,
      theme: currentTheme,
      // 画布操作
      enableZoom: true,
      mouseWheelZoom: true,
      // 只读模式设置
      readonly: false,
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
    } as any);

    mindMapRef.current = instance;

    // 监听容器大小变化，当 AI 助手打开/关闭时重新调整画布
    const resizeObserver = new ResizeObserver(() => {
      if (mindMapRef.current) {
        // 使用 requestAnimationFrame 确保在布局更新后再调整
        requestAnimationFrame(() => {
          mindMapRef.current?.resize();
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
        // 使用 getData(false) 获取纯净的节点数据,不包含渲染状态
        const currentData = mindMapRef.current?.getData(false);
        if (currentData) {
          // 直接保存节点数据
          const jsonData = JSON.stringify(currentData, null, 2);
          onChange(jsonData, {
            ...metadata,
            mindmapData: jsonData,
            mindmapLayout: currentLayout as
              | "mindMap"
              | "logicalStructure"
              | "organizationStructure"
              | "catalogOrganization"
              | "fishbone"
              | "timeline"
              | "verticalTimeline",
            mindmapTheme: currentTheme,
          });
        }
      } catch (e) {
        console.error("保存数据失败:", e);
      }
    });

    // 渲染完成
    setTimeout(() => {
      // 渲染完成后的处理
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
      setCurrentLayout(value as any);
      const layoutName = layoutOptions.find((o) => o.value === value)?.label;
      message.success(`已切换到${layoutName}`);

      // 保存布局信息
      try {
        const currentData = mindMapRef.current.getData(false);
        if (currentData) {
          const jsonData = JSON.stringify(currentData, null, 2);
          onChange(jsonData, {
            ...metadata,
            mindmapData: jsonData,
            mindmapLayout: value as any,
            mindmapTheme: currentTheme,
          });
        }
      } catch (e) {
        console.error("保存布局失败:", e);
      }
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

      // 保存主题信息
      try {
        const currentData = mindMapRef.current.getData(false);
        if (currentData) {
          const jsonData = JSON.stringify(currentData, null, 2);
          onChange(jsonData, {
            ...metadata,
            mindmapData: jsonData,
            mindmapLayout: currentLayout as any,
            mindmapTheme: theme,
          });
        }
      } catch (e) {
        console.error("保存主题失败:", e);
      }
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

  // 从节点列表提取节点数据
  const extractNodeData = (nodeList: any[]): MindMapNodeData[] => {
    if (!nodeList || nodeList.length === 0) return [];

    return nodeList.map((node) => {
      const data = node.getData();
      return {
        text: data.text || "",
        level: data.layerIndex || 0,
        id: data.uid || node.id,
      };
    });
  };

  // 发送选中节点到 AI 助手
  const handleSendToAI = () => {
    if (!mindMapRef.current) return;

    const activeNodes = mindMapRef.current.renderer.activeNodeList;
    if (!activeNodes || activeNodes.length === 0) {
      message.warning("请先选中节点");
      return;
    }

    try {
      // 获取完整数据
      const fullData = mindMapRef.current.getData(false);

      // 提取节点数据
      const nodeDataList = extractNodeData(activeNodes);

      // 发送到 AI
      sendMindmapToAI(fullData, nodeDataList);

      message.success(`已将思维导图数据发送到 AI 助手`);
    } catch (e) {
      console.error("发送节点到 AI 失败:", e);
      message.error("发送失败");
    }
  };

  // 从 AI 助手剪贴板导入
  const handleImportFromAI = () => {
    const result = importMindmapFromClipboard();

    if (!result.success) {
      message.error(result.error || "导入失败");
      return;
    }

    if (!result.data) {
      message.error("没有可导入的数据");
      return;
    }

    try {
      console.log("[MindMapEditor] 从AI导入原始数据:", result.data);

      // 验证数据结构
      const validation = validateMindMapJSON(result.data);
      console.log("[MindMapEditor] 验证结果:", validation);

      if (!validation.valid) {
        message.error(`数据格式错误: ${validation.error}`);
        return;
      }

      // 使用规范化后的数据
      const normalizedData = validation.normalized || result.data;
      console.log("[MindMapEditor] 规范化后的数据:", normalizedData);
      console.log("[MindMapEditor] normalizedData.data:", normalizedData.data);
      console.log(
        "[MindMapEditor] normalizedData.data?.children 数量:",
        normalizedData.data?.children?.length,
      );

      // 更新思维导图 - 注意 setData 的数据格式
      // simple-mind-map 的 setData 期望的是纯节点数据对象，不需要包装
      let dataToSet;
      if (normalizedData.data && typeof normalizedData.data === "object") {
        // 这是 {data: {...}} 格式，提取 data 部分
        dataToSet = normalizedData.data;
        console.log(
          "[MindMapEditor] 从AI导入 - 从 {data: {...}} 格式提取 data:",
          dataToSet,
        );
      } else if (normalizedData.root) {
        // 这是 {root: {...}} 格式，提取 root 部分
        dataToSet = normalizedData.root;
        console.log(
          "[MindMapEditor] 从AI导入 - 从 {root: {...}} 格式提取 root:",
          dataToSet,
        );
      } else {
        // 直接是节点数据
        dataToSet = normalizedData;
        console.log("[MindMapEditor] 从AI导入 - 直接使用节点数据:", dataToSet);
      }

      console.log(
        "[MindMapEditor] 从AI导入 - 最终传入 setData 的数据:",
        dataToSet,
      );
      console.log("[MindMapEditor] 从AI导入 - dataToSet.text:", dataToSet.text);
      console.log(
        "[MindMapEditor] 从AI导入 - dataToSet.children 数量:",
        dataToSet.children?.length,
      );

      mindMapRef.current?.setData(dataToSet);

      // 保存到笔记
      const jsonData = JSON.stringify(result.data, null, 2);
      onChange(jsonData, {
        ...metadata,
        mindmapData: jsonData,
        mindmapLayout: currentLayout,
        mindmapTheme: currentTheme,
      });

      message.success("已从 AI 助手导入思维导图");
    } catch (error) {
      console.error("导入失败:", error);
      message.error("导入失败");
    }
  };

  // 从系统剪贴板导入
  const handleImportFromClipboard = async () => {
    try {
      // 从系统剪贴板读取
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        message.warning("剪贴板为空");
        return;
      }

      console.log(
        "[MindMapEditor] 从剪贴板读取的内容长度:",
        clipboardText.length,
      );

      // 尝试解析JSON
      let jsonData;
      try {
        jsonData = JSON.parse(clipboardText);
        console.log("[MindMapEditor] 解析后的 JSON:", jsonData);
      } catch (parseError) {
        console.log("[MindMapEditor] 直接解析失败，尝试提取代码块");
        // 如果直接解析失败,尝试提取代码块
        const extractResult = extractMindMapJSONFromResponse(clipboardText);
        if (extractResult.success && extractResult.data) {
          jsonData = extractResult.data;
          console.log("[MindMapEditor] 提取代码块后的数据:", jsonData);
        } else {
          message.error("剪贴板内容不是有效的思维导图JSON");
          return;
        }
      }

      // 验证数据结构
      const validation = validateMindMapJSON(jsonData);
      console.log("[MindMapEditor] 验证结果:", validation);

      if (!validation.valid) {
        message.error(`数据格式错误: ${validation.error}`);
        return;
      }

      // 使用规范化后的数据
      const normalizedData = validation.normalized || jsonData;
      console.log("[MindMapEditor] 规范化后的数据:", normalizedData);
      console.log("[MindMapEditor] normalizedData.data:", normalizedData.data);
      console.log(
        "[MindMapEditor] normalizedData.data?.children 数量:",
        normalizedData.data?.children?.length,
      );

      // 更新思维导图 - 注意 setData 的数据格式
      // simple-mind-map 的 setData 期望的是纯节点数据对象，不需要包装
      // 如果 normalizedData 是 {data: {...}} 格式，需要提取 data 部分传给 setData
      // 如果 normalizedData 本身就是节点数据对象（有 text 和 children），直接使用
      let dataToSet;
      if (normalizedData.data && typeof normalizedData.data === "object") {
        // 这是 {data: {...}} 格式，提取 data 部分
        dataToSet = normalizedData.data;
        console.log(
          "[MindMapEditor] 从 {data: {...}} 格式提取 data:",
          dataToSet,
        );
      } else if (normalizedData.root) {
        // 这是 {root: {...}} 格式，提取 root 部分
        dataToSet = normalizedData.root;
        console.log(
          "[MindMapEditor] 从 {root: {...}} 格式提取 root:",
          dataToSet,
        );
      } else {
        // 直接是节点数据
        dataToSet = normalizedData;
        console.log("[MindMapEditor] 直接使用节点数据:", dataToSet);
      }

      console.log("[MindMapEditor] 最终传入 setData 的数据:", dataToSet);
      console.log("[MindMapEditor] dataToSet.text:", dataToSet.text);
      console.log(
        "[MindMapEditor] dataToSet.children 数量:",
        dataToSet.children?.length,
      );

      // 使用 setData 方法
      if (mindMapRef.current) {
        mindMapRef.current.setData(dataToSet);

        // 强制重新渲染
        setTimeout(() => {
          console.log("[MindMapEditor] 触发重新渲染");
          mindMapRef.current?.render();
        }, 100);

        // 调整视图以适应新数据
        setTimeout(() => {
          console.log("[MindMapEditor] 调整视图适应");
          mindMapRef.current?.view.fit();
        }, 200);
      }

      // 保存到笔记
      const jsonString = JSON.stringify(jsonData, null, 2);
      onChange(jsonString, {
        ...metadata,
        mindmapData: jsonString,
        mindmapLayout: currentLayout,
        mindmapTheme: currentTheme,
      });

      message.success("已从剪贴板导入思维导图");
    } catch (error) {
      console.error("从剪贴板导入失败:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        message.error("无法访问剪贴板,请授予权限或手动粘贴");
      } else {
        message.error("导入失败,请确保剪贴板中有有效的JSON数据");
      }
    }
  };
  useEffect(() => {
    if (!mindMapRef.current) return;

    const handleNodeSelect = () => {
      const activeNodes = mindMapRef.current?.renderer.activeNodeList;
      const count = activeNodes?.length || 0;
      setSelectedNodeCount(count);
    };

    // 监听节点选中事件
    mindMapRef.current.on("node_active", handleNodeSelect);
    mindMapRef.current.on("node_inactive", handleNodeSelect);

    return () => {
      if (mindMapRef.current) {
        mindMapRef.current.off("node_active", handleNodeSelect);
        mindMapRef.current.off("node_inactive", handleNodeSelect);
      }
    };
  }, []);

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
          <Tooltip title="删除节点 (Delete)">
            <Button
              icon={<DeleteOutlined />}
              onClick={handleDeleteNode}
              size="small"
              danger
            />
          </Tooltip>

          {/* 发送到 AI 助手 */}
          <Tooltip
            title={`发送选中节点到 AI 助手 ${selectedNodeCount > 0 ? `(${selectedNodeCount} 个节点)` : ""}`}
          >
            <Button
              type={selectedNodeCount > 0 ? "primary" : "default"}
              icon={<SendOutlined />}
              onClick={handleSendToAI}
              size="small"
              disabled={selectedNodeCount === 0}
            />
          </Tooltip>

          {/* 从 AI 导入 */}
          <Tooltip title="从 AI 助手导入">
            <Button
              type="primary"
              icon={<ImportOutlined />}
              onClick={handleImportFromAI}
              size="small"
            >
              从 AI 导入
            </Button>
          </Tooltip>

          {/* 从剪贴板导入 */}
          <Tooltip title="从系统剪贴板导入(支持手工复制)">
            <Button
              icon={<CopyOutlined />}
              onClick={handleImportFromClipboard}
              size="small"
            >
              粘贴导入
            </Button>
          </Tooltip>
        </Space>

        {/* 复制粘贴 */}
        <Space size="small">
          <Tooltip title="复制 (Ctrl+C)">
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyNode}
              size="small"
            />
          </Tooltip>
          <Tooltip title="剪切 (Ctrl+X)">
            <Button
              icon={<ScissorOutlined />}
              onClick={handleCutNode}
              size="small"
            />
          </Tooltip>
          <Tooltip title="粘贴 (Ctrl+V)">
            <Button
              icon={<SnippetsOutlined />}
              onClick={handlePasteNode}
              size="small"
            />
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
        <Dropdown
          menu={{
            items: layoutOptions as any,
            onClick: ({ key }) => handleLayoutChange(key as string),
            selectedKeys: [currentLayout],
          }}
        >
          <Tooltip title="切换布局">
            <Button icon={<LayoutOutlined />} size="small" />
          </Tooltip>
        </Dropdown>

        {/* 主题切换 */}
        <Dropdown
          menu={{
            items: themeOptions as any,
            onClick: ({ key }) => handleThemeChange(key as string),
            selectedKeys: [currentTheme],
          }}
        >
          <Tooltip title="切换主题">
            <Button icon={<BgColorsOutlined />} size="small" />
          </Tooltip>
        </Dropdown>

        {/* 帮助按钮 */}
        <Tooltip title="操作指南">
          <Button
            icon={<QuestionCircleOutlined />}
            size="small"
            onClick={() => setHelpVisible(true)}
          />
        </Tooltip>
      </Toolbar>

      <CanvasContainer ref={containerRef} />

      {/* 操作指南弹窗 */}
      <Modal
        title="思维导图操作指南"
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHelpVisible(false)}>
            我知道了
          </Button>,
        ]}
        width={600}
      >
        <div style={{ lineHeight: "1.8" }}>
          <h3>📝 节点编辑</h3>
          <ul>
            <li>
              <strong>双击节点</strong> - 编辑节点文本内容
            </li>
            <li>
              <strong>Tab 键</strong> - 添加子节点
            </li>
            <li>
              <strong>Enter 键</strong> - 添加兄弟节点（同级节点）
            </li>
            <li>
              <strong>Delete 键</strong> - 删除选中的节点
            </li>
          </ul>

          <h3>🖱️ 鼠标操作</h3>
          <ul>
            <li>
              <strong>左键拖动</strong> - 移动画布位置
            </li>
            <li>
              <strong>滚轮</strong> - 缩放画布大小
            </li>
            <li>
              <strong>右键拖动</strong> - 框选多个节点
            </li>
            <li>
              <strong>点击节点</strong> - 选中节点（可多选）
            </li>
          </ul>

          <h3>✂️ 编辑功能</h3>
          <ul>
            <li>
              <strong>复制/剪切/粘贴</strong> - 使用工具栏按钮或快捷键
              Ctrl+C/Ctrl+V/Ctrl+X
            </li>
            <li>
              <strong>撤销/重做</strong> - 使用工具栏按钮或快捷键 Ctrl+Z/Ctrl+Y
            </li>
          </ul>

          <h3>🎨 视图控制</h3>
          <ul>
            <li>
              <strong>切换布局</strong> - 点击布局图标，选择不同的思维导图结构
            </li>
            <li>
              <strong>切换主题</strong> - 点击主题图标，选择不同的颜色样式
            </li>
            <li>
              <strong>适应画布</strong> - 自动调整视图以显示完整导图
            </li>
          </ul>
        </div>
      </Modal>
    </EditorContainer>
  );
}

export default MindMapEditor;

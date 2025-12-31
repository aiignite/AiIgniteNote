# AiNote - AI智能笔记应用实施计划

## 项目概述

开发一款具有AI辅助功能的笔记应用，参考有道云笔记的简洁高效设计理念。

## 技术栈（已选定）

- **前端框架**: React 18 + TypeScript + Vite
- **UI组件库**: Ant Design 5 + Styled Components
- **状态管理**: Zustand + React Query
- **富文本编辑**: TipTap
- **AI集成**: Vercel AI SDK + GML-4.7 API
- **数据存储**: IndexedDB (Dexie.js)

## 项目结构

```
src/
├── components/
│   ├── Note/           # 笔记管理组件
│   ├── AIAssistant/    # AI助手侧边栏
│   ├── ModelManagement/# 模型管理页面
│   ├── Layout/         # 布局组件
│   └── Common/         # 通用组件
├── store/              # Zustand状态管理
├── services/           # AI服务和API调用
├── db/                 # IndexedDB数据库层
├── types/              # TypeScript类型定义（已完成）
├── utils/              # 工具函数
├── hooks/              # 自定义React Hooks
└── styles/             # 全局样式
```

## 实施步骤

### 第一阶段：核心数据层和服务层

#### 1.1 完成数据库层（db/index.ts）
- [x] 类型定义已创建
- [ ] 完善数据库操作方法
- [ ] 初始化默认数据

#### 1.2 创建状态管理Store
**文件**: `src/store/noteStore.ts`
- 笔记CRUD操作状态
- 当前选中笔记状态
- 搜索和过滤状态
- 分类管理状态

**文件**: `src/store/aiStore.ts`
- AI对话历史状态
- 当前对话状态
- AI响应流式状态

**文件**: `src/store/modelStore.ts`
- 模型配置状态
- 使用日志状态
- 配额监控状态

**文件**: `src/store/settingsStore.ts`
- 应用主题状态
- 自动保存配置
- 用户偏好设置

#### 1.3 创建AI服务层
**文件**: `src/services/aiService.ts`
- GML-4.7 API集成
- 流式响应处理
- 错误处理和重试机制

**文件**: `src/services/attachmentService.ts`
- 图片上传处理
- 附件存储管理
- Base64编码转换

### 第二阶段：笔记管理核心模块

#### 2.1 富文本编辑器组件
**文件**: `src/components/Note/NoteEditor.tsx`
- TipTap编辑器集成
- 工具栏（加粗、斜体、标题、列表等）
- 图片插入和拖拽上传
- Markdown快捷键支持
- 自动保存功能

#### 2.2 笔记列表组件
**文件**: `src/components/Note/NoteList.tsx`
- 笔记卡片展示
- 搜索和过滤功能
- 标签显示和筛选
- 收藏标记
- 时间排序

#### 2.3 笔记详情组件
**文件**: `src/components/Note/NoteDetail.tsx`
- 笔记内容展示
- 元信息显示（创建时间、标签）
- 附件展示
- 版本历史入口

#### 2.4 分类管理组件
**文件**: `src/components/Note/CategoryManager.tsx`
- 分类树形结构
- 分类CRUD操作
- 拖拽排序
- 图标选择

#### 2.5 标签管理组件
**文件**: `src/components/Note/TagManager.tsx`
- 标签输入和选择
- 标签颜色设置
- 标签搜索
- 标签统计

#### 2.6 版本历史组件
**文件**: `src/components/Note/VersionHistory.tsx`
- 版本列表展示
- 版本对比功能
- 版本恢复功能
- 时间线可视化

#### 2.7 回收站组件
**文件**: `src/components/Note/RecycleBin.tsx`
- 已删除笔记列表
- 恢复功能
- 永久删除确认
- 自动清理过期

### 第三阶段：AI助手侧边栏

#### 3.1 AI助手主容器
**文件**: `src/components/AIAssistant/AIAssistantSidebar.tsx`
- 可折叠侧边栏
- 优雅的视觉设计
- 响应式布局
- 动画过渡效果

#### 3.2 对话界面
**文件**: `src/components/AIAssistant/ChatInterface.tsx`
- 消息列表展示
- 流式响应渲染
- Markdown格式支持
- 代码高亮显示

#### 3.3 输入区域
**文件**: `src/components/AIAssistant/ChatInput.tsx`
- 多行文本输入
- 发送按钮
- 快捷操作按钮
- 语音输入（可选）

#### 3.4 快捷功能面板
**文件**: `src/components/AIAssistant/QuickActions.tsx`
- 内容生成
- 改写润色
- 摘要提取
- 关键词生成
- 翻译功能
- 语法修正

#### 3.5 对话历史管理
**文件**: `src/components/AIAssistant/ConversationHistory.tsx`
- 历史对话列表
- 对话搜索
- 对话删除
- 对话导出

#### 3.6 AI设置面板
**文件**: `src/components/AIAssistant/AISettings.tsx`
- 温度参数调节
- 输出长度设置
- 响应风格选择

### 第四阶段：大模型管理页面

#### 4.1 模型配置页面
**文件**: `src/components/ModelManagement/ModelConfig.tsx`
- API密钥配置
- 模型参数设置（temperature、maxTokens、topP）
- 多模型管理
- 配置导入/导出

#### 4.2 使用监控面板
**文件**: `src/components/ModelManagement/UsageMonitor.tsx`
- Token使用统计
- 调用次数统计
- 成本估算
- 可视化图表

#### 4.3 调用日志查看
**文件**: `src/components/ModelManagement/UsageLogs.tsx`
- 日志列表展示
- 日志详情查看
- 时间筛选
- 导出功能

#### 4.4 配额管理
**文件**: `src/components/ModelManagement/QuotaManager.tsx`
- 配额显示
- 使用进度条
- 重置时间提醒
- 配额预警

### 第五阶段：布局和通用组件

#### 5.1 主布局组件
**文件**: `src/components/Layout/MainLayout.tsx`
- 三栏布局（侧边栏-编辑区-AI助手）
- 响应式设计
- 可拖拽调整宽度

#### 5.2 侧边栏导航
**文件**: `src/components/Layout/Sidebar.tsx`
- 导航菜单
- 分类列表
- 搜索框
- 用户信息

#### 5.3 顶部工具栏
**文件**: `src/components/Layout/Header.tsx`
- 面包屑导航
- 操作按钮
- 主题切换
- 设置入口

#### 5.4 通用组件
**文件**: `src/components/Common/Modal.tsx` - 模态框
**文件**: `src/components/Common/ConfirmDialog.tsx` - 确认对话框
**文件**: `src/components/Common/EmptyState.tsx` - 空状态展示
**文件**: `src/components/Common/Loading.tsx` - 加载动画
**文件**: `src/components/Common/ErrorBoundary.tsx` - 错误边界

### 第六阶段：用户体验优化

#### 6.1 自动保存功能
**文件**: `src/hooks/useAutoSave.ts`
- 防抖处理
- 保存状态提示
- 离线缓存

#### 6.2 快捷键支持
**文件**: `src/hooks/useKeyboardShortcuts.ts`
- Ctrl+S: 保存
- Ctrl+N: 新建笔记
- Ctrl+F: 搜索
- Ctrl+B: 加粗
- 其他常用快捷键

#### 6.3 主题切换
**文件**: `src/styles/theme.ts`
- 亮色主题
- 暗色主题
- 主题切换动画

#### 6.4 离线支持
**文件**: `src/utils/offlineManager.ts`
- Service Worker配置
- 离线数据同步
- 网络状态检测

#### 6.5 性能优化
- 虚拟滚动（长列表）
- 懒加载（图片、组件）
- 代码分割
- 缓存策略

### 第七阶段：应用入口和路由

#### 7.1 主应用入口
**文件**: `src/main.tsx`
- 应用初始化
- 数据库初始化
- 主题配置
- 全局错误处理

#### 7.2 路由配置
**文件**: `src/App.tsx`
- 路由定义
- 路由守卫
- 页面标题

#### 7.3 全局样式
**文件**: `src/styles/global.ts`
- CSS重置
- 全局变量
- Ant Design主题定制

## 关键文件清单

### 核心文件
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/types/index.ts` - 类型定义（已完成）
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/db/index.ts` - 数据库层（部分完成）
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/services/aiService.ts` - AI服务
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/main.tsx` - 应用入口
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/App.tsx` - 路由配置

### Store文件
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/store/noteStore.ts`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/store/aiStore.ts`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/store/modelStore.ts`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/store/settingsStore.ts`

### 主要组件文件
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/components/Layout/MainLayout.tsx`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/components/Note/NoteEditor.tsx`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/components/AIAssistant/AIAssistantSidebar.tsx`
- `/Users/wyh/Documents/GitCode/Test/AiNote/src/components/ModelManagement/ModelConfig.tsx`

## 开发优先级

### 高优先级（核心功能）
1. 数据库层和状态管理
2. 富文本编辑器
3. 笔记CRUD功能
4. AI助手基础对话功能
5. 主布局和导航

### 中优先级（增强功能）
1. 分类和标签管理
2. 版本历史
3. AI快捷操作
4. 模型配置管理
5. 搜索功能

### 低优先级（优化功能）
1. 回收站
2. 离线同步
3. 高级快捷键
4. 使用统计
5. 性能优化

## 注意事项

1. **代码规范**: 使用TypeScript严格模式，所有组件需要类型定义
2. **错误处理**: 所有异步操作需要错误处理和用户提示
3. **性能考虑**: 大量数据使用虚拟滚动，图片使用懒加载
4. **可维护性**: 组件职责单一，工具函数复用
5. **用户体验**: 加载状态、错误提示、操作反馈要清晰
6. **安全性**: API密钥加密存储，敏感信息不暴露
7. **可扩展性**: 预留扩展接口，便于后续功能添加

## GML-4.7 集成要点

- 使用智谱AI开放平台API
- 支持流式响应（SSE）
- 需要配置API Key
- 注意Token使用限制
- 实现重试和降级机制

## UI设计参考

参考有道云笔记的设计特点：
- 简洁的三栏布局
- 清晰的视觉层次
- 柔和的配色方案
- 流畅的动画过渡
- 直观的操作反馈

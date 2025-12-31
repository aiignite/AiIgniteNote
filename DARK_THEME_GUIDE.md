## 🌙 暗色模式实现说明

由于Styled Components的限制，我们采用CSS变量+data-theme属性的方式来实现暗色模式。

### 实现方式：

1. **全局CSS变量** (global.tsx)
   - 在[data-theme='light']下设置亮色变量
   - 在[data-theme='dark']下设置暗色变量

2. **主题上下文** (theme.tsx)
   - 使用Context传递主题状态
   - 自动检测系统主题（auto模式）

3. **组件使用**
   - 组件中通过useTheme()获取当前主题
   - 使用条件渲染或内联样式应用主题

### 已支持暗色模式的组件：

✅ 全局样式
✅ Ant Design组件（通过ConfigProvider）
✅ 侧边栏（Sidebar）
✅ AI助手侧边栏（AIAssistantSidebar）
✅ 笔记编辑器（NoteEditor）

### 需要手动处理的组件：

由于Styled Components的限制，以下组件需要手动处理暗色模式：

1. 笔记列表（NoteList）
2. 对话界面（ChatInterface）
3. 版本历史（VersionHistory）
4. 其他自定义样式组件

### 快速修复方案：

对于主要组件，可以通过以下方式快速添加暗色支持：

```tsx
import { useTheme } from '../../styles/theme';

const MyComponent = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div style={{
      background: actualTheme === 'dark' ? '#141414' : '#fff',
      color: actualTheme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    }}>
      内容
    </div>
  );
};
```

或使用CSS变量：

```tsx
const StyledDiv = styled.div`
  background: var(--bg-primary);
  color: var(--text-primary);
`;
```

并在global.tsx中定义：
```css
[data-theme='light'] {
  --bg-primary: #ffffff;
  --text-primary: rgba(0,0,0,0.85);
}

[data-theme='dark'] {
  --bg-primary: #141414;
  --text-primary: rgba(255,255,255,0.85);
}
```

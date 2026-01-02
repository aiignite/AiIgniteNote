import { createGlobalStyle } from "styled-components";
import { lightTheme, darkTheme } from "./theme";

const lightColors = lightTheme;
const darkColors = darkTheme;

export const GlobalStyle = createGlobalStyle`
  /* CSS变量定义 */
  :root {
    --primary-color: ${lightColors.primary};
    --success-color: ${lightColors.success};
    --warning-color: ${lightColors.warning};
    --error-color: ${lightColors.error};
    --info-color: ${lightColors.info};
    --bg-primary: ${lightColors.bgPrimary};
    --bg-secondary: ${lightColors.bgSecondary};
    --bg-tertiary: ${lightColors.bgTertiary};
    --text-primary: ${lightColors.textPrimary};
    --text-secondary: ${lightColors.textSecondary};
    --text-tertiary: ${lightColors.textTertiary};
    --border-color: ${lightColors.borderColor};
    --shadow: ${lightColors.shadow};
    --shadow-card: ${lightColors.shadowCard};
  }

  [data-theme='dark'] {
    --primary-color: ${darkColors.primary};
    --success-color: ${darkColors.success};
    --warning-color: ${darkColors.warning};
    --error-color: ${darkColors.error};
    --info-color: ${darkColors.info};
    --bg-primary: ${darkColors.bgPrimary};
    --bg-secondary: ${darkColors.bgSecondary};
    --bg-tertiary: ${darkColors.bgTertiary};
    --text-primary: ${darkColors.textPrimary};
    --text-secondary: ${darkColors.textSecondary};
    --text-tertiary: ${darkColors.textTertiary};
    --border-color: ${darkColors.borderColor};
    --shadow: ${darkColors.shadow};
    --shadow-card: ${darkColors.shadowCard};
  }

  /* 基础样式 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
                 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                 'Noto Color Emoji';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 15px;
    line-height: 1.6;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
    transition: background 0.3s;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #bfbfbf;
  }

  [data-theme='dark'] ::-webkit-scrollbar-thumb:hover {
    background: #595959;
  }

  /* Ant Design Input 暗色模式 */
  [data-theme='dark'] .ant-input {
    background: var(--bg-tertiary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  [data-theme='dark'] .ant-input::placeholder {
    color: var(--text-tertiary) !important;
  }

  [data-theme='dark'] .ant-input:focus,
  [data-theme='dark'] .ant-input-focused {
    background: var(--bg-tertiary) !important;
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  /* MDEditor - 移除自定义样式，使用默认外观 */

  /* AI 助手聊天区域暗色模式 */
  [data-theme='dark'] .message-avatar {
    background: var(--bg-tertiary) !important;
  }

  [data-theme='dark'] .message-content {
    background: var(--bg-tertiary) !important;
    color: var(--text-primary) !important;
  }

  /* 按钮可见性优化 */
  [data-theme='dark'] .ant-btn-text:not(:hover) {
    color: var(--text-secondary) !important;
  }

  [data-theme='dark'] .ant-btn-text:hover {
    color: var(--text-primary) !important;
    background: var(--bg-tertiary) !important;
  }

  [data-theme='dark'] .ant-btn-default:not(.ant-btn-primary) {
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  [data-theme='dark'] .ant-btn-default:not(.ant-btn-primary):hover {
    border-color: var(--primary-color) !important;
    color: var(--primary-color) !important;
  }

  .wmde-markdown {
    background: transparent !important;
  }

  .wmde-markdown h1,
  .wmde-markdown h2,
  .wmde-markdown h3,
  .wmde-markdown h4,
  .wmde-markdown h5,
  .wmde-markdown h6 {
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.3em;
  }

  .wmde-markdown code {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .wmde-markdown pre {
    background: var(--bg-tertiary);
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin-bottom: 1em;
    border: 1px solid var(--border-color);
  }

  .wmde-markdown pre code {
    background: transparent;
    padding: 0;
    border: none;
  }

  .wmde-markdown blockquote {
    border-left: 4px solid var(--primary-color);
    padding-left: 1em;
    margin-left: 0;
    color: var(--text-secondary);
  }

  .wmde-markdown a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.3s;
  }

  .wmde-markdown a:hover {
    color: #40a9ff;
  }

  [data-theme='dark'] .wmde-markdown a:hover {
    color: #3da8fc;
  }

  .wmde-markdown table th,
  .wmde-markdown table td {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
  }

  .wmde-markdown table th {
    background: var(--bg-tertiary);
  }

  .wmde-markdown table tr:nth-child(even) {
    background: var(--bg-tertiary);
  }

  /* 选中文本样式 */
  ::selection {
    background: var(--primary-color);
    color: white;
  }

  /* Ant Layout 样式 */
  .ant-layout {
    background: var(--bg-secondary);
  }

  .ant-layout-sider-children {
    background: var(--bg-primary);
  }

  /* 工具类 */
  .bg-primary {
    background-color: var(--bg-primary) !important;
  }

  .bg-secondary {
    background-color: var(--bg-secondary) !important;
  }

  .text-primary {
    color: var(--text-primary) !important;
  }

  .text-secondary {
    color: var(--text-secondary) !important;
  }

  /* 加载动画 */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* 打印样式 */
  @media print {
    .no-print {
      display: none !important;
    }
  }
`;

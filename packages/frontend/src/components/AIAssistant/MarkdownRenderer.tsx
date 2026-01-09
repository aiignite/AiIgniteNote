import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Button } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import styled from "styled-components";
import mermaid from "mermaid";
import katex from "katex";
import "katex/dist/katex.min.css";

// 导入代码高亮样式
import "highlight.js/styles/github.css";

// 初始化 Mermaid（只初始化一次）
if (typeof window !== "undefined" && !mermaid.isInitialized) {
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });
  mermaid.isInitialized = true;
}

const MarkdownContainer = styled.div`
  /* 通用样式 */
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
  width: 100%;
  overflow-wrap: break-word;

  /* 标题样式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  h1 {
    font-size: 1.5em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding-bottom: 8px;
  }

  h2 {
    font-size: 1.3em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding-bottom: 6px;
  }

  h3 {
    font-size: 1.15em;
  }

  h4 {
    font-size: 1.05em;
  }

  /* 段落样式 */
  p {
    margin: 8px 0;
  }

  /* 列表样式 */
  ul,
  ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin: 4px 0;
  }

  /* 代码块样式 */
  code {
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    font-family:
      "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.9em;
  }

  pre {
    background: #f6f8fa;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: transparent;
      padding: 0;
      font-size: 0.85em;
      line-height: 1.5;
    }
  }

  /* 引用样式 */
  blockquote {
    border-left: 4px solid #dfe2e5;
    padding: 0 16px;
    color: rgba(0, 0, 0, 0.55);
    margin: 12px 0;
  }

  /* 表格样式 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 0.9em;
  }

  th,
  td {
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: rgba(0, 0, 0, 0.04);
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
  }

  /* 链接样式 */
  a {
    color: #1890ff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  /* 图片样式 */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
  }

  /* 分隔线样式 */
  hr {
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin: 16px 0;
  }

  /* 强调样式 */
  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  /* 删除线样式 */
  del {
    color: rgba(0, 0, 0, 0.45);
  }

  /* Mermaid 图表样式 */
  .mermaid {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 8px;
    margin: 12px 0;
    text-align: center;
  }

  /* Katex 公式样式 */
  .katex-display {
    margin: 16px 0;
    overflow-x: auto;
    padding: 8px 0;
  }

  /* 代码块容器样式（用于放置复制按钮） */
  pre {
    position: relative;
  }
`;

// 代码块复制按钮样式
const CopyButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  height: 28px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;

  pre:hover > & {
    opacity: 1;
  }
`;

// Mermaid 组件
const MermaidComponent: React.FC<{ chart: string }> = React.memo(({ chart }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (ref.current) {
      try {
        mermaid.render(ref.current, chart).catch((err) => {
          console.error("Mermaid render error:", err);
          setError(true);
        });
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(true);
      }
    }
  }, [chart]);

  if (error) {
    return <div style={{ color: "#ff4d4f", padding: "8px" }}>图表渲染失败</div>;
  }

  return <div ref={ref} className="mermaid" />;
});
MermaidComponent.displayName = "MermaidComponent";

// 代码块组件（带复制按钮）
const CodeBlock: React.FC<{
  language?: string;
  value: string;
}> = React.memo(({ language, value }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <pre>
      <CopyButton
        size="small"
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={handleCopy}
      >
        {copied ? "已复制" : "复制"}
      </CopyButton>
      <code className={`language-${language || "plaintext"}`}>{value}</code>
    </pre>
  );
});
CodeBlock.displayName = "CodeBlock";

// 数学公式组件
const MathBlock: React.FC<{ formula: string; display?: boolean }> = React.memo(
  ({ formula, display }) => {
    try {
      const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: !!display,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (err) {
      return <span style={{ color: "#ff4d4f" }}>公式渲染失败</span>;
    }
  }
);
MathBlock.displayName = "MathBlock";

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 使用 useMemo 优化渲染，避免每次内容更新都重新解析
  const memoizedContent = useMemo(() => content, [content]);

  return (
    <MarkdownContainer>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 自定义代码块渲染
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            // 🔥 安全地提取代码内容: 处理 children 可能是数组或字符串的情况
            const extractCodeContent = (child: any): string => {
              if (typeof child === 'string') {
                return child;
              }
              if (Array.isArray(child)) {
                return child.map(extractCodeContent).join('');
              }
              if (child?.props?.children) {
                return extractCodeContent(child.props.children);
              }
              return String(child || '');
            };

            const codeContent = extractCodeContent(children).replace(/\n$/, '');

            if (!inline && language) {
              return (
                <CodeBlock language={language} value={codeContent} />
              );
            }

            // 检查是否是 Mermaid 图表
            if (!inline && language === "mermaid") {
              return <MermaidComponent chart={codeContent} />;
            }

            // 行内代码
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // 自定义段落渲染（支持行内公式）
          p({ children }) {
            const content = String(children);
            // 检测行内公式 $...$
            const parts = content.split(/\$([^$]+)\$/);

            if (parts.length > 1) {
              return (
                <p>
                  {parts.map((part, index) =>
                    index % 2 === 1 ? (
                      <MathBlock key={index} formula={part} display={false} />
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            }

            return <p>{children}</p>;
          },
        }}
      >
        {memoizedContent}
      </ReactMarkdown>
    </MarkdownContainer>
  );
}

// 使用 React.memo 优化组件，避免不必要的重新渲染
export default React.memo(MarkdownRenderer);

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import styled from "styled-components";

// 导入代码高亮样式
import "highlight.js/styles/github.css";

const MarkdownContainer = styled.div`
  /* 通用样式 */
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;

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
`;

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <MarkdownContainer>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </MarkdownContainer>
  );
}

export default MarkdownRenderer;

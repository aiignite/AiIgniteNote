import styled from "styled-components";
import { COLORS } from "../../styles/design-tokens";

/**
 * AIIgniteNote 品牌标识组件
 *
 * 设计理念：
 * - AI: 使用渐变色和发光效果突出人工智能特征
 * - Ignite: 使用火焰色调体现驱动/点燃的概念
 * - Note: 使用简洁字体保持可读性
 */

const BrandContainer = styled.div<{ $size?: "small" | "medium" | "large" }>`
  display: flex;
  align-items: baseline;
  gap: ${(props) => (props.$size === "small" ? "2px" : props.$size === "large" ? "8px" : "4px")};
  font-weight: 700;
  letter-spacing: -0.02em;

  /* 尺寸变体 */
  font-size: ${(props) => {
    switch (props.$size) {
      case "small":
        return "16px";
      case "large":
        return "32px";
      default:
        return "24px";
    }
  }};
`;

const AIPart = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* AI 发光效果 */
  text-shadow:
    0 0 20px rgba(102, 126, 234, 0.3),
    0 0 40px rgba(118, 75, 162, 0.2);

  /* 科技感边框 */
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      #667eea 20%,
      #764ba2 50%,
      #f093fb 80%,
      transparent 100%
    );
    border-radius: 1px;
  }
`;

const IgnitePart = styled.span`
  background: linear-gradient(135deg, #f97316 0%, #ef4444 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* 火焰发光效果 */
  text-shadow:
    0 0 20px rgba(249, 115, 22, 0.3),
    0 0 40px rgba(239, 68, 68, 0.2);

  /* 火焰动画 */
  animation: flicker 3s ease-in-out infinite;

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
  }
`;

const NotePart = styled.span`
  color: ${COLORS.ink};
  font-weight: 600;
  letter-spacing: 0.02em;
`;

interface BrandLogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function BrandLogo({ size = "medium", className }: BrandLogoProps) {
  return (
    <BrandContainer className={className} $size={size}>
      <AIPart>AI</AIPart>
      <IgnitePart>Ignite</IgnitePart>
      <NotePart>Note</NotePart>
    </BrandContainer>
  );
}

// 默认导出
export default BrandLogo;

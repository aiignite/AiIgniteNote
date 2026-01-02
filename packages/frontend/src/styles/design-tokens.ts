/**
 * AiNote Design Tokens
 * 编辑/杂志风格设计系统
 * 与登录页面保持一致的视觉语言
 */

export const COLORS = {
  background: "#F7F4EF",
  ink: "#1A1814",
  inkLight: "#4A4640",
  inkMuted: "#6B675F",
  accent: "#C85A3A",
  accentHover: "#A6462E",
  paper: "#FFFEF8",
  paperDark: "#F0EDE8",
  subtle: "#D4CFC7",
  subtleLight: "#E8E5E0",
  success: "#5B8B7A",
  warning: "#D4A574",
  error: "#C85A3A",
  info: "#6B8E9E",
  aiPrimary: "#8B7355",
  aiLight: "#E8DDD0",
  aiBubble: "#F5F0EA",
  userBubble: "#C85A3A",
  dark: {
    background: "#1A1814",
    ink: "#F7F4EF",
    inkLight: "#D4CFC7",
    accent: "#E8A080",
    paper: "#24201C",
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    display: '"Georgia", "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },
  fontSize: {
    xs: "11px",
    sm: "12px",
    base: "14px",
    md: "15px",
    lg: "16px",
    xl: "18px",
    "2xl": "20px",
    "3xl": "24px",
    "4xl": "30px",
    "5xl": "36px",
    "6xl": "48px",
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.05em",
    wider: "0.1em",
  },
};

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "48px",
  "6xl": "64px",
};

export const BORDER = {
  radius: {
    none: "0",
    sm: "2px",
    md: "4px",
    lg: "8px",
    xl: "12px",
    full: "9999px",
  },
  width: {
    thin: "1px",
    medium: "2px",
    thick: "3px",
  },
};

export const SHADOW = {
  sm: "0 1px 2px rgba(26, 24, 20, 0.05)",
  md: "0 4px 12px rgba(26, 24, 20, 0.08)",
  lg: "0 8px 24px rgba(26, 24, 20, 0.12)",
  xl: "0 20px 40px rgba(26, 24, 20, 0.16)",
  accent: "0 4px 16px rgba(200, 90, 58, 0.25)",
  accentHover: "0 10px 30px rgba(200, 90, 58, 0.35)",
};

export const TRANSITION = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
};

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const NOISE_TEXTURE =
  "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 256 256\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.8\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noise)\\' opacity=\\'0.03\\'/%3E%3C/svg%3E')";

export const ANIMATIONS = {
  fadeInUp:
    "from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }",
  fadeInLeft:
    "from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); }",
  scaleIn:
    "from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }",
};

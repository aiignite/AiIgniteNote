import { useEffect } from "react";
import { useThemeStore, FONT_FAMILIES } from "../store/themeStore";

/**
 * 应用主题设置到 DOM
 */
export function useThemeApply() {
  const { theme, fontSize, fontFamily, getEffectiveTheme } = useThemeStore();

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();

    // 应用主题到 data 属性
    document.documentElement.setAttribute("data-theme", effectiveTheme);

    // 应用字体大小
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${fontSize}px`,
    );

    // 计算其他字体大小
    const fontSizes = {
      xs: Math.max(12, fontSize - 2),
      sm: Math.max(13, fontSize - 1),
      md: fontSize,
      lg: fontSize + 2,
      xl: fontSize + 4,
      "2xl": fontSize + 6,
      "3xl": fontSize + 10,
    };

    Object.entries(fontSizes).forEach(([key, value]) => {
      document.documentElement.style.setProperty(
        `--font-size-${key}`,
        `${value}px`,
      );
    });

    // 应用字体
    const fontConfig = FONT_FAMILIES[fontFamily] || FONT_FAMILIES.system;
    document.documentElement.style.setProperty(
      "--font-family-base",
      fontConfig.fonts.join(", "),
    );

    // 应用到 body
    document.body.style.fontFamily = fontConfig.fonts.join(", ");
    document.body.style.fontSize = `${fontSize}px`;
  }, [theme, fontSize, fontFamily, getEffectiveTheme]);
}

/**
 * 监听系统主题变化
 */
export function useSystemThemeListener() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // 重新应用主题
      const effectiveTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    };

    // 现代浏览器使用 addEventListener
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);
}

/**
 * 获取当前有效的主题颜色
 */
export function useThemeColors() {
  const { getEffectiveTheme } = useThemeStore();
  const effectiveTheme = getEffectiveTheme();

  const colors =
    effectiveTheme === "dark"
      ? {
          background: "var(--dark-color-background)",
          paper: "var(--dark-color-paper)",
          ink: "var(--dark-color-ink)",
          inkLight: "var(--dark-color-ink-light)",
          inkMuted: "var(--dark-color-ink-muted)",
          accent: "var(--dark-color-accent)",
          subtle: "var(--dark-color-subtle)",
        }
      : {
          background: "var(--color-background)",
          paper: "var(--color-paper)",
          ink: "var(--color-ink)",
          inkLight: "var(--color-ink-light)",
          inkMuted: "var(--color-ink-muted)",
          accent: "var(--color-accent)",
          subtle: "var(--color-subtle)",
        };

  return colors;
}

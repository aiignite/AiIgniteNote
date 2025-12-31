import { ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

// 主题颜色配置
export const lightTheme = {
  primary: "#1890ff",
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  info: "#1890ff",

  // 背景色
  bgPrimary: "#ffffff",
  bgSecondary: "#f5f5f5",
  bgTertiary: "#fafafa",

  // 文字色
  textPrimary: "#000000d9",
  textSecondary: "#00000073",
  textTertiary: "#00000040",

  // 边框色
  borderColor: "#d9d9d9",

  // 阴影
  shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  shadowCard: "0 1px 2px rgba(0, 0, 0, 0.03)",
};

export const darkTheme = {
  primary: "#177ddc",
  success: "#49aa19",
  warning: "#d89614",
  error: "#d32029",
  info: "#177ddc",

  // 背景色 - 经典编辑器风格
  bgPrimary: "#1e1e1e",
  bgSecondary: "#252526",
  bgTertiary: "#2d2d2d",

  // 文字色
  textPrimary: "#e0e0e0",
  textSecondary: "#a0a0a0",
  textTertiary: "#6e6e6e",

  // 边框色
  borderColor: "#3e3e42",

  // 阴影
  shadow: "0 2px 8px rgba(0, 0, 0, 0.48)",
  shadowCard: "0 1px 2px rgba(0, 0, 0, 0.24)",
};

// CSS变量导出
export const cssVariables = `
  :root {
    --bg-primary: ${lightTheme.bgPrimary};
    --bg-secondary: ${lightTheme.bgSecondary};
    --bg-tertiary: ${lightTheme.bgTertiary};
    --text-primary: ${lightTheme.textPrimary};
    --text-secondary: ${lightTheme.textSecondary};
    --text-tertiary: ${lightTheme.textTertiary};
    --border-color: ${lightTheme.borderColor};
    --shadow: ${lightTheme.shadow};
    --shadow-card: ${lightTheme.shadowCard};
  }

  [data-theme='dark'] {
    --bg-primary: ${darkTheme.bgPrimary};
    --bg-secondary: ${darkTheme.bgSecondary};
    --bg-tertiary: ${darkTheme.bgTertiary};
    --text-primary: ${darkTheme.textPrimary};
    --text-secondary: ${darkTheme.textSecondary};
    --text-tertiary: ${darkTheme.textTertiary};
    --border-color: ${darkTheme.borderColor};
    --shadow: ${darkTheme.shadow};
    --shadow-card: ${darkTheme.shadowCard};
  }
`;

// Ant Design 主题配置
export const antdLightTheme: any = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: lightTheme.primary,
    colorSuccess: lightTheme.success,
    colorWarning: lightTheme.warning,
    colorError: lightTheme.error,
    colorInfo: lightTheme.info,
    colorBgBase: lightTheme.bgPrimary,
    colorBgContainer: lightTheme.bgPrimary,
    colorBgLayout: lightTheme.bgSecondary,
    colorBorder: lightTheme.borderColor,
    borderRadius: 6,
    fontSize: 15,
  },
  components: {
    Layout: {
      headerBg: lightTheme.bgPrimary,
      headerHeight: 56,
      siderBg: lightTheme.bgPrimary,
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: lightTheme.bgSecondary,
      itemHoverBg: lightTheme.bgSecondary,
    },
    Card: {
      colorBgContainer: lightTheme.bgPrimary,
    },
    Input: {
      colorBgContainer: lightTheme.bgPrimary,
    },
    Button: {
      borderRadius: 6,
    },
  },
};

export const antdDarkTheme: any = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: darkTheme.primary,
    colorSuccess: darkTheme.success,
    colorWarning: darkTheme.warning,
    colorError: darkTheme.error,
    colorInfo: darkTheme.info,
    colorBgBase: darkTheme.bgPrimary,
    colorBgContainer: darkTheme.bgPrimary,
    colorBgLayout: darkTheme.bgSecondary,
    colorBorder: darkTheme.borderColor,
    borderRadius: 6,
    fontSize: 15,
  },
  components: {
    Layout: {
      headerBg: darkTheme.bgSecondary,
      headerHeight: 56,
      siderBg: darkTheme.bgSecondary,
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: darkTheme.bgTertiary,
      itemSelectedColor: darkTheme.textPrimary,
      itemHoverBg: darkTheme.bgTertiary,
      itemColor: darkTheme.textSecondary,
    },
    Card: {
      colorBgContainer: darkTheme.bgTertiary,
    },
    Input: {
      colorBgContainer: darkTheme.bgTertiary,
      colorBorder: darkTheme.borderColor,
    },
    Button: {
      borderRadius: 6,
    },
  },
};

// 主题上下文
interface ThemeContextType {
  theme: "light" | "dark" | "auto";
  actualTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "auto") => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  actualTheme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// 主题提供器组件
interface ThemeProviderProps {
  children: ReactNode;
  theme?: "light" | "dark" | "auto";
}

export function ThemeProvider({
  children,
  theme: initialTheme = "light",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(initialTheme);
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // 检测系统主题
  useEffect(() => {
    const updateActualTheme = () => {
      let newActualTheme: "light" | "dark";
      if (theme === "auto") {
        newActualTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
      } else {
        newActualTheme = theme;
      }
      setActualTheme(newActualTheme);

      // 更新DOM属性
      document.documentElement.setAttribute("data-theme", newActualTheme);
    };

    updateActualTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateActualTheme();
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      <ConfigProvider
        locale={zhCN}
        theme={actualTheme === "dark" ? antdDarkTheme : antdLightTheme}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

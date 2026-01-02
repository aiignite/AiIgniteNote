import { useState } from "react";
import { Tabs } from "antd";
import {
  ApiOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";
import AIAssistantsSettings from "./AIAssistantsSettings";
import ModelsSettings from "./ModelsSettings";
import ModelsUsage from "./ModelsUsage";

// ============================================
// 动画
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  max-width: 900px;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: ${SPACING.xl};
    border-bottom: 1px solid ${COLORS.subtle};

    &::before {
      border-color: ${COLORS.subtle};
    }
  }

  .ant-tabs-tab {
    padding: ${SPACING.sm} ${SPACING.lg};
    margin: 0 ${SPACING.md} ${SPACING.md} 0;
    border: 1px solid ${COLORS.subtle};
    border-radius: ${BORDER.radius.sm} ${BORDER.radius.sm} 0 0;
    background: ${COLORS.paperDark};
    color: ${COLORS.inkLight};
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    transition: all ${TRANSITION.fast};

    &:hover {
      color: ${COLORS.ink};
      background: ${COLORS.subtleLight};
    }

    .ant-tabs-tab-btn {
      outline: none;
    }

    .anticon {
      margin-right: ${SPACING.sm};
      font-size: ${TYPOGRAPHY.fontSize.md};
    }
  }

  .ant-tabs-tab-active {
    background: ${COLORS.paper};
    border-color: ${COLORS.subtle} ${COLORS.subtle} ${COLORS.paper}
      ${COLORS.subtle};
    color: ${COLORS.ink};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};

    .ant-tabs-tab-btn {
      color: ${COLORS.ink};
    }
  }

  .ant-tabs-ink-bar {
    display: none;
  }

  .ant-tabs-content-holder {
    background: ${COLORS.paper};
    border: 1px solid ${COLORS.subtle};
    border-radius: 0 0 ${BORDER.radius.md} ${BORDER.radius.md};
    padding: ${SPACING["3xl"]};
    box-shadow: ${SHADOW.sm};
  }

  .ant-tabs-tabpane {
    animation: ${fadeIn} 0.3s ease-out;
  }
`;

const TabContent = styled.div`
  min-height: 400px;

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.sm} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  > div {
    h2 {
      margin-bottom: ${SPACING.xl};
    }
  }
`;

// ============================================
// Tab Items
// ============================================

interface TabItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

const tabItems: TabItem[] = [
  {
    key: "models",
    label: (
      <span>
        <ApiOutlined />
        模型配置
      </span>
    ),
    children: <ModelsSettings />,
  },
  {
    key: "assistants",
    label: (
      <span>
        <ThunderboltOutlined />
        AI 助手
      </span>
    ),
    children: <AIAssistantsSettings />,
  },
  {
    key: "usage",
    label: (
      <span>
        <BarChartOutlined />
        使用统计
      </span>
    ),
    children: <ModelsUsage />,
  },
];

// ============================================
// Main Component
// ============================================

export default function AIManagement() {
  const [activeTab, setActiveTab] = useState("models");

  return (
    <Container>
      <StyledTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <TabContent>
        {tabItems.find((item) => item.key === activeTab)?.children}
      </TabContent>
    </Container>
  );
}

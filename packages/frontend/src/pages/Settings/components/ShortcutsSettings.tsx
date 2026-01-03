import { useState } from "react";
import { Button, Modal, Input, message } from "antd";
import { EditOutlined, ReloadOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
  SHADOW,
  TRANSITION,
} from "../../../styles/design-tokens";

// ============================================
// 动画
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ============================================
// Styled Components
// ============================================

const SectionContainer = styled.div`
  width: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${SPACING.xl};
`;

const TitleSection = styled.div`
  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.xs} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0;
  }
`;

const SecondaryButton = styled(Button)`
  height: 36px;
  padding: 0 ${SPACING.lg};
  background: transparent;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.ink};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
  }
`;

const ShortcutCard = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  box-shadow: ${SHADOW.sm};
  animation: ${fadeIn} 0.3s ease-out;

  h3 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize.xl};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0 0 ${SPACING.lg} 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const ShortcutSection = styled.div`
  margin-bottom: ${SPACING.xl};

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.inkMuted};
    letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
    text-transform: uppercase;
    margin: 0 0 ${SPACING.md} 0;
  }
`;

const ShortcutItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${SPACING.md} 0;
  border-bottom: 1px solid ${COLORS.subtleLight};

  &:last-child {
    border-bottom: none;
  }
`;

const ShortcutInfo = styled.div`
  flex: 1;

  .action-name {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
    color: ${COLORS.ink};
  }

  .action-desc {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.inkMuted};
    margin-top: 2px;
  }
`;

const KeyCombo = styled.kbd`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: ${SPACING.xs} ${SPACING.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  background: ${COLORS.paperDark};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.ink};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs} ${SPACING.sm};
  border: none;
  background: transparent;
  color: ${COLORS.inkLight};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  cursor: pointer;
  border-radius: ${BORDER.radius.sm};
  transition: all ${TRANSITION.fast};
  margin-left: ${SPACING.md};

  &:hover {
    background: ${COLORS.subtleLight};
    color: ${COLORS.ink};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: ${COLORS.paper};
    border: 1px solid ${COLORS.subtle};
    border-radius: ${BORDER.radius.md};
    box-shadow: ${SHADOW.lg};
  }

  .ant-modal-header {
    border-bottom: 1px solid ${COLORS.subtle};
    padding: ${SPACING.xl} ${SPACING["3xl"]};

    .ant-modal-title {
      font-family: ${TYPOGRAPHY.fontFamily.display};
      font-size: ${TYPOGRAPHY.fontSize.xl};
      font-weight: ${TYPOGRAPHY.fontWeight.semibold};
      color: ${COLORS.ink};
    }
  }

  .ant-modal-body {
    padding: ${SPACING["3xl"]};
  }

  .ant-modal-footer {
    border-top: 1px solid ${COLORS.subtle};
    padding: ${SPACING.lg} ${SPACING["3xl"]};
  }
`;

const InfoLabel = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.inkMuted};
  margin-bottom: ${SPACING.xs};
`;

const InfoValue = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.ink};
`;

const StyledInput = styled(Input)`
  height: 40px;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.inkLight};
  }

  &:focus,
  .ant-input-focused {
    border-color: ${COLORS.ink};
    box-shadow: none;
  }
`;

const PrimaryButton = styled(Button)`
  height: 40px;
  padding: 0 ${SPACING.xl};
  background: ${COLORS.ink};
  border-color: ${COLORS.ink};
  border-radius: ${BORDER.radius.sm};
  color: ${COLORS.paper};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: all ${TRANSITION.normal};

  &:hover {
    background: ${COLORS.accent};
    border-color: ${COLORS.accent};
    transform: translateY(-1px);
    box-shadow: ${SHADOW.accent};
  }
`;

// ============================================
// Types
// ============================================

interface Shortcut {
  id: string;
  action: string;
  description?: string;
  keys: string;
  editable: boolean;
  category: string;
}

// ============================================
// Main Component
// ============================================

export default function ShortcutsSettings() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    {
      id: "1",
      action: "新建笔记",
      description: "创建新的笔记",
      keys: "Ctrl + N",
      editable: true,
      category: "文件",
    },
    {
      id: "2",
      action: "保存笔记",
      description: "保存当前笔记",
      keys: "Ctrl + S",
      editable: true,
      category: "文件",
    },
    {
      id: "3",
      action: "搜索笔记",
      description: "打开搜索框",
      keys: "Ctrl + F",
      editable: true,
      category: "导航",
    },
    {
      id: "4",
      action: "切换侧边栏",
      description: "显示/隐藏侧边栏",
      keys: "Ctrl + B",
      editable: true,
      category: "视图",
    },
    {
      id: "5",
      action: "删除笔记",
      description: "删除当前笔记",
      keys: "Ctrl + D",
      editable: true,
      category: "编辑",
    },
    {
      id: "6",
      action: "切换AI助手",
      description: "显示/隐藏AI助手",
      keys: "Ctrl + I",
      editable: true,
      category: "视图",
    },
    {
      id: "7",
      action: "复制",
      description: "复制选中文本",
      keys: "Ctrl + C",
      editable: false,
      category: "编辑",
    },
    {
      id: "8",
      action: "粘贴",
      description: "粘贴内容",
      keys: "Ctrl + V",
      editable: false,
      category: "编辑",
    },
    {
      id: "9",
      action: "撤销",
      description: "撤销上一步操作",
      keys: "Ctrl + Z",
      editable: false,
      category: "编辑",
    },
    {
      id: "10",
      action: "重做",
      description: "重做操作",
      keys: "Ctrl + Shift + Z",
      editable: false,
      category: "编辑",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [newKeys, setNewKeys] = useState("");

  const handleEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setNewKeys(shortcut.keys);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (editingShortcut) {
      setShortcuts(
        shortcuts.map((s) =>
          s.id === editingShortcut.id ? { ...s, keys: newKeys } : s,
        ),
      );
      message.success("快捷键已更新");
      setModalVisible(false);
    }
  };

  const handleReset = () => {
    message.success("快捷键已重置为默认");
  };

  // 按分类分组
  const groupedShortcuts: Record<string, Shortcut[]> = {
    文件: shortcuts.filter((s) => s.category === "文件"),
    编辑: shortcuts.filter((s) => s.category === "编辑"),
    导航: shortcuts.filter((s) => s.category === "导航"),
    视图: shortcuts.filter((s) => s.category === "视图"),
  };

  return (
    <SectionContainer>
      <HeaderActions>
        <TitleSection>
          <h2>快捷键</h2>
          <p>自定义和管理键盘快捷键</p>
        </TitleSection>
        <SecondaryButton icon={<ReloadOutlined />} onClick={handleReset}>
          重置默认
        </SecondaryButton>
      </HeaderActions>

      <ShortcutCard>
        <h3>快捷键列表</h3>

        {Object.entries(groupedShortcuts).map(([category, items]) => (
          <ShortcutSection key={category}>
            <h4>{category}</h4>
            {items.map((shortcut) => (
              <ShortcutItem key={shortcut.id}>
                <ShortcutInfo>
                  <div className="action-name">{shortcut.action}</div>
                  {shortcut.description && (
                    <div className="action-desc">{shortcut.description}</div>
                  )}
                </ShortcutInfo>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <KeyCombo>{shortcut.keys}</KeyCombo>
                  {shortcut.editable && (
                    <EditButton onClick={() => handleEdit(shortcut)}>
                      <EditOutlined />
                      编辑
                    </EditButton>
                  )}
                </div>
              </ShortcutItem>
            ))}
          </ShortcutSection>
        ))}
      </ShortcutCard>

      <StyledModal
        title="编辑快捷键"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          <>
            <SecondaryButton onClick={() => setModalVisible(false)}>
              取消
            </SecondaryButton>
            <PrimaryButton onClick={handleSave}>保存</PrimaryButton>
          </>
        }
        width={480}
      >
        <div style={{ marginBottom: SPACING.lg }}>
          <InfoLabel>操作</InfoLabel>
          <InfoValue>{editingShortcut?.action}</InfoValue>
        </div>
        <div>
          <InfoLabel>快捷键组合</InfoLabel>
          <StyledInput
            value={newKeys}
            onChange={(e) => setNewKeys(e.target.value)}
            placeholder="例如: Ctrl + N"
          />
          <div
            style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.inkMuted,
            }}
          >
            提示: 使用 + 号组合按键，例如 Ctrl + Shift + N
          </div>
        </div>
      </StyledModal>
    </SectionContainer>
  );
}

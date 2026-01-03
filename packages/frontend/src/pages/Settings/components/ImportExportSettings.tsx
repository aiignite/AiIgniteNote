import { useState } from "react";
import {
  Button,
  Upload,
  message,
  Modal,
  Radio,
  Progress,
  Card,
  Space,
  Divider,
  Alert,
} from "antd";
import {
  ExportOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
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
import { useNoteStore } from "../../../store/noteStore";
import { useTagStore } from "../../../store/tagStore";
import { db } from "../../../db";
import type { LocalNote, LocalCategory, LocalTag } from "../../../types";

// ============================================
// 动画
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// 类型定义
// ============================================
interface ExportData {
  version: string;
  exportDate: string;
  data: {
    notes: LocalNote[];
    categories: LocalCategory[];
    tags: LocalTag[];
  };
}

// ============================================
// Styled Components
// ============================================
const SectionContainer = styled.div`
  max-width: 800px;
`;

const TitleSection = styled.div`
  margin-bottom: ${SPACING.xl};

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

const CardSection = styled.section`
  background: ${COLORS.paper};
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  margin-bottom: ${SPACING.xl};
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

  p {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    margin: 0 0 ${SPACING.lg} 0;
  }
`;

const ActionButton = styled(Button)<{ $primary?: boolean }>`
  height: 48px;
  width: 100%;
  margin-bottom: ${SPACING.md};
  border-radius: ${BORDER.radius.md};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  transition: all ${TRANSITION.normal};

  ${(props) =>
    props.$primary
      ? `
    background: ${COLORS.ink};
    border-color: ${COLORS.ink};
    color: ${COLORS.paper};

    &:hover {
      background: ${COLORS.accent};
      border-color: ${COLORS.accent};
      transform: translateY(-1px);
      box-shadow: ${SHADOW.accent};
    }
  `
      : `
    background: ${COLORS.paper};
    border-color: ${COLORS.subtle};
    color: ${COLORS.ink};

    &:hover:not(:disabled) {
      border-color: ${COLORS.ink};
      color: ${COLORS.ink};
    }
  `}
`;

const UploadArea = styled.div`
  border: 2px dashed ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  padding: ${SPACING["3xl"]};
  text-align: center;
  cursor: pointer;
  transition: all ${TRANSITION.fast};

  &:hover {
    border-color: ${COLORS.ink};
    background: ${COLORS.background};
  }
`;

const StatCard = styled(Card)`
  flex: 1;
  text-align: left;
  border: 1px solid ${COLORS.subtle};
  box-shadow: none;
  min-width: 0;
  padding: ${SPACING.md} ${SPACING.lg};
  transition: all ${TRANSITION.fast};
  cursor: default;

  &:hover {
    border-color: ${COLORS.accent};
    box-shadow: ${SHADOW.sm};
  }

  .anticon {
    display: inline-flex;
    align-items: center;
  }

  .ant-statistic-title {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
  }

  .ant-statistic-content {
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
  }
`;

// ============================================
// Main Component
// ============================================
export default function ImportExportSettings() {
  const { notes, categories } = useNoteStore();
  const { tags } = useTagStore();

  const [exporting, setExporting] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importStrategy, setImportStrategy] = useState<"merge" | "replace">(
    "merge",
  );
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // 导出数据
  const handleExport = async () => {
    setExporting(true);
    try {
      // 准备导出数据
      const exportData: ExportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          notes: notes.filter((n) => !n.isDeleted),
          categories,
          tags,
        },
      };

      // 转换为 JSON 字符串
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json",
      });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // 生成文件名：aiignitenote-export-日期.json
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `aiignitenote-export-${dateStr}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success("导出成功！");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // 验证数据格式
        if (!data.version || !data.data) {
          message.error("文件格式错误，不是有效的导出文件");
          return;
        }

        setImportData(data);
        setImportModalVisible(true);
      } catch (error) {
        console.error("Parse failed:", error);
        message.error("文件解析失败，请确保文件格式正确");
      }
    };

    reader.readAsText(file);
  };

  // 执行导入
  const handleImport = async () => {
    if (!importData) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const {
        notes: importNotes,
        categories: importCategories,
        tags: importTags,
      } = importData.data;

      const totalItems =
        (importNotes?.length || 0) +
        (importCategories?.length || 0) +
        (importTags?.length || 0);
      let processedItems = 0;

      // 更新进度的辅助函数
      const updateProgress = () => {
        processedItems++;
        setImportProgress(Math.floor((processedItems / totalItems) * 100));
      };

      // 如果是替换模式，先清空现有数据
      if (importStrategy === "replace") {
        // 清空笔记
        await db.notes.clear();
        await db.noteVersions.clear();
        // 清空分类
        await db.categories.clear();
        // 清空标签
        await db.tags.clear();
        await db.noteTags.clear();
      }

      // 导入分类
      if (importCategories && importCategories.length > 0) {
        for (const category of importCategories) {
          if (importStrategy === "merge") {
            // 检查是否已存在同名分类
            const exists = categories.some((c) => c.name === category.name);
            if (exists) {
              updateProgress();
              continue;
            }
          }
          // 直接插入到数据库
          await db.categories.put(category);
          updateProgress();
        }
      }

      // 导入标签
      if (importTags && importTags.length > 0) {
        for (const tag of importTags) {
          if (importStrategy === "merge") {
            const exists = tags.some((t) => t.name === tag.name);
            if (exists) {
              updateProgress();
              continue;
            }
          }
          // 直接插入到数据库
          await db.tags.put(tag);
          updateProgress();
        }
      }

      // 导入笔记
      if (importNotes && importNotes.length > 0) {
        for (const note of importNotes) {
          if (importStrategy === "merge") {
            const exists = notes.some((n) => n.id === note.id);
            if (exists) {
              updateProgress();
              continue;
            }
          }
          // 直接插入到数据库
          await db.notes.put(note);
          // 创建版本记录
          await db.createNoteVersion(note);
          updateProgress();
        }
      }

      // 重新加载数据
      await useNoteStore.getState().loadNotes();
      await useNoteStore.getState().loadCategories();
      await useTagStore.getState().loadTags();

      message.success("导入成功！");
      setImportModalVisible(false);
      setImportData(null);
    } catch (error) {
      console.error("Import failed:", error);
      message.error("导入失败，请重试");
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <SectionContainer>
      <TitleSection>
        <h2>导入与导出</h2>
        <p>备份或迁移您的笔记数据</p>
      </TitleSection>

      {/* 数据统计 */}
      <CardSection>
        <h3>当前数据</h3>
        <p>您当前账户中的数据概览</p>

        <div style={{ display: "flex", gap: SPACING.lg }}>
          <StatCard>
            <div
              style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.inkLight,
                marginBottom: SPACING.sm,
              }}
            >
              笔记
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}
            >
              <FileTextOutlined
                style={{ fontSize: 24, color: COLORS.accent }}
              />
              <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.ink }}>
                {notes.filter((n) => !n.isDeleted).length}
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div
              style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.inkLight,
                marginBottom: SPACING.sm,
              }}
            >
              分类
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}
            >
              <FileTextOutlined
                style={{ fontSize: 24, color: COLORS.success }}
              />
              <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.ink }}>
                {categories.length}
              </div>
            </div>
          </StatCard>

          <StatCard>
            <div
              style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.inkLight,
                marginBottom: SPACING.sm,
              }}
            >
              标签
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}
            >
              <FileTextOutlined style={{ fontSize: 24, color: COLORS.info }} />
              <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.ink }}>
                {tags.length}
              </div>
            </div>
          </StatCard>
        </div>
      </CardSection>

      {/* 导出功能 */}
      <CardSection>
        <h3>导出数据</h3>
        <p>
          将所有笔记、分类和标签导出为 JSON 文件，可用于备份或迁移到其他设备
        </p>

        <ActionButton
          $primary
          type="primary"
          icon={<ExportOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          {exporting ? "导出中..." : "导出所有数据"}
        </ActionButton>

        <Alert
          message="导出说明"
          description={
            <div>
              <p style={{ marginBottom: SPACING.sm }}>
                • 导出的 JSON 文件包含所有笔记内容、分类和标签
              </p>
              <p style={{ marginBottom: SPACING.sm }}>
                • 文件命名格式：aiignitenote-export-YYYY-MM-DD.json
              </p>
              <p>• 您可以使用此文件在不同设备间迁移数据</p>
            </div>
          }
          type="info"
          showIcon
        />
      </CardSection>

      {/* 导入功能 */}
      <CardSection>
        <h3>导入数据</h3>
        <p>从之前导出的 JSON 文件中恢复数据，或将数据从其他设备迁移过来</p>

        <UploadArea>
          <Upload.Dragger
            name="file"
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
            style={{ background: "transparent" }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined
                style={{ fontSize: 48, color: COLORS.accent }}
              />
            </p>
            <p style={{ fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.ink }}>
              点击或拖拽文件到此区域上传
            </p>
            <p
              style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.inkMuted,
              }}
            >
              仅支持 .json 格式的导出文件
            </p>
          </Upload.Dragger>
        </UploadArea>

        <Alert
          message="导入说明"
          description={
            <div>
              <p style={{ marginBottom: SPACING.sm }}>
                • 仅支持从 AIIgniteNote 导出的 JSON 文件
              </p>
              <p style={{ marginBottom: SPACING.sm }}>
                • 导入时可以选择"合并"或"替换"现有数据
              </p>
              <p>• 建议在导入前先备份当前数据</p>
            </div>
          }
          type="warning"
          showIcon
        />
      </CardSection>

      {/* 导入确认弹窗 */}
      <Modal
        title="确认导入"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportData(null);
        }}
        onOk={handleImport}
        okText="开始导入"
        cancelText="取消"
        width={600}
        okButtonProps={{ loading: importing }}
      >
        {importData && (
          <div>
            <Alert
              message="即将导入数据"
              description="请确认以下信息并选择导入策略"
              type="info"
              showIcon
              style={{ marginBottom: SPACING.lg }}
            />

            <div style={{ marginBottom: SPACING.lg }}>
              <p style={{ fontWeight: 600, marginBottom: SPACING.sm }}>
                导入文件信息：
              </p>
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.inkLight,
                }}
              >
                导出时间：
                {new Date(importData.exportDate).toLocaleString("zh-CN")}
              </p>
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.inkLight,
                }}
              >
                数据版本：{importData.version}
              </p>
            </div>

            <div style={{ marginBottom: SPACING.lg }}>
              <p style={{ fontWeight: 600, marginBottom: SPACING.sm }}>
                包含数据：
              </p>
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.inkLight,
                }}
              >
                • {importData.data.notes?.length || 0} 条笔记
              </p>
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.inkLight,
                }}
              >
                • {importData.data.categories?.length || 0} 个分类
              </p>
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.inkLight,
                }}
              >
                • {importData.data.tags?.length || 0} 个标签
              </p>
            </div>

            <Divider />

            <div style={{ marginBottom: SPACING.lg }}>
              <p style={{ fontWeight: 600, marginBottom: SPACING.sm }}>
                导入策略：
              </p>
              <Radio.Group
                value={importStrategy}
                onChange={(e) => setImportStrategy(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical">
                  <Radio value="merge">
                    <div>
                      <div style={{ fontWeight: 500 }}>合并</div>
                      <div
                        style={{
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          color: COLORS.inkMuted,
                        }}
                      >
                        保留现有数据，仅添加不存在的项目
                      </div>
                    </div>
                  </Radio>
                  <Radio value="replace">
                    <div>
                      <div style={{ fontWeight: 500 }}>替换</div>
                      <div
                        style={{
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          color: COLORS.inkMuted,
                        }}
                      >
                        清空现有数据，使用导入的数据完全替换
                      </div>
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>

            {importing && (
              <div style={{ marginTop: SPACING.lg }}>
                <p style={{ fontWeight: 600, marginBottom: SPACING.sm }}>
                  导入进度：
                </p>
                <Progress percent={importProgress} status="active" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </SectionContainer>
  );
}

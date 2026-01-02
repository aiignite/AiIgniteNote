import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Space,
  Tag,
  Progress,
  Button,
  Empty,
} from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ReloadOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import dayjs from "dayjs";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER,
} from "../../../styles/design-tokens";
import { db } from "../../../db";
import { useModelStore } from "../../../store/modelStore";

const { RangePicker } = DatePicker;

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

const ChartCard = styled(Card)`
  margin-bottom: 24px;
  border: 1px solid ${COLORS.subtle};
  border-radius: ${BORDER.radius.md};
  animation: ${fadeIn} 0.3s ease-out;

  .ant-card-head {
    border-bottom: 1px solid ${COLORS.subtle};
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  }

  .ant-card-body {
    padding: ${SPACING.lg};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${SPACING.xl};

  h2 {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-size: ${TYPOGRAPHY.fontSize["2xl"]};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
    color: ${COLORS.ink};
    margin: 0;
    letter-spacing: ${TYPOGRAPHY.letterSpacing.tight};
  }
`;

const StyledStatistic = styled(Statistic)`
  .ant-statistic-title {
    font-size: ${TYPOGRAPHY.fontSize.sm};
    color: ${COLORS.inkLight};
    font-weight: ${TYPOGRAPHY.fontWeight.medium};
  }

  .ant-statistic-content {
    font-family: ${TYPOGRAPHY.fontFamily.display};
    font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  }
`;

// ============================================
// Constants
// ============================================

const COLORS_CHART = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

// ============================================
// Types
// ============================================

interface UsageLog {
  id: string;
  modelId: string;
  modelName: string;
  action: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
  createdAt: number;
}

interface ModelStats {
  modelId: string;
  modelName: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  successRate: number;
  totalTokens: number;
  avgTokensPerCall: number;
}

// ============================================
// Main Component
// ============================================

export default function UsageStatisticsPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [dateRange, setDateRange] = useState<[any, any]>([
    dayjs().subtract(7, "days"),
    dayjs(),
  ]);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const { configs } = useModelStore();

  useEffect(() => {
    loadStats();
    loadLogs();
  }, [dateRange, selectedModel, configs]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // 从 IndexedDB 加载使用日志
      const allLogs = await db.usageLogs.toArray();

      // 按日期范围过滤
      const [start, end] = dateRange;
      const startTime = start?.valueOf() ?? 0;
      const endTime = end?.valueOf() ?? Number.MAX_VALUE;

      const filteredLogs = allLogs.filter(
        (log) => log.timestamp >= startTime && log.timestamp <= endTime,
      );

      // 按模型分组统计
      const statsMap = new Map<string, ModelStats>();

      for (const log of filteredLogs) {
        const modelId = log.modelId || "unknown";
        if (!statsMap.has(modelId)) {
          const model = configs.find((m) => m.id === modelId);
          statsMap.set(modelId, {
            modelId,
            modelName: model?.name || "未知模型",
            totalCalls: 0,
            successCalls: 0,
            failedCalls: 0,
            successRate: 0,
            totalTokens: 0,
            avgTokensPerCall: 0,
          });
        }

        const stat = statsMap.get(modelId)!;
        stat.totalCalls++;

        // 根据日志结构计算 tokens
        const inputTokens = (log as any).inputTokens || 0;
        const outputTokens = (log as any).outputTokens || 0;
        stat.totalTokens += inputTokens + outputTokens;

        if (log.success !== false) {
          stat.successCalls++;
        } else {
          stat.failedCalls++;
        }
      }

      // 计算成功率和平均值
      for (const stat of statsMap.values()) {
        stat.successRate =
          stat.totalCalls > 0 ? (stat.successCalls / stat.totalCalls) * 100 : 0;
        stat.avgTokensPerCall =
          stat.totalCalls > 0 ? stat.totalTokens / stat.totalCalls : 0;
      }

      const statsArray = Array.from(statsMap.values());

      // 按模型过滤
      const filtered =
        selectedModel !== "all"
          ? statsArray.filter((s) => s.modelId === selectedModel)
          : statsArray;

      setStats(filtered);
    } catch (error) {
      console.error("加载统计数据失败", error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      // 从 IndexedDB 加载使用日志
      const allLogs = await db.usageLogs.toArray();

      // 按日期范围过滤
      const [start, end] = dateRange;
      const startTime = start?.valueOf() ?? 0;
      const endTime = end?.valueOf() ?? Number.MAX_VALUE;

      const filteredLogs = allLogs
        .filter((log) => log.timestamp >= startTime && log.timestamp <= endTime)
        .map((log) => {
          const model = configs.find((m: any) => m.id === log.modelId);
          const inputTokens = (log as any).inputTokens || 0;
          const outputTokens = (log as any).outputTokens || 0;

          return {
            id: log.id,
            modelId: log.modelId || "unknown",
            modelName: model?.name || "未知模型",
            action: (log as any).action || "chat",
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            success: log.success !== false,
            errorMessage: (log as any).errorMessage,
            createdAt: log.timestamp,
          } as UsageLog;
        });

      // 按模型过滤
      const filtered =
        selectedModel !== "all"
          ? filteredLogs.filter((l) => l.modelId === selectedModel)
          : filteredLogs;

      // 按时间倒序排列
      filtered.sort((a, b) => b.createdAt - a.createdAt);

      setLogs(filtered);
    } catch (error) {
      console.error("加载日志失败", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString("zh-CN");
      },
    },
    {
      title: "模型",
      dataIndex: "modelName",
      key: "modelName",
      width: 150,
    },
    {
      title: "操作类型",
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (action: string) => {
        const map: Record<string, { text: string; color: string }> = {
          chat: { text: "对话", color: "blue" },
          completion: { text: "补全", color: "green" },
          embedding: { text: "嵌入", color: "purple" },
          generate: { text: "生成", color: "orange" },
          rewrite: { text: "改写", color: "cyan" },
          summarize: { text: "摘要", color: "magenta" },
        };
        const info = map[action] || { text: action, color: "default" };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "输入Token",
      dataIndex: "inputTokens",
      key: "inputTokens",
      width: 100,
      render: (tokens: number) => tokens?.toLocaleString() || 0,
    },
    {
      title: "输出Token",
      dataIndex: "outputTokens",
      key: "outputTokens",
      width: 100,
      render: (tokens: number) => tokens?.toLocaleString() || 0,
    },
    {
      title: "总Token",
      dataIndex: "totalTokens",
      key: "totalTokens",
      width: 100,
      render: (tokens: number) => tokens?.toLocaleString() || 0,
    },
    {
      title: "状态",
      dataIndex: "success",
      key: "success",
      width: 80,
      render: (success: boolean) =>
        success ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            成功
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            失败
          </Tag>
        ),
    },
    {
      title: "错误信息",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: true,
      render: (msg: string) => msg || "-",
    },
  ];

  // 准备图表数据
  const chartData = stats.map((stat) => ({
    name: stat.modelName,
    calls: stat.totalCalls,
    tokens: stat.totalTokens,
    successRate: stat.successRate,
  }));

  // 饼图数据
  const pieData = stats.map((stat, index) => ({
    name: stat.modelName,
    value: stat.totalCalls,
    color: COLORS_CHART[index % COLORS_CHART.length],
  }));

  const totalStats = {
    totalCalls: stats.reduce((sum, s) => sum + s.totalCalls, 0),
    totalTokens: stats.reduce((sum, s) => sum + s.totalTokens, 0),
    avgSuccessRate:
      stats.length > 0
        ? stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length
        : 0,
    totalCost: stats.reduce((sum, s) => {
      // 简单计费估算（按 $0.002/1K tokens 计算）
      return sum + (s.totalTokens * 0.002) / 1000;
    }, 0),
  };

  return (
    <div>
      <Header>
        <h2>使用统计</h2>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [any, any])}
            allowClear={false}
          />
          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            style={{ width: 150 }}
          >
            <Select.Option value="all">所有模型</Select.Option>
            {configs.map((model) => (
              <Select.Option key={model.id} value={model.id}>
                {model.name}
              </Select.Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadStats();
              loadLogs();
            }}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </Header>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <ChartCard>
            <StyledStatistic
              title="总调用次数"
              value={totalStats.totalCalls}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </ChartCard>
        </Col>
        <Col span={6}>
          <ChartCard>
            <StyledStatistic
              title="总Token数"
              value={totalStats.totalTokens}
              valueStyle={{ color: "#1890ff" }}
            />
          </ChartCard>
        </Col>
        <Col span={6}>
          <ChartCard>
            <StyledStatistic
              title="平均成功率"
              value={totalStats.avgSuccessRate}
              precision={1}
              suffix="%"
              valueStyle={{
                color:
                  totalStats.avgSuccessRate >= 95
                    ? "#52c41a"
                    : totalStats.avgSuccessRate >= 80
                      ? "#faad14"
                      : "#f5222d",
              }}
            />
          </ChartCard>
        </Col>
        <Col span={6}>
          <ChartCard>
            <StyledStatistic
              title="估算费用"
              value={totalStats.totalCost}
              precision={4}
              prefix="$"
              valueStyle={{ color: "#722ed1" }}
            />
          </ChartCard>
        </Col>
      </Row>

      {stats.length === 0 ? (
        <ChartCard>
          <Empty
            description="暂无使用数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </ChartCard>
      ) : (
        <>
          {/* 图表 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <ChartCard title="调用次数统计">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col span={12}>
              <ChartCard title="成功率对比">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      stroke="#52c41a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          {/* 调用分布饼图 */}
          {pieData.length > 0 && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <ChartCard title="调用次数分布">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) =>
                          `${props.name || ""} ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Col>
              <Col span={12}>
                <ChartCard title="Token 使用分布">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.map((s, i) => ({
                          name: s.modelName,
                          value: s.totalTokens,
                          color: COLORS_CHART[i % COLORS_CHART.length],
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) =>
                          `${props.name || ""} ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS_CHART[index % COLORS_CHART.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Col>
            </Row>
          )}

          {/* 详细统计 */}
          <ChartCard title="模型详细统计">
            <Table
              dataSource={stats}
              rowKey="modelId"
              pagination={false}
              columns={[
                {
                  title: "模型名称",
                  dataIndex: "modelName",
                  key: "modelName",
                },
                {
                  title: "总调用",
                  dataIndex: "totalCalls",
                  key: "totalCalls",
                  render: (val: number) => val.toLocaleString(),
                },
                {
                  title: "成功",
                  dataIndex: "successCalls",
                  key: "successCalls",
                  render: (val: number) => val.toLocaleString(),
                },
                {
                  title: "失败",
                  dataIndex: "failedCalls",
                  key: "failedCalls",
                  render: (val: number) => val.toLocaleString(),
                },
                {
                  title: "成功率",
                  dataIndex: "successRate",
                  key: "successRate",
                  render: (rate: number) => (
                    <div style={{ width: 120 }}>
                      <Progress
                        percent={rate}
                        size="small"
                        status={
                          rate >= 95
                            ? "success"
                            : rate >= 80
                              ? "normal"
                              : "exception"
                        }
                      />
                    </div>
                  ),
                },
                {
                  title: "总Token",
                  dataIndex: "totalTokens",
                  key: "totalTokens",
                  render: (val: number) => val.toLocaleString(),
                },
                {
                  title: "平均Token/次",
                  dataIndex: "avgTokensPerCall",
                  key: "avgTokensPerCall",
                  render: (val: number) => Math.round(val).toLocaleString(),
                },
              ]}
            />
          </ChartCard>

          {/* 调用日志 */}
          <ChartCard title="调用日志" style={{ marginTop: 24 }}>
            <Table
              dataSource={logs}
              rowKey="id"
              loading={loading}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
}

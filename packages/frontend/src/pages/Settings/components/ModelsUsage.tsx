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
} from "recharts";
import {
  ReloadOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const ChartCard = styled(Card)`
  margin-bottom: 24px;

  .ant-card-head {
    border-bottom: 1px solid #e8e8e8;
  }
`;

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
  createdAt: string;
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

export default function ModelsUsage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [dateRange, setDateRange] = useState<[any, any]>([
    dayjs().subtract(7, "days"),
    dayjs(),
  ]);
  const [selectedModel, setSelectedModel] = useState<string>("all");

  useEffect(() => {
    loadStats();
    loadLogs();
  }, [dateRange, selectedModel]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // TODO: 调用实际API
      // const response = await modelsApi.getUsageStats({
      //   startDate: dateRange[0].format("YYYY-MM-DD"),
      //   endDate: dateRange[1].format("YYYY-MM-DD"),
      //   modelId: selectedModel,
      // });

      // 模拟数据
      setStats([
        {
          modelId: "1",
          modelName: "GPT-3.5 Turbo",
          totalCalls: 1250,
          successCalls: 1230,
          failedCalls: 20,
          successRate: 98.4,
          totalTokens: 125000,
          avgTokensPerCall: 100,
        },
        {
          modelId: "2",
          modelName: "GPT-4",
          totalCalls: 320,
          successCalls: 315,
          failedCalls: 5,
          successRate: 98.4,
          totalTokens: 96000,
          avgTokensPerCall: 300,
        },
      ]);
    } catch (error) {
      console.error("加载统计数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      // TODO: 调用实际API
      // const response = await modelsApi.getUsageLogs({
      //   startDate: dateRange[0].format("YYYY-MM-DD"),
      //   endDate: dateRange[1].format("YYYY-MM-DD"),
      //   modelId: selectedModel,
      //   limit: 50,
      // });

      // 模拟数据
      setLogs([
        {
          id: "1",
          modelId: "1",
          modelName: "GPT-3.5 Turbo",
          action: "chat",
          inputTokens: 150,
          outputTokens: 300,
          totalTokens: 450,
          success: true,
          createdAt: dayjs().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          id: "2",
          modelId: "2",
          modelName: "GPT-4",
          action: "completion",
          inputTokens: 200,
          outputTokens: 500,
          totalTokens: 700,
          success: true,
          createdAt: dayjs().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          id: "3",
          modelId: "1",
          modelName: "GPT-3.5 Turbo",
          action: "chat",
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
          success: false,
          errorMessage: "Rate limit exceeded",
          createdAt: dayjs().subtract(3, "hours").format("YYYY-MM-DD HH:mm:ss"),
        },
      ]);
    } catch (error) {
      console.error("加载日志失败", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
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
      width: 120,
      render: (action: string) => {
        const map: Record<string, string> = {
          chat: "对话",
          completion: "补全",
          embedding: "嵌入",
        };
        return map[action] || action;
      },
    },
    {
      title: "输入Token",
      dataIndex: "inputTokens",
      key: "inputTokens",
      width: 100,
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: "输出Token",
      dataIndex: "outputTokens",
      key: "outputTokens",
      width: 100,
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: "总Token",
      dataIndex: "totalTokens",
      key: "totalTokens",
      width: 100,
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: "状态",
      dataIndex: "success",
      key: "success",
      width: 100,
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
    },
  ];

  // 准备图表数据
  const chartData = stats.map((stat) => ({
    name: stat.modelName,
    calls: stat.totalCalls,
    tokens: stat.totalTokens,
    successRate: stat.successRate,
  }));

  const totalStats = {
    totalCalls: stats.reduce((sum, s) => sum + s.totalCalls, 0),
    totalTokens: stats.reduce((sum, s) => sum + s.totalTokens, 0),
    avgSuccessRate:
      stats.length > 0
        ? stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length
        : 0,
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>使用统计</h3>
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
            {stats.map((stat) => (
              <Select.Option key={stat.modelId} value={stat.modelId}>
                {stat.modelName}
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
      </div>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <ChartCard>
            <Statistic
              title="总调用次数"
              value={totalStats.totalCalls}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </ChartCard>
        </Col>
        <Col span={8}>
          <ChartCard>
            <Statistic
              title="总Token数"
              value={totalStats.totalTokens}
              valueStyle={{ color: "#1890ff" }}
            />
          </ChartCard>
        </Col>
        <Col span={8}>
          <ChartCard>
            <Statistic
              title="平均成功率"
              value={totalStats.avgSuccessRate}
              precision={1}
              suffix="%"
              valueStyle={{
                color: totalStats.avgSuccessRate >= 95 ? "#52c41a" : "#faad14",
              }}
            />
          </ChartCard>
        </Col>
      </Row>

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
              render: (val: number) => val.toLocaleString(),
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
    </div>
  );
}

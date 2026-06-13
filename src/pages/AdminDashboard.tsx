import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Utilization, Task } from "@shared/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Truck,
  Clock,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Package,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<Utilization[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        api.getUtilization(),
        api.getTasks(),
      ]);
      setData(u);
      setTasks(t);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalWorking = data.reduce((s, d) => s + d.workingMinutes, 0);
  const totalTasks = data.reduce((s, d) => s + d.taskCount, 0);
  const avgUtil =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.utilizationRate, 0) / data.length)
      : 0;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const chartData = data.map((d) => ({
    code: d.forkliftCode,
    利用率: d.utilizationRate,
    作业分钟: d.workingMinutes,
    空闲分钟: d.idleMinutes,
    任务数: d.taskCount,
  }));

  const stats = [
    {
      label: "平均利用率",
      value: `${avgUtil}%`,
      icon: TrendingUp,
      color: "bg-port-600 text-white",
    },
    {
      label: "总作业时长",
      value: `${Math.floor(totalWorking / 60)}小时${totalWorking % 60}分`,
      icon: Clock,
      color: "bg-emerald-600 text-white",
    },
    {
      label: "总任务数",
      value: totalTasks.toString(),
      icon: Package,
      color: "bg-indigo-600 text-white",
    },
    {
      label: "已完成任务",
      value: completedCount.toString(),
      icon: CheckCircle,
      color: "bg-warn-500 text-white",
    },
  ];

  function barColor(rate: number) {
    if (rate >= 80) return "#0A2540";
    if (rate >= 60) return "#2f5787";
    if (rate >= 40) return "#4d75a5";
    return "#aec2d9";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-port-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            叉车利用率统计
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            按叉车维度统计作业时长、空闲时长与利用率
          </p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="card-body flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                  <div className="text-2xl font-bold text-slate-800 mt-0.5">
                    {s.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">叉车利用率对比 (%)</h3>
        </div>
        <div className="card-body h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              加载中...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "利用率" ? `${value}%` : `${value}`,
                    name,
                  ]}
                />
                <Bar dataKey="利用率" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={barColor(d.利用率)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">叉车利用率明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">叉车编号</th>
                <th className="th">作业时长</th>
                <th className="th">空闲时长</th>
                <th className="th">任务数</th>
                <th className="th">利用率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.forkliftId} className="hover:bg-slate-50">
                  <td className="td font-medium">{d.forkliftCode}</td>
                  <td className="td">
                    {Math.floor(d.workingMinutes / 60)}h {d.workingMinutes % 60}m
                  </td>
                  <td className="td text-slate-500">
                    {Math.floor(d.idleMinutes / 60)}h {d.idleMinutes % 60}m
                  </td>
                  <td className="td">{d.taskCount}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${d.utilizationRate}%`,
                            backgroundColor: barColor(d.utilizationRate),
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-xs font-medium"
                        style={{ color: barColor(d.utilizationRate) }}
                      >
                        {d.utilizationRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

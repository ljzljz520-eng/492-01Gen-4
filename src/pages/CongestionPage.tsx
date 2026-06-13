import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import type { CongestionPoint } from "@shared/types";
import {
  MapPin,
  RefreshCw,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const YARDS = ["A", "B", "C", "D"];

export default function CongestionPage() {
  const [points, setPoints] = useState<CongestionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  async function load() {
    setLoading(true);
    try {
      setPoints(await api.getCongestion(days));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [days]);

  const { matrix, maxCount, yardTotals, hourTotals } = useMemo(() => {
    const yardHourMap: Record<string, Record<number, number>> = {};
    YARDS.forEach((y) => {
      yardHourMap[y] = Object.fromEntries(HOURS.map((h) => [h, 0]));
    });
    points.forEach((p) => {
      const y = p.yard || "A";
      if (yardHourMap[y] && HOURS.includes(p.hour)) {
        yardHourMap[y][p.hour] += p.taskCount;
      }
    });
    let max = 1;
    Object.values(yardHourMap).forEach((hMap) => {
      Object.values(hMap).forEach((v) => {
        if (v > max) max = v;
      });
    });
    const yardTotals: Record<string, number> = {};
    YARDS.forEach((y) => {
      yardTotals[y] = Object.values(yardHourMap[y]).reduce((s, v) => s + v, 0);
    });
    const hourTotals: Record<number, number> = {};
    HOURS.forEach((h) => {
      hourTotals[h] = YARDS.reduce((s, y) => s + yardHourMap[y][h], 0);
    });
    return { matrix: yardHourMap, maxCount: max, yardTotals, hourTotals };
  }, [points]);

  function intensityColor(value: number): string {
    if (value === 0) return "bg-slate-50 text-slate-300";
    const ratio = value / maxCount;
    if (ratio >= 0.75) return "bg-warn-500 text-white";
    if (ratio >= 0.5) return "bg-warn-300 text-warn-700";
    if (ratio >= 0.25) return "bg-port-200 text-port-800";
    return "bg-port-100 text-port-700";
  }

  const peakHour = HOURS.reduce(
    (best, h) => (hourTotals[h] > hourTotals[best] ? h : best),
    0
  );
  const peakYard = YARDS.reduce(
    (best, y) => (yardTotals[y] > yardTotals[best] ? y : best),
    "A"
  );
  const totalTasks = Object.values(yardTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-port-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            堆场拥堵时段分析
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            按时段 × 堆场维度展示任务分布，识别拥堵高峰
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input w-auto"
          >
            <option value={1}>最近 1 天</option>
            <option value={3}>最近 3 天</option>
            <option value={7}>最近 7 天</option>
            <option value={14}>最近 14 天</option>
          </select>
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-xs text-slate-500">总任务数 (近 {days} 天)</div>
            <div className="text-3xl font-bold text-port-900 mt-1">{totalTasks}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-warn-500" />
              高峰时段
            </div>
            <div className="text-3xl font-bold text-warn-600 mt-1">
              {String(peakHour).padStart(2, "0")}:00
            </div>
            <div className="text-xs text-slate-500 mt-1">
              共 {hourTotals[peakHour]} 个任务
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-port-500" />
              最繁忙堆场
            </div>
            <div className="text-3xl font-bold text-port-800 mt-1">
              {peakYard} 区
            </div>
            <div className="text-xs text-slate-500 mt-1">
              共 {yardTotals[peakYard]} 个任务
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">拥堵热力图</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>图例：</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-slate-50 border" />
              <span>空闲</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-port-100" />
              <span>低</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-port-200" />
              <span>中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-warn-300" />
              <span>较高</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-warn-500" />
              <span>拥堵</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-10 text-slate-400">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-slate-500 bg-slate-50 border-b border-r border-slate-200 w-16">
                      堆场 \ 时段
                    </th>
                    {HOURS.map((h) => (
                      <th
                        key={h}
                        className={`px-1 py-2 text-center font-medium border-b border-slate-200 ${
                          h === peakHour ? "bg-warn-50 text-warn-600" : "text-slate-500 bg-slate-50"
                        }`}
                      >
                        {String(h).padStart(2, "0")}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-medium text-slate-500 bg-slate-50 border-b border-l border-slate-200 w-14">
                      合计
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {YARDS.map((yard) => (
                    <tr key={yard}>
                      <td
                        className={`px-2 py-2 font-medium border-r border-b border-slate-200 ${
                          yard === peakYard ? "bg-warn-50 text-warn-600" : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {yard} 区
                      </td>
                      {HOURS.map((h) => {
                        const v = matrix[yard][h];
                        return (
                          <td
                            key={h}
                            className="border-b border-r border-slate-100 p-0.5"
                          >
                            <div
                              className={`w-full h-8 rounded flex items-center justify-center font-mono font-medium ${intensityColor(
                                v
                              )}`}
                              title={`${yard}区 ${String(h).padStart(2, "0")}:00 - ${v} 个任务`}
                            >
                              {v > 0 ? v : ""}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-semibold text-port-800 bg-slate-50 border-b border-l border-slate-200">
                        {yardTotals[yard]}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-2 font-medium bg-slate-100 text-slate-600 border-r border-t border-slate-200">
                      时段合计
                    </td>
                    {HOURS.map((h) => (
                      <td
                        key={h}
                        className={`px-2 py-2 text-center font-medium border-t border-r border-slate-200 ${
                          h === peakHour
                            ? "bg-warn-100 text-warn-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {hourTotals[h]}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center font-bold text-port-900 bg-port-100 border-t border-l border-slate-200">
                      {totalTasks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

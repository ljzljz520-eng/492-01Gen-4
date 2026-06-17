import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Task, TaskStatus } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime, formatDurationMinutes } from "@/utils/format";
import {
  Plus,
  RefreshCw,
  Package,
  AlertTriangle,
  MapPin,
  Ship,
  User,
  Truck,
  Clock,
} from "lucide-react";

const columns: { key: TaskStatus; title: string; accent: string }[] = [
  { key: "pending", title: "待指派", accent: "bg-slate-500" },
  { key: "assigned", title: "待接单", accent: "bg-blue-500" },
  { key: "accepted", title: "已接单", accent: "bg-cyan-500" },
  { key: "arrived", title: "已到达", accent: "bg-sky-500" },
  { key: "loading", title: "装卸中", accent: "bg-indigo-500" },
  { key: "waiting", title: "异常等待", accent: "bg-warn-500" },
  { key: "completed", title: "已完成", accent: "bg-emerald-500" },
];

export default function DispatcherBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function TaskCard({ task }: { task: Task }) {
    return (
      <Link
        to={`/dispatcher/task/${task.id}`}
        className="block card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-mono text-xs text-slate-500">{task.taskNo}</div>
          <StatusBadge status={task.status} />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-port-600" />
          <span className="font-semibold text-slate-800">{task.containerNo}</span>
          <span className="text-xs text-slate-500">{task.containerWeight} 吨</span>
          {task.isHazardous && (
            <span className="badge bg-warn-500 text-white gap-1">
              <AlertTriangle className="w-3 h-3" />
              危险品 {task.hazardousClass}
            </span>
          )}
        </div>
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.shipSchedule}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.yardLocation}</span>
          </div>
          {(task.driverName || task.forkliftCode) && (
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100 mt-2">
              {task.driverName && (
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.driverName}</span>
                </div>
              )}
              {task.forkliftCode && (
                <div className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.forkliftCode}</span>
                </div>
              )}
            </div>
          )}
          {task.completedAt && (
            <div className="flex items-center gap-1.5 pt-1 text-emerald-600">
              <Clock className="w-3.5 h-3.5" />
              完工：{formatDateTime(task.completedAt)}
            </div>
          )}
          {task.waitingMinutes && task.waitingMinutes > 0 && (
            <div className="text-warn-600 text-xs">
              异常等待 {formatDurationMinutes(task.waitingMinutes)}
              {task.exceptionNote && ` · ${task.exceptionNote}`}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-port-900">任务看板</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {tasks.length} 个任务，点击任务卡片查看详情
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
          <Link to="/dispatcher/task/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新建派活
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 px-1 mb-3">
                <div className={`w-2 h-2 rounded-full ${col.accent}`} />
                <h3 className="text-sm font-semibold text-slate-700">
                  {col.title}
                </h3>
                <span className="ml-auto text-xs text-slate-500 bg-slate-100 rounded-full px-2">
                  {tasks.filter((t) => t.status === col.key).length}
                </span>
              </div>
              <div className="flex-1 space-y-3 rounded-lg bg-slate-100/50 p-2">
                {tasks
                  .filter((t) => t.status === col.key)
                  .map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                {tasks.filter((t) => t.status === col.key).length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { Driver, Task } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime, formatDurationMinutes } from "@/utils/format";
import { useAppStore } from "@/store/useAppStore";
import {
  Truck,
  Package,
  AlertTriangle,
  MapPin,
  Ship,
  User,
  RefreshCw,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

export default function DriverTaskList() {
  const { currentDriver, setCurrentDriver } = useAppStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDrivers().then(setDrivers);
  }, []);

  async function load() {
    if (!currentDriver) return;
    setLoading(true);
    try {
      const data = await api.getTasks({ driverId: currentDriver.id });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentDriver]);

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const doneTasks = tasks.filter((t) => t.status === "completed");

  if (!currentDriver) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-bold text-port-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              选择司机身份
            </h2>
          </div>
          <div className="card-body space-y-2">
            {drivers.map((d) => (
              <button
                key={d.id}
                onClick={() => setCurrentDriver(d)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-port-400 hover:bg-port-50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    工号: {d.employeeNo}
                    {d.isHazardousAuthorized && " · ✅ 危险品授权"}
                    {" · "}
                    状态: {d.status}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-port-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            我的任务
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            当前司机：{currentDriver.name} ({currentDriver.employeeNo})
            {currentDriver.isHazardousAuthorized && " · ✅ 危险品授权"}
            <button
              onClick={() => setCurrentDriver(null)}
              className="text-port-600 hover:underline ml-2"
            >
              切换
            </button>
          </p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">加载中...</div>
      ) : (
        <>
          <section>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              进行中 ({activeTasks.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {activeTasks.map((t) => (
                <DriverTaskCard key={t.id} task={t} />
              ))}
              {activeTasks.length === 0 && (
                <div className="card-body text-center text-slate-400 text-sm py-8">
                  暂无进行中的任务
                </div>
              )}
            </div>
          </section>

          {doneTasks.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-600 mb-3">
                已完成 ({doneTasks.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {doneTasks.map((t) => (
                  <DriverTaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function DriverTaskCard({ task }: { task: Task }) {
  const isDone = task.status === "completed";
  return (
    <Link
      to={`/driver/task/${task.id}`}
      className={`card p-4 transition hover:shadow-md ${
        isDone ? "opacity-75" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-port-600" />
            <span className="font-bold text-slate-800">{task.containerNo}</span>
          </div>
          <div className="font-mono text-xs text-slate-400 mt-0.5">{task.taskNo}</div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.isHazardous && (
        <div className="mb-3">
          <span className="badge bg-warn-500 text-white gap-1">
            <AlertTriangle className="w-3 h-3" />
            危险品 {task.hazardousClass}
          </span>
        </div>
      )}

      <div className="space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-1.5">
          <Ship className="w-3.5 h-3.5 text-slate-400" />
          <span>{task.shipSchedule}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{task.yardLocation}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Truck className="w-3.5 h-3.5" />
          {task.forkliftCode} · {task.containerWeight} 吨
        </div>
      </div>

      {isDone && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-600">
          完工：{formatDateTime(task.completedAt)}
        </div>
      )}

      {task.waitingMinutes && task.waitingMinutes > 0 && (
        <div className="mt-2 text-xs text-warn-600">
          异常等待: {formatDurationMinutes(task.waitingMinutes)}
        </div>
      )}

      {!isDone && (
        <div className="mt-3 flex justify-end">
          <span className="text-sm font-medium text-port-600 flex items-center gap-1">
            进入作业流程 <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}
    </Link>
  );
}

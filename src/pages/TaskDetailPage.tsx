import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { Task } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime, formatDurationMinutes } from "@/utils/format";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  MapPin,
  Ship,
  User,
  Truck,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      setTask(await api.getTask(Number(id)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="text-center py-10">加载中...</div>;
  if (!task) return <div className="text-center py-10 text-red-500">任务不存在</div>;

  const timelines = [
    { label: "任务创建", time: task.createdAt, icon: Package, done: !!task.createdAt },
    { label: "已指派", time: task.assignedAt, icon: User, done: !!task.assignedAt },
    { label: "到达堆场", time: task.arrivedAt, icon: MapPin, done: !!task.arrivedAt },
    { label: "开始装卸", time: task.loadingStartedAt, icon: Truck, done: !!task.loadingStartedAt },
    { label: "完工", time: task.completedAt, icon: CheckCircle2, done: !!task.completedAt },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost">
        <ArrowLeft className="w-4 h-4" />
        返回看板
      </button>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-mono text-xs text-slate-500">{task.taskNo}</div>
              <h2 className="text-xl font-bold text-port-900 flex items-center gap-2">
                {task.containerNo}
                {task.isHazardous && (
                  <span className="badge bg-warn-500 text-white gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    危险品 {task.hazardousClass}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500 text-xs">货柜重量</div>
                  <div className="font-medium">{task.containerWeight} 吨</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">堆场位置</div>
                  <div className="font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-port-500" />
                    {task.yardLocation}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 text-xs">船期</div>
                  <div className="font-medium flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-port-500" />
                    {task.shipSchedule}
                  </div>
                </div>
              </div>

              {(task.driverName || task.forkliftCode) && (
                <>
                  <h3 className="font-semibold text-slate-800 border-b pb-2 pt-2">
                    作业资源
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs">司机</div>
                      <div className="font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-port-500" />
                        {task.driverName || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">叉车</div>
                      <div className="font-medium flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-port-500" />
                        {task.forkliftCode || "-"}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {task.waitingMinutes && task.waitingMinutes > 0 && (
                <div className="p-3 rounded-lg bg-warn-50 border border-warn-200">
                  <div className="text-warn-700 font-medium text-sm flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    异常等待
                  </div>
                  <div className="text-sm text-warn-800">
                    等待时长：{formatDurationMinutes(task.waitingMinutes)}
                  </div>
                  {task.exceptionNote && (
                    <div className="text-xs text-warn-700 mt-1">
                      原因：{task.exceptionNote}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 border-b pb-2">作业时间线</h3>
              <div className="relative pl-6 mt-4">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
                {timelines.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <div key={idx} className="relative pb-6 last:pb-0">
                      <div
                        className={`absolute -left-4 w-5 h-5 rounded-full flex items-center justify-center ${
                          t.done
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            t.done ? "text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {t.label}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(t.time)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/dispatcher" className="btn-ghost">
          返回任务看板
        </Link>
      </div>
    </div>
  );
}

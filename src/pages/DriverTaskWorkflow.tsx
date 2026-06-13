import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { Task } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime, formatDurationMinutes } from "@/utils/format";
import { useAppStore } from "@/store/useAppStore";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  MapPin,
  Ship,
  Truck,
  Check,
  Loader2,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";

const steps = [
  { key: "assigned", label: "接单", icon: Send, desc: "确认接单并出发" },
  { key: "arrived", label: "到达堆场", icon: MapPin, desc: "到达指定堆场位置" },
  { key: "loading", label: "装卸作业", icon: Truck, desc: "开始装卸作业" },
  { key: "completed", label: "完工", icon: Check, desc: "作业完成并提交" },
];

export default function DriverTaskWorkflow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, currentDriver } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWaitDialog, setShowWaitDialog] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(15);
  const [waitNote, setWaitNote] = useState("");

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

  function currentStepIndex(): number {
    if (!task) return -1;
    switch (task.status) {
      case "pending":
        return -1;
      case "assigned":
        return 0;
      case "arrived":
        return 1;
      case "loading":
      case "waiting":
        return 2;
      case "completed":
        return 3;
      default:
        return -1;
    }
  }

  async function doAction(action: () => Promise<Task>, successMsg: string) {
    setSubmitting(true);
    try {
      const updated = await action();
      setTask(updated);
      showToast(successMsg, "success");
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleArrive() {
    if (!task) return;
    doAction(() => api.arriveTask(task.id), "已记录到达时间");
  }
  function handleStartLoading() {
    if (!task) return;
    doAction(() => api.startLoadingTask(task.id), "装卸作业已开始");
  }
  function handleComplete() {
    if (!task) return;
    doAction(() => api.completeTask(task.id), "作业已完工");
  }

  async function handleSubmitWait() {
    if (!task) return;
    if (waitMinutes <= 0) {
      showToast("请输入有效的等待时长", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await api.waitTask(task.id, waitMinutes, waitNote);
      setTask(updated);
      setShowWaitDialog(false);
      setWaitNote("");
      setWaitMinutes(15);
      showToast("已记录异常等待", "success");
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !task)
    return <div className="text-center py-20 text-slate-500">加载中...</div>;

  const stepIdx = currentStepIndex();
  const isCompleted = task.status === "completed";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost">
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-port-600" />
              <span className="text-lg font-bold text-slate-800">
                {task.containerNo}
              </span>
              {task.isHazardous && (
                <span className="badge bg-warn-500 text-white gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  危险品 {task.hazardousClass}
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-slate-400 mt-0.5">{task.taskNo}</div>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <div className="card-body grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs">船期</div>
            <div className="font-medium flex items-center gap-1 mt-0.5">
              <Ship className="w-3.5 h-3.5 text-port-500" />
              {task.shipSchedule}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">堆场位置</div>
            <div className="font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-port-500" />
              {task.yardLocation}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">叉车 · 货重</div>
            <div className="font-medium flex items-center gap-1 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-port-500" />
              {task.forkliftCode} · {task.containerWeight} 吨
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">作业流程</h3>
          {task.status === "waiting" && (
            <span className="badge bg-warn-100 text-warn-600">
              等待中 {formatDurationMinutes(task.waitingMinutes)}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="relative">
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-200" />
            <div
              className="absolute top-6 left-6 h-0.5 bg-port-600 transition-all"
              style={{
                width: `calc(${(Math.max(0, stepIdx) / (steps.length - 1)) * 100}% - 24px)`,
              }}
            />
            <div className="relative grid grid-cols-4 gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={s.key} className="text-center">
                    <div
                      className={`relative z-10 w-12 h-12 mx-auto rounded-full flex items-center justify-center border-2 transition ${
                        done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : active
                          ? "bg-port-600 border-port-600 text-white"
                          : "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div
                      className={`mt-2 text-sm font-medium ${
                        done || active ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <TimeRow label="指派时间" time={task.assignedAt} />
            <TimeRow label="到达时间" time={task.arrivedAt} />
            <TimeRow label="开始装卸" time={task.loadingStartedAt} />
            <TimeRow label="完工时间" time={task.completedAt} />
          </div>

          {task.waitingMinutes && task.waitingMinutes > 0 && (
            <div className="mt-5 p-3 rounded-lg bg-warn-50 border border-warn-200 text-sm text-warn-800">
              <div className="font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                异常等待
              </div>
              <div className="mt-1">
                时长：{formatDurationMinutes(task.waitingMinutes)}
                {task.exceptionNote && ` · 原因：${task.exceptionNote}`}
              </div>
            </div>
          )}

          {!isCompleted && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {stepIdx === 0 && (
                <button
                  onClick={handleArrive}
                  disabled={submitting}
                  className="btn-primary px-6 py-2.5"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  已到达堆场
                </button>
              )}
              {stepIdx === 1 && (
                <>
                  <button
                    onClick={handleStartLoading}
                    disabled={submitting}
                    className="btn-primary px-6 py-2.5"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    开始装卸
                  </button>
                  <button
                    onClick={() => setShowWaitDialog(true)}
                    className="btn-warn px-6 py-2.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    异常等待
                  </button>
                </>
              )}
              {(stepIdx === 2 || task.status === "waiting") && (
                <>
                  {task.status !== "waiting" && (
                    <button
                      onClick={() => setShowWaitDialog(true)}
                      className="btn-warn px-6 py-2.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      记录异常等待
                    </button>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    className="btn-success px-6 py-2.5"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    作业完工
                  </button>
                </>
              )}
            </div>
          )}

          {isCompleted && (
            <div className="mt-6 text-center py-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              ✓ 任务已完成
            </div>
          )}
        </div>
      </div>

      {showWaitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warn-500" />
                记录异常等待
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">等待时长 (分钟)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={waitMinutes}
                  onChange={(e) => setWaitMinutes(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label">异常原因</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="例如：等待龙门吊就位 / 货单信息核对..."
                  value={waitNote}
                  onChange={(e) => setWaitNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowWaitDialog(false)}
                  className="btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitWait}
                  disabled={submitting}
                  className="btn-warn"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeRow({ label, time }: { label: string; time?: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-sm text-slate-800 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-port-500" />
        {formatDateTime(time)}
      </div>
    </div>
  );
}

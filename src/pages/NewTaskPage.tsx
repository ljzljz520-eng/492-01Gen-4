import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { Driver, Forklift, CreateTaskPayload } from "@shared/types";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, AlertTriangle, CheckCircle2, Save } from "lucide-react";

export default function NewTaskPage() {
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [forklifts, setForklifts] = useState<Forklift[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateTaskPayload>({
    containerNo: "",
    containerWeight: 0,
    isHazardous: false,
    hazardousClass: "",
    shipSchedule: "",
    yardLocation: "",
    driverId: 0,
    forkliftId: 0,
  });

  useEffect(() => {
    api.getDrivers().then(setDrivers);
    api.getForklifts().then(setForklifts);
  }, []);

  const selectedDriver = drivers.find((d) => d.id === form.driverId);
  const selectedForklift = forklifts.find((f) => f.id === form.forkliftId);

  const hazardousMismatch =
    form.isHazardous && selectedDriver && !selectedDriver.isHazardousAuthorized;
  const weightMismatch =
    selectedForklift && form.containerWeight > selectedForklift.maxCapacity;

  function update<K extends keyof CreateTaskPayload>(key: K, value: CreateTaskPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.containerNo || !form.shipSchedule || !form.yardLocation) {
      showToast("请填写必填项", "error");
      return;
    }
    if (!form.driverId) {
      showToast("请选择司机", "error");
      return;
    }
    if (!form.forkliftId) {
      showToast("请选择叉车", "error");
      return;
    }
    if (hazardousMismatch) {
      showToast("该司机无危险品操作授权", "error");
      return;
    }
    if (weightMismatch) {
      showToast("货柜重量超过叉车最大载重", "error");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createTask(form);
      showToast(`任务 ${created.taskNo} 创建成功`, "success");
      navigate(`/dispatcher/task/${created.id}`);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <h2 className="text-lg font-bold text-port-900">新建派活任务</h2>
        </div>
        <div className="card-body space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label">货柜编号 *</label>
              <input
                className="input"
                placeholder="例如: MSKU1234567"
                value={form.containerNo}
                onChange={(e) => update("containerNo", e.target.value)}
              />
            </div>
            <div>
              <label className="label">货柜重量 (吨) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="input"
                placeholder="例如: 8.5"
                value={form.containerWeight || ""}
                onChange={(e) => update("containerWeight", Number(e.target.value))}
              />
              {weightMismatch && (
                <p className="mt-1 text-xs text-warn-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  超过叉车最大载重 ({selectedForklift?.maxCapacity} 吨)
                </p>
              )}
            </div>
            <div>
              <label className="label">船期 *</label>
              <input
                className="input"
                placeholder="例如: COSCO-001 / 06-14 08:00"
                value={form.shipSchedule}
                onChange={(e) => update("shipSchedule", e.target.value)}
              />
            </div>
            <div>
              <label className="label">堆场位置 *</label>
              <input
                className="input"
                placeholder="例如: A区-03-12"
                value={form.yardLocation}
                onChange={(e) => update("yardLocation", e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 mb-3">
              <input
                id="isHazardous"
                type="checkbox"
                className="w-4 h-4 accent-warn-500"
                checked={form.isHazardous}
                onChange={(e) => update("isHazardous", e.target.checked)}
              />
              <label htmlFor="isHazardous" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warn-500" />
                是否为危险品柜
              </label>
            </div>
            {form.isHazardous && (
              <div>
                <label className="label">危险品类项</label>
                <input
                  className="input"
                  placeholder="例如: 3类易燃液体"
                  value={form.hazardousClass}
                  onChange={(e) => update("hazardousClass", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label">指派司机 *</label>
              <select
                className="input"
                value={form.driverId}
                onChange={(e) => update("driverId", Number(e.target.value))}
              >
                <option value={0}>请选择司机</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeNo})
                    {d.isHazardousAuthorized ? " · ✅ 危险品授权" : ""}
                    {d.status === "working" ? " · 作业中" : ""}
                  </option>
                ))}
              </select>
              {selectedDriver && (
                <div className="mt-2 text-xs flex items-center gap-2">
                  {selectedDriver.isHazardousAuthorized ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      具备危险品操作授权
                    </span>
                  ) : (
                    <span className="text-slate-500">未授权危险品操作</span>
                  )}
                </div>
              )}
              {hazardousMismatch && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  该司机无危险品授权，无法操作危险品柜
                </p>
              )}
            </div>
            <div>
              <label className="label">指派叉车 *</label>
              <select
                className="input"
                value={form.forkliftId}
                onChange={(e) => update("forkliftId", Number(e.target.value))}
              >
                <option value={0}>请选择叉车</option>
                {forklifts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.model} ({f.maxCapacity}吨)
                    {f.status === "available" ? "" : ` · ${f.status}`}
                  </option>
                ))}
              </select>
              {selectedForklift && (
                <div className="mt-2 text-xs text-slate-500">
                  最大载重：{selectedForklift.maxCapacity} 吨，
                  状态：{selectedForklift.status}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost"
            >
              取消
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              <Save className="w-4 h-4" />
              {submitting ? "提交中..." : "创建任务"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

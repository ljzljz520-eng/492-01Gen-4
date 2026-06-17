import type { TaskStatus } from "@shared/types";

export function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function formatTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDurationMinutes(minutes?: number): string {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

export const statusLabel: Record<TaskStatus, string> = {
  pending: "待指派",
  assigned: "待接单",
  accepted: "已接单",
  arrived: "已到达",
  loading: "装卸中",
  waiting: "异常等待",
  completed: "已完成",
  exception: "异常",
};

export const statusColor: Record<TaskStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-cyan-100 text-cyan-700",
  arrived: "bg-sky-100 text-sky-700",
  loading: "bg-indigo-100 text-indigo-700",
  waiting: "bg-warn-100 text-warn-600",
  completed: "bg-emerald-100 text-emerald-700",
  exception: "bg-red-100 text-red-700",
};

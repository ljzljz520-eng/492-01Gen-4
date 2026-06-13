import type {
  Driver,
  Forklift,
  Task,
  TaskStatus,
  Utilization,
  CongestionPoint,
  CreateTaskPayload,
} from "@shared/types";

const API_BASE = "/api";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: string }).error || `请求失败 (${res.status})`;
    throw new Error(err);
  }
  return data as T;
}

export const api = {
  getDrivers: () => request<Driver[]>("/drivers"),
  getDriver: (id: number) => request<Driver>(`/drivers/${id}`),
  getForklifts: () => request<Forklift[]>("/forklifts"),
  getTasks: (params?: { status?: TaskStatus; driverId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.driverId) qs.set("driverId", String(params.driverId));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Task[]>(`/tasks${suffix}`);
  },
  getTask: (id: number) => request<Task>(`/tasks/${id}`),
  createTask: (payload: CreateTaskPayload) =>
    request<Task>("/tasks", { method: "POST", body: payload }),
  assignTask: (id: number, driverId: number, forkliftId: number) =>
    request<Task>(`/tasks/${id}/assign`, {
      method: "PATCH",
      body: { driverId, forkliftId },
    }),
  acceptTask: (id: number) =>
    request<Task>(`/tasks/${id}/accept`, { method: "PATCH" }),
  arriveTask: (id: number) =>
    request<Task>(`/tasks/${id}/arrive`, { method: "PATCH" }),
  startLoadingTask: (id: number) =>
    request<Task>(`/tasks/${id}/start-loading`, { method: "PATCH" }),
  waitTask: (id: number, minutes: number, note: string) =>
    request<Task>(`/tasks/${id}/waiting`, {
      method: "PATCH",
      body: { minutes, note },
    }),
  completeTask: (id: number) =>
    request<Task>(`/tasks/${id}/complete`, { method: "PATCH" }),
  getUtilization: (date?: string) => {
    const suffix = date ? `?date=${date}` : "";
    return request<Utilization[]>(`/stats/utilization${suffix}`);
  },
  getCongestion: (days = 7) =>
    request<CongestionPoint[]>(`/stats/congestion?days=${days}`),
};

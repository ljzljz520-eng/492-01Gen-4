export interface Driver {
  id: number;
  name: string;
  employeeNo: string;
  isHazardousAuthorized: boolean;
  status: 'idle' | 'working' | 'offline';
}

export interface Forklift {
  id: number;
  code: string;
  model: string;
  maxCapacity: number;
  status: 'available' | 'in_use' | 'maintenance';
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'arrived'
  | 'loading'
  | 'waiting'
  | 'completed'
  | 'exception';

export interface Task {
  id: number;
  taskNo: string;
  containerNo: string;
  containerWeight: number;
  isHazardous: boolean;
  hazardousClass?: string;
  shipSchedule: string;
  yardLocation: string;
  status: TaskStatus;
  driverId?: number;
  forkliftId?: number;
  driverName?: string;
  forkliftCode?: string;
  assignedAt?: string;
  arrivedAt?: string;
  loadingStartedAt?: string;
  waitingMinutes?: number;
  completedAt?: string;
  exceptionNote?: string;
  createdAt: string;
}

export interface Utilization {
  forkliftId: number;
  forkliftCode: string;
  date: string;
  workingMinutes: number;
  idleMinutes: number;
  utilizationRate: number;
  taskCount: number;
}

export interface CongestionPoint {
  hour: number;
  date: string;
  taskCount: number;
  yard: string;
}

export interface CreateTaskPayload {
  containerNo: string;
  containerWeight: number;
  isHazardous: boolean;
  hazardousClass?: string;
  shipSchedule: string;
  yardLocation: string;
  driverId: number;
  forkliftId: number;
}

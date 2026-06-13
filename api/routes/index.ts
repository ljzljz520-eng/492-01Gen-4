import { Router, Request, Response } from 'express';
import {
  getAllDrivers,
  getDriverById,
  getAllForklifts,
  getTasks,
  getTaskById,
  createTask,
  assignTask,
  acceptTask,
  markTaskArrived,
  markTaskLoading,
  markTaskWaiting,
  completeTask,
  generateTaskNo,
  getUtilizationStats,
  getCongestionStats,
  getTasksByDriver,
} from '../db/index.js';
import type { CreateTaskPayload, TaskStatus } from '../../shared/types.js';

const router = Router();

router.get('/drivers', (_req: Request, res: Response) => {
  res.json(getAllDrivers());
});

router.get('/drivers/:id', (req: Request, res: Response) => {
  const driver = getDriverById(Number(req.params.id));
  if (!driver) return res.status(404).json({ error: '司机不存在' });
  res.json(driver);
});

router.get('/forklifts', (_req: Request, res: Response) => {
  res.json(getAllForklifts());
});

router.get('/tasks', (req: Request, res: Response) => {
  const status = req.query.status as TaskStatus | undefined;
  const driverId = req.query.driverId as string | undefined;
  if (driverId) {
    res.json(getTasksByDriver(Number(driverId)));
  } else {
    res.json(getTasks(status));
  }
});

router.get('/tasks/:id', (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(task);
});

router.post('/tasks', (req: Request, res: Response) => {
  const payload = req.body as CreateTaskPayload;

  if (!payload.containerNo || !payload.shipSchedule || !payload.yardLocation) {
    return res.status(400).json({ error: '货柜号、船期、堆场位置为必填' });
  }

  if (payload.driverId) {
    const driver = getDriverById(payload.driverId);
    if (!driver) return res.status(400).json({ error: '指定司机不存在' });
    if (payload.isHazardous && !driver.isHazardousAuthorized) {
      return res.status(400).json({ error: `司机 ${driver.name} 无危险品操作授权，不能操作危险品柜` });
    }
  }

  const taskNo = generateTaskNo();
  const task = createTask({ ...payload, taskNo });
  res.status(201).json(task);
});

router.patch('/tasks/:id/assign', (req: Request, res: Response) => {
  const { driverId, forkliftId } = req.body as { driverId: number; forkliftId: number };
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });

  if (driverId) {
    const driver = getDriverById(driverId);
    if (!driver) return res.status(400).json({ error: '指定司机不存在' });
    if (task.isHazardous && !driver.isHazardousAuthorized) {
      return res.status(400).json({ error: `司机 ${driver.name} 无危险品操作授权` });
    }
  }

  const updated = assignTask(Number(req.params.id), driverId, forkliftId);
  res.json(updated);
});

router.patch('/tasks/:id/accept', (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(acceptTask(Number(req.params.id)));
});

router.patch('/tasks/:id/arrive', (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(markTaskArrived(Number(req.params.id)));
});

router.patch('/tasks/:id/start-loading', (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(markTaskLoading(Number(req.params.id)));
});

router.patch('/tasks/:id/waiting', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const { minutes, note } = req.body as { minutes: number; note: string };
  if (!minutes || minutes <= 0) return res.status(400).json({ error: '等待时长必须大于 0' });
  res.json(markTaskWaiting(taskId, minutes, note || ''));
});

router.patch('/tasks/:id/complete', (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(completeTask(Number(req.params.id)));
});

router.get('/stats/utilization', (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  res.json(getUtilizationStats(date));
});

router.get('/stats/congestion', (req: Request, res: Response) => {
  const days = Number(req.query.days) || 7;
  res.json(getCongestionStats(days));
});

export default router;

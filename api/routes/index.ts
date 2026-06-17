import { Router, Request, Response } from 'express';
import {
  getAllDrivers,
  getDriverById,
  getAllForklifts,
  getForkliftById,
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

const ALLOWED_FLOW: Record<string, string[]> = {
  accept: ['assigned'],
  arrive: ['accepted'],
  startLoading: ['arrived'],
  waiting: ['arrived', 'loading', 'waiting'],
  complete: ['loading', 'waiting'],
};

function checkFlow(action: string, currentStatus: string): boolean {
  const allowed = ALLOWED_FLOW[action];
  return allowed ? allowed.includes(currentStatus) : true;
}

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
  if (!payload.driverId) {
    return res.status(400).json({ error: '请选择司机' });
  }
  if (!payload.forkliftId) {
    return res.status(400).json({ error: '请选择叉车' });
  }

  const driver = getDriverById(payload.driverId);
  if (!driver) return res.status(400).json({ error: '指定司机不存在' });
  if (payload.isHazardous && !driver.isHazardousAuthorized) {
    return res.status(400).json({ error: `司机 ${driver.name} 无危险品操作授权，不能操作危险品柜` });
  }

  const forklift = getForkliftById(payload.forkliftId);
  if (!forklift) return res.status(400).json({ error: '指定叉车不存在' });
  if (payload.containerWeight > forklift.maxCapacity) {
    return res.status(400).json({
      error: `货柜超重：货柜 ${payload.containerWeight} 吨 > 叉车 ${forklift.code} 最大载重 ${forklift.maxCapacity} 吨`,
    });
  }

  try {
    const taskNo = generateTaskNo();
    const task = createTask({ ...payload, taskNo });
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/assign', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { driverId, forkliftId } = req.body as { driverId: number; forkliftId: number };
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  if (['completed'].includes(task.status)) {
    return res.status(400).json({ error: '任务已完成，无法重新指派' });
  }

  if (driverId) {
    const driver = getDriverById(driverId);
    if (!driver) return res.status(400).json({ error: '指定司机不存在' });
    if (task.isHazardous && !driver.isHazardousAuthorized) {
      return res.status(400).json({ error: `司机 ${driver.name} 无危险品操作授权` });
    }
  }
  if (forkliftId) {
    const forklift = getForkliftById(forkliftId);
    if (!forklift) return res.status(400).json({ error: '指定叉车不存在' });
    if (task.containerWeight > forklift.maxCapacity) {
      return res.status(400).json({
        error: `货柜超重：货柜 ${task.containerWeight} 吨 > 叉车 ${forklift.code} 最大载重 ${forklift.maxCapacity} 吨`,
      });
    }
  }

  try {
    const updated = assignTask(
      taskId,
      driverId ?? task.driverId!,
      forkliftId ?? task.forkliftId!
    );
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/accept', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (!checkFlow('accept', task.status)) {
    return res.status(400).json({ error: `当前状态为"${task.status}"，无法执行接单` });
  }
  try {
    res.json(acceptTask(taskId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/arrive', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (!checkFlow('arrive', task.status)) {
    return res
      .status(400)
      .json({ error: `当前状态为"${task.status}"，需先接单后才能记录到达堆场` });
  }
  try {
    res.json(markTaskArrived(taskId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/start-loading', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (!checkFlow('startLoading', task.status)) {
    return res
      .status(400)
      .json({ error: `当前状态为"${task.status}"，需先记录到达堆场后才能开始装卸` });
  }
  try {
    res.json(markTaskLoading(taskId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/waiting', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const { minutes, note } = req.body as { minutes: number; note: string };
  if (!minutes || minutes <= 0) return res.status(400).json({ error: '等待时长必须大于 0' });
  if (!checkFlow('waiting', task.status)) {
    return res
      .status(400)
      .json({ error: `当前状态为"${task.status}"，无法记录异常等待` });
  }
  try {
    res.json(markTaskWaiting(taskId, minutes, note || ''));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch('/tasks/:id/complete', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (!checkFlow('complete', task.status)) {
    return res
      .status(400)
      .json({ error: `当前状态为"${task.status}"，需先开始装卸作业后才能完工` });
  }
  try {
    res.json(completeTask(taskId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/stats/utilization', (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  try {
    res.json(getUtilizationStats(date));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/stats/congestion', (req: Request, res: Response) => {
  const days = Number(req.query.days) || 7;
  try {
    res.json(getCongestionStats(days));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

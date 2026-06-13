import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Driver, Forklift, Task, TaskStatus, CreateTaskPayload, Utilization } from '../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '..', '..', 'forklift.db');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

function toCamelCase<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = row[key];
  }
  return result as T;
}

function rowsToObjects<T>(columns: string[], values: unknown[][]): T[] {
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return toCamelCase<T>(obj);
  });
}

function query<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params as (string | number | null)[]);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(toCamelCase<T>(stmt.getAsObject() as Record<string, unknown>));
  }
  stmt.free();
  return results;
}

function run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params as (string | number | null)[]);
  saveDatabase();
  return { changes: db.getRowsModified(), lastInsertRowid: Number(db.exec('SELECT last_insert_rowid() as id')[0].values[0][0]) };
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: (file: string) => path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file),
  });

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
    console.log('[DB] Loaded existing database');
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDatabase();
    console.log('[DB] Created new database with seed data');
  }
}

function createTables() {
  run(`
    CREATE TABLE IF NOT EXISTS driver (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_no TEXT UNIQUE NOT NULL,
      is_hazardous_authorized INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'idle'
    )
  `);
  run(`
    CREATE TABLE IF NOT EXISTS forklift (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      max_capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available'
    )
  `);
  run(`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      container_no TEXT NOT NULL,
      container_weight REAL NOT NULL,
      is_hazardous INTEGER NOT NULL DEFAULT 0,
      hazardous_class TEXT,
      ship_schedule TEXT NOT NULL,
      yard_location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      driver_id INTEGER REFERENCES driver(id),
      forklift_id INTEGER REFERENCES forklift(id),
      assigned_at TEXT,
      arrived_at TEXT,
      loading_started_at TEXT,
      waiting_minutes INTEGER DEFAULT 0,
      completed_at TEXT,
      exception_note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function seedData() {
  const drivers = [
    ['张伟', 'D001', 1, 'idle'],
    ['李强', 'D002', 0, 'idle'],
    ['王磊', 'D003', 1, 'working'],
    ['刘洋', 'D004', 0, 'idle'],
    ['陈军', 'D005', 1, 'idle'],
  ];
  for (const d of drivers) {
    run('INSERT INTO driver (name, employee_no, is_hazardous_authorized, status) VALUES (?, ?, ?, ?)', d);
  }

  const forklifts = [
    ['FL-001', 'HELI 5T', 5, 'available'],
    ['FL-002', 'HELI 10T', 10, 'in_use'],
    ['FL-003', 'LINDE 8T', 8, 'available'],
    ['FL-004', 'HELI 5T', 5, 'available'],
    ['FL-005', 'TOYOTA 15T', 15, 'maintenance'],
  ];
  for (const f of forklifts) {
    run('INSERT INTO forklift (code, model, max_capacity, status) VALUES (?, ?, ?, ?)', f);
  }

  const now = new Date();
  const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60000).toISOString();

  run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, ship_schedule, yard_location, status, driver_id, forklift_id, assigned_at, created_at)
     VALUES (?, ?, ?, 0, ?, ?, 'assigned', 3, 2, ?, ?)`,
    ['TK20260612002', 'MSC9876543', 12.0, 'MAERSK-023 / 06-13 14:00', 'B区-01-05', iso(-40), iso(-60)]
  );

  run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, hazardous_class, ship_schedule, yard_location, status, driver_id, forklift_id, assigned_at, arrived_at, loading_started_at, completed_at, created_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, 'completed', 1, 1, ?, ?, ?, ?, ?)`,
    ['TK20260612003', 'CMAU4567890', 5.2, '3类易燃液体', 'EVERGREEN-108 / 06-15 10:00', 'A区-05-08', iso(-180), iso(-170), iso(-160), iso(-100), iso(-240)]
  );

  run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, ship_schedule, yard_location, status, created_at)
     VALUES (?, ?, ?, 0, ?, ?, 'pending', ?)`,
    ['TK20260612001', 'MSKU1234567', 8.5, 'COSCO-001 / 06-14 08:00', 'A区-03-12', iso(-30)]
  );

  run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, ship_schedule, yard_location, status, driver_id, forklift_id, assigned_at, arrived_at, created_at)
     VALUES (?, ?, ?, 0, ?, ?, 'arrived', 5, 3, ?, ?, ?)`,
    ['TK20260612004', 'OOLU7788990', 6.8, 'CMA-CGM-045 / 06-13 22:00', 'C区-02-14', iso(-120), iso(-90), iso(-130)]
  );

  run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, ship_schedule, yard_location, status, driver_id, forklift_id, assigned_at, arrived_at, loading_started_at, waiting_minutes, exception_note, created_at)
     VALUES (?, ?, ?, 0, ?, ?, 'waiting', 2, 4, ?, ?, ?, 25, '等待龙门吊就位', ?)`,
    ['TK20260612005', 'YMLU1122334', 7.3, 'ONE-077 / 06-14 02:00', 'A区-07-03', iso(-90), iso(-70), iso(-55), iso(-100)]
  );
}

export function getAllDrivers(): Driver[] {
  return query<Driver>('SELECT * FROM driver ORDER BY id');
}

export function getDriverById(id: number): Driver | undefined {
  return query<Driver>('SELECT * FROM driver WHERE id = ?', [id])[0];
}

export function getAllForklifts(): Forklift[] {
  return query<Forklift>('SELECT * FROM forklift ORDER BY id');
}

export function getTasks(status?: TaskStatus): Task[] {
  const sql = status
    ? `SELECT t.*, d.name as driver_name, f.code as forklift_code FROM task t LEFT JOIN driver d ON t.driver_id = d.id LEFT JOIN forklift f ON t.forklift_id = f.id WHERE t.status = ? ORDER BY t.created_at DESC`
    : `SELECT t.*, d.name as driver_name, f.code as forklift_code FROM task t LEFT JOIN driver d ON t.driver_id = d.id LEFT JOIN forklift f ON t.forklift_id = f.id ORDER BY t.created_at DESC`;
  return query<Task>(sql, status ? [status] : []);
}

export function getTaskById(id: number): Task | undefined {
  return query<Task>(
    `SELECT t.*, d.name as driver_name, f.code as forklift_code FROM task t
     LEFT JOIN driver d ON t.driver_id = d.id LEFT JOIN forklift f ON t.forklift_id = f.id WHERE t.id = ?`,
    [id]
  )[0];
}

export function generateTaskNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const count = query<{ n: number }>('SELECT COUNT(*) as n FROM task WHERE DATE(created_at) = DATE("now")')[0].n;
  return `TK${y}${m}${day}${String(count + 1).padStart(3, '0')}`;
}

export function createTask(payload: CreateTaskPayload & { taskNo: string }): Task {
  const result = run(
    `INSERT INTO task (task_no, container_no, container_weight, is_hazardous, hazardous_class, ship_schedule, yard_location, status, driver_id, forklift_id, assigned_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned', ?, ?, CURRENT_TIMESTAMP)`,
    [
      payload.taskNo,
      payload.containerNo,
      payload.containerWeight,
      payload.isHazardous ? 1 : 0,
      payload.hazardousClass ?? null,
      payload.shipSchedule,
      payload.yardLocation,
      payload.driverId,
      payload.forkliftId,
    ]
  );
  run(`UPDATE driver SET status = 'working' WHERE id = ?`, [payload.driverId]);
  run(`UPDATE forklift SET status = 'in_use' WHERE id = ?`, [payload.forkliftId]);
  return getTaskById(result.lastInsertRowid)!;
}

export function assignTask(taskId: number, driverId: number, forkliftId: number): Task {
  run(
    `UPDATE task SET driver_id = ?, forklift_id = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [driverId, forkliftId, taskId]
  );
  run(`UPDATE driver SET status = 'working' WHERE id = ?`, [driverId]);
  run(`UPDATE forklift SET status = 'in_use' WHERE id = ?`, [forkliftId]);
  return getTaskById(taskId)!;
}

export function acceptTask(taskId: number): Task {
  run(`UPDATE task SET status = 'assigned', assigned_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'assigned'`, [taskId]);
  return getTaskById(taskId)!;
}

export function markTaskArrived(taskId: number): Task {
  run(`UPDATE task SET status = 'arrived', arrived_at = CURRENT_TIMESTAMP WHERE id = ?`, [taskId]);
  return getTaskById(taskId)!;
}

export function markTaskLoading(taskId: number): Task {
  run(`UPDATE task SET status = 'loading', loading_started_at = CURRENT_TIMESTAMP WHERE id = ?`, [taskId]);
  return getTaskById(taskId)!;
}

export function markTaskWaiting(taskId: number, minutes: number, note: string): Task {
  run(
    `UPDATE task SET status = 'waiting', waiting_minutes = COALESCE(waiting_minutes, 0) + ?, exception_note = ? WHERE id = ?`,
    [minutes, note, taskId]
  );
  return getTaskById(taskId)!;
}

export function completeTask(taskId: number): Task {
  const task = getTaskById(taskId);
  run(`UPDATE task SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [taskId]);
  if (task?.driverId) run(`UPDATE driver SET status = 'idle' WHERE id = ?`, [task.driverId]);
  if (task?.forkliftId) run(`UPDATE forklift SET status = 'available' WHERE id = ?`, [task.forkliftId]);
  return getTaskById(taskId)!;
}

export function getUtilizationStats(date?: string): Utilization[] {
  const dateFilter = date ? `WHERE DATE(t.completed_at) = DATE('${date}')` : `WHERE t.completed_at IS NOT NULL`;
  const sql = `
    SELECT
      f.id as forklift_id,
      f.code as forklift_code,
      COALESCE(SUM(
        CAST((julianday(t.completed_at) - julianday(COALESCE(t.arrived_at, t.assigned_at))) * 1440 AS INTEGER)
        - COALESCE(t.waiting_minutes, 0)
      ), 0) as working_minutes,
      COUNT(t.id) as task_count
    FROM forklift f
    LEFT JOIN task t ON f.id = t.forklift_id ${dateFilter}
    GROUP BY f.id, f.code
    ORDER BY f.code
  `;
  const rows = query<{ forkliftId: number; forkliftCode: string; workingMinutes: number; taskCount: number }>(sql);
  const minutesPerDay = 8 * 60;
  return rows.map((r) => ({
    ...r,
    date: date || new Date().toISOString().slice(0, 10),
    idleMinutes: Math.max(0, minutesPerDay - r.workingMinutes),
    utilizationRate: Math.min(100, Math.round((r.workingMinutes / minutesPerDay) * 100)),
  }));
}

export function getCongestionStats(days: number = 7): { hour: number; date: string; taskCount: number; yard: string }[] {
  const sql = `
    SELECT
      CAST(strftime('%H', COALESCE(t.arrived_at, t.assigned_at)) AS INTEGER) as hour,
      DATE(COALESCE(t.arrived_at, t.assigned_at)) as date,
      COUNT(*) as task_count,
      substr(t.yard_location, 1, instr(t.yard_location, '区') - 1) as yard
    FROM task t
    WHERE t.created_at >= datetime('now', ?)
    GROUP BY date, hour, yard
    ORDER BY date, hour
  `;
  return query<{ hour: number; date: string; taskCount: number; yard: string }>(sql, [`-${days} days`]);
}

export function getTasksByDriver(driverId: number): Task[] {
  return query<Task>(
    `SELECT t.*, d.name as driver_name, f.code as forklift_code FROM task t
     LEFT JOIN driver d ON t.driver_id = d.id LEFT JOIN forklift f ON t.forklift_id = f.id
     WHERE t.driver_id = ? ORDER BY t.created_at DESC`,
    [driverId]
  );
}

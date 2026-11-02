import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'esecurityin_db.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==============================================================================
// TYPES & DATA STRUCTURES
// ==============================================================================

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ProjectStatus = 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
export type UserRole = 'Manager' | 'Employee';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department_id?: string;
  designation: string;
  profile_image?: string;
  joining_date?: string;
  status: 'Active' | 'Inactive';
  role: UserRole;
  access_key: string; // 4-digit PIN or unique key
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department_id?: string;
  assigned_employee_ids: string[];
  start_date: string;
  target_date?: string;
  priority: Priority;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assigned_to?: string; // employee id
  priority: Priority;
  deadline?: string;
  status: TaskStatus;
  progress: number; // 0-100
  time_spent: number; // hours
  created_at: string;
  updated_at: string;
}

export interface TaskProgressUpdate {
  id: string;
  task_id: string;
  employee_id?: string;
  employee_name: string;
  previous_progress: number;
  new_progress: number;
  work_completed: string;
  work_remaining?: string;
  challenges?: string;
  next_steps?: string;
  time_spent: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  employee_id?: string;
  employee_name: string;
  comment: string;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  task_id?: string;
  action: string;
  actor_name: string;
  details: string;
  created_at: string;
}

interface DatabaseSchema {
  employees: Employee[];
  departments: Department[];
  projects: Project[];
  tasks: Task[];
  task_progress_updates: TaskProgressUpdate[];
  task_comments: TaskComment[];
  project_activity: ProjectActivity[];
  master_access_key: string;
  last_updated: string;
}

// Master Admin/Manager Access Key
const DEFAULT_MASTER_KEY = process.env.MASTER_ACCESS_KEY || 'esecurity2026';

// The INITIAL 4 EMPLOYEES as strictly required
const INITIAL_FOUR_EMPLOYEES: Employee[] = [
  {
    id: 'emp-hardik',
    name: 'Hardik',
    employee_id: 'ESI-1001',
    department_id: 'dept-cyber',
    designation: 'Lead Cybersecurity Architect & Delivery Head',
    joining_date: '2025-01-15',
    status: 'Active',
    role: 'Manager',
    access_key: '1001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-abhishek',
    name: 'Abhishek',
    employee_id: 'ESI-1002',
    department_id: 'dept-cyber',
    designation: 'Senior Security Systems & Infrastructure Manager',
    joining_date: '2025-02-01',
    status: 'Active',
    role: 'Manager',
    access_key: '1002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-kaushik',
    name: 'Kaushik',
    employee_id: 'ESI-1003',
    department_id: 'dept-dev',
    designation: 'Full-Stack Security Software Engineer',
    joining_date: '2025-03-10',
    status: 'Active',
    role: 'Employee',
    access_key: '1003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-himanshu',
    name: 'Himanshu',
    employee_id: 'ESI-1004',
    department_id: 'dept-ops',
    designation: 'DevSecOps & Platform Automation Engineer',
    joining_date: '2025-03-15',
    status: 'Active',
    role: 'Employee',
    access_key: '1004',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// INITIAL CLEAN DEPARTMENTS
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cyber',
    name: 'Cybersecurity',
    code: 'CYBER',
    description: 'Threat Intelligence, Vulnerability Management, Red-Teaming, SOC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dept-dev',
    name: 'Development',
    code: 'DEV',
    description: 'Core Product Engineering, Microservices Architecture, Secure APIs',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dept-ops',
    name: 'Operations & DevSecOps',
    code: 'OPS',
    description: 'Cloud Infrastructure Hardening, CI/CD Pipelines, Kubernetes, SRE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dept-rd',
    name: 'Research & Labs',
    code: 'RD',
    description: 'Cryptographic Algorithms, Zero-Day Research, AI Security Models',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ==============================================================================
// DATABASE INITIALIZATION & DISK PERSISTENCE
// ==============================================================================

function initCleanDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Validate schema format
      if (Array.isArray(data.employees) && Array.isArray(data.projects) && Array.isArray(data.tasks)) {
        // If it already matches the new transformed schema, preserve it
        return data;
      }
    } catch (e) {
      console.error('[eSecurityIn] Existing database incompatible with new Project/Task schema, initializing clean state:', e);
    }
  }

  // Brand new clean state: Only the 4 required employees, clean departments, 0 demo projects, 0 demo tasks
  const cleanData: DatabaseSchema = {
    employees: INITIAL_FOUR_EMPLOYEES,
    departments: INITIAL_DEPARTMENTS,
    projects: [],
    tasks: [],
    task_progress_updates: [],
    task_comments: [],
    project_activity: [],
    master_access_key: DEFAULT_MASTER_KEY,
    last_updated: new Date().toISOString(),
  };

  saveDatabase(cleanData);
  return cleanData;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.last_updated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[eSecurityIn] Failed to persist database:', err);
  }
}

let db = initCleanDatabase();

// Optional Supabase integration handle
let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[eSecurityIn] Connected to Supabase backend:', supabaseUrl);
  } catch (err) {
    console.warn('[eSecurityIn] Supabase client init error:', err);
  }
}

// ==============================================================================
// AUTH & PERMISSION MIDDLEWARE (Without traditional login/registration)
// ==============================================================================

export interface AuthenticatedUser {
  role: UserRole;
  employee?: Employee;
  isMaster: boolean;
}

function resolveUserFromKey(key: string | undefined): AuthenticatedUser | null {
  if (!key) return null;
  const trimmed = key.trim();

  // Check master key
  if (trimmed === db.master_access_key || trimmed === DEFAULT_MASTER_KEY) {
    return {
      role: 'Manager',
      isMaster: true,
      employee: db.employees.find((e) => e.role === 'Manager') || db.employees[0],
    };
  }

  // Check employee access_key or employee_id match
  const matchedEmp = db.employees.find(
    (e) => e.status === 'Active' && (e.access_key === trimmed || e.employee_id.toLowerCase() === trimmed.toLowerCase())
  );

  if (matchedEmp) {
    return {
      role: matchedEmp.role,
      employee: matchedEmp,
      isMaster: false,
    };
  }

  return null;
}

function requireManager(req: Request, res: Response, next: NextFunction) {
  const accessKey = (req.headers['x-access-key'] as string) || (req.query.access_key as string) || req.body?.access_key;
  const user = resolveUserFromKey(accessKey);

  if (!user || user.role !== 'Manager') {
    return res.status(403).json({
      error: 'Manager authorization required. Please provide a valid Manager Passkey or switch to Manager role.',
    });
  }

  (req as any).user = user;
  next();
}

function requireEmployeeOrManager(req: Request, res: Response, next: NextFunction) {
  const accessKey = (req.headers['x-access-key'] as string) || (req.query.access_key as string) || req.body?.access_key;
  const user = resolveUserFromKey(accessKey);

  if (!user) {
    return res.status(403).json({
      error: 'Authorization key required. Please enter your Employee Passkey (e.g. 1001, 1002, 1003, 1004) to perform this action.',
    });
  }

  (req as any).user = user;
  next();
}

// ==============================================================================
// HELPER CALCULATIONS (Accurate, Real Database Metrics)
// ==============================================================================

function computeProjectProgress(projectId: string): {
  progress: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  blocked_tasks: number;
  total_hours: number;
  is_falling_behind: boolean;
  is_progressing_well: boolean;
  health_status: 'On Track' | 'At Risk' | 'Overdue' | 'Completed' | 'Not Started';
} {
  const project = db.projects.find((p) => p.id === projectId);
  const tasks = db.tasks.filter((t) => t.project_id === projectId);
  const total_tasks = tasks.length;

  if (total_tasks === 0) {
    const isCompleted = project?.status === 'Completed';
    return {
      progress: isCompleted ? 100 : 0,
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      pending_tasks: 0,
      blocked_tasks: 0,
      total_hours: 0,
      is_falling_behind: false,
      is_progressing_well: isCompleted,
      health_status: isCompleted ? 'Completed' : 'Not Started',
    };
  }

  let sumProgress = 0;
  let completed_tasks = 0;
  let in_progress_tasks = 0;
  let pending_tasks = 0;
  let blocked_tasks = 0;
  let total_hours = 0;

  tasks.forEach((t) => {
    sumProgress += t.progress || 0;
    total_hours += t.time_spent || 0;
    if (t.status === 'Completed' || t.progress === 100) completed_tasks++;
    else if (t.status === 'In Progress') in_progress_tasks++;
    else if (t.status === 'Blocked') blocked_tasks++;
    else pending_tasks++;
  });

  const progress = Math.min(100, Math.round(sumProgress / total_tasks));

  // Determine health & schedule status
  const today = new Date().toISOString().split('T')[0];
  const targetDate = project?.target_date;

  let is_falling_behind = false;
  let is_progressing_well = false;
  let health_status: 'On Track' | 'At Risk' | 'Overdue' | 'Completed' | 'Not Started' = 'On Track';

  if (progress === 100 || completed_tasks === total_tasks) {
    health_status = 'Completed';
    is_progressing_well = true;
  } else if (targetDate && targetDate < today && progress < 100) {
    health_status = 'Overdue';
    is_falling_behind = true;
  } else if (targetDate) {
    const daysLeft = Math.ceil((new Date(targetDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
    if (daysLeft <= 7 && progress < 50) {
      health_status = 'At Risk';
      is_falling_behind = true;
    } else if (blocked_tasks > 0 && progress < 40) {
      health_status = 'At Risk';
      is_falling_behind = true;
    } else if (progress >= 60) {
      health_status = 'On Track';
      is_progressing_well = true;
    }
  } else if (progress >= 50) {
    is_progressing_well = true;
  }

  return {
    progress,
    total_tasks,
    completed_tasks,
    in_progress_tasks,
    pending_tasks,
    blocked_tasks,
    total_hours: Math.round(total_hours * 10) / 10,
    is_falling_behind,
    is_progressing_well,
    health_status,
  };
}

function enrichProject(project: Project) {
  const dept = db.departments.find((d) => d.id === project.department_id);
  const metrics = computeProjectProgress(project.id);
  const assigned_employees = db.employees.filter((e) =>
    (project.assigned_employee_ids || []).includes(e.id)
  );

  return {
    ...project,
    department_name: dept?.name || 'Unassigned',
    assigned_employees,
    ...metrics,
  };
}

function enrichTask(task: Task) {
  const proj = db.projects.find((p) => p.id === task.project_id);
  const emp = db.employees.find((e) => e.id === task.assigned_to);
  const today = new Date().toISOString().split('T')[0];
  const is_overdue = !!(task.deadline && task.deadline < today && task.status !== 'Completed');

  return {
    ...task,
    project_name: proj?.name || 'Unknown Project',
    assigned_employee_name: emp?.name || 'Unassigned',
    is_overdue,
  };
}

// Log project activity record
function logActivity(projectId: string, action: string, actorName: string, details: string, taskId?: string) {
  const activity: ProjectActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    project_id: projectId,
    task_id: taskId,
    action,
    actor_name: actorName,
    details,
    created_at: new Date().toISOString(),
  };
  db.project_activity.unshift(activity);
  if (db.project_activity.length > 200) {
    db.project_activity = db.project_activity.slice(0, 200);
  }
}

// ==============================================================================
// API ROUTES
// ==============================================================================

// 1. Auth Key Verification (Role, Employee Name, Permissions)
app.post('/api/auth/verify', (req: Request, res: Response) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Access key is required' });
  }

  const user = resolveUserFromKey(key);
  if (!user) {
    return res.status(401).json({
      error: 'Invalid access key. Use your Employee PIN (e.g. 1001, 1002, 1003, 1004) or Master Key.',
    });
  }

  res.json({
    isAuthenticated: true,
    role: user.role,
    employeeId: user.employee?.id,
    employeeName: user.employee?.name,
    designation: user.employee?.designation,
    isMaster: user.isMaster,
  });
});

// 2. Main Executive Overview & Analytics
app.get('/api/overview', (req: Request, res: Response) => {
  try {
    const enrichedProjects = db.projects.map(enrichProject);
    const enrichedTasks = db.tasks.map(enrichTask);

    const total_projects = enrichedProjects.length;
    let active_projects = 0;
    let completed_projects = 0;
    let pending_projects = 0;
    let sumProjectProgress = 0;

    enrichedProjects.forEach((p) => {
      sumProjectProgress += p.progress;
      if (p.status === 'Completed' || p.progress === 100) completed_projects++;
      else if (p.status === 'In Progress') active_projects++;
      else pending_projects++;
    });

    const overall_company_completion = total_projects > 0 ? Math.round(sumProjectProgress / total_projects) : 0;

    const total_tasks = enrichedTasks.length;
    let completed_tasks = 0;
    let in_progress_tasks = 0;
    let blocked_tasks = 0;
    let pending_tasks = 0;

    enrichedTasks.forEach((t) => {
      if (t.status === 'Completed' || t.progress === 100) completed_tasks++;
      else if (t.status === 'In Progress') in_progress_tasks++;
      else if (t.status === 'Blocked') blocked_tasks++;
      else pending_tasks++;
    });

    const falling_behind_projects = enrichedProjects.filter((p) => p.is_falling_behind);
    const progressing_well_projects = enrichedProjects.filter((p) => p.is_progressing_well);

    // Department progress breakdown
    const department_progress = db.departments.map((dept) => {
      const deptProjects = enrichedProjects.filter((p) => p.department_id === dept.id);
      const deptTasks = enrichedTasks.filter((t) => {
        const p = db.projects.find((proj) => proj.id === t.project_id);
        return p?.department_id === dept.id;
      });

      const avg_progress = deptProjects.length > 0
        ? Math.round(deptProjects.reduce((sum, p) => sum + p.progress, 0) / deptProjects.length)
        : 0;

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        project_count: deptProjects.length,
        task_count: deptTasks.length,
        avg_progress,
      };
    });

    // Recent activity list
    const recent_activity = db.project_activity.slice(0, 10).map((act) => {
      const p = db.projects.find((proj) => proj.id === act.project_id);
      return {
        ...act,
        project_name: p?.name || 'Project',
      };
    });

    res.json({
      total_projects,
      active_projects,
      completed_projects,
      pending_projects,
      overall_company_completion,
      total_tasks,
      completed_tasks,
      in_progress_tasks,
      blocked_tasks,
      pending_tasks,
      falling_behind_count: falling_behind_projects.length,
      progressing_well_count: progressing_well_projects.length,
      projects: enrichedProjects,
      falling_behind_projects,
      progressing_well_projects,
      recent_activity,
      department_progress,
    });
  } catch (err) {
    console.error('Error compiling overview analytics:', err);
    res.status(500).json({ error: 'Failed to compile overview metrics' });
  }
});

// 3. Projects Endpoints
app.get('/api/projects', (req: Request, res: Response) => {
  try {
    const { department_id, status, priority, search, sort = 'newest' } = req.query;
    let list = db.projects.map(enrichProject);

    if (department_id && department_id !== 'All') {
      list = list.filter((p) => p.department_id === department_id);
    }
    if (status && status !== 'All') {
      list = list.filter((p) => p.status === status);
    }
    if (priority && priority !== 'All') {
      list = list.filter((p) => p.priority === priority);
    }
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Sort
    if (sort === 'progress_asc') list.sort((a, b) => a.progress - b.progress);
    else if (sort === 'progress_desc') list.sort((a, b) => b.progress - a.progress);
    else if (sort === 'deadline') list.sort((a, b) => (a.target_date || '9999').localeCompare(b.target_date || '9999'));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const enriched = enrichProject(project);
    const tasks = db.tasks.filter((t) => t.project_id === project.id).map(enrichTask);
    const activity = db.project_activity.filter((a) => a.project_id === project.id);

    res.json({
      ...enriched,
      tasks,
      activity,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project details' });
  }
});

app.post('/api/projects', requireManager, (req: Request, res: Response) => {
  try {
    const { name, description, department_id, assigned_employee_ids = [], start_date, target_date, priority = 'Medium', status = 'Planning' } = req.body;
    const actor = (req as any).user?.employee?.name || 'Manager';

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name is required (minimum 2 characters).' });
    }

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: description ? description.trim() : '',
      department_id: department_id || undefined,
      assigned_employee_ids: Array.isArray(assigned_employee_ids) ? assigned_employee_ids : [],
      start_date: start_date || new Date().toISOString().split('T')[0],
      target_date: target_date || undefined,
      priority: ['Low', 'Medium', 'High', 'Critical'].includes(priority) ? priority : 'Medium',
      status: ['Planning', 'Not Started', 'In Progress', 'On Hold', 'Completed'].includes(status) ? status : 'Planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.projects.unshift(newProject);
    logActivity(newProject.id, 'Project Created', actor, `Project "${newProject.name}" was initialized with priority ${newProject.priority}`);
    saveDatabase(db);

    res.status(201).json({ success: true, project: enrichProject(newProject) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', requireManager, (req: Request, res: Response) => {
  try {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const actor = (req as any).user?.employee?.name || 'Manager';
    const existing = db.projects[idx];
    const { name, description, department_id, assigned_employee_ids, start_date, target_date, priority, status } = req.body;

    const updated: Project = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      description: description !== undefined ? description.trim() : existing.description,
      department_id: department_id !== undefined ? department_id : existing.department_id,
      assigned_employee_ids: Array.isArray(assigned_employee_ids) ? assigned_employee_ids : existing.assigned_employee_ids,
      start_date: start_date || existing.start_date,
      target_date: target_date !== undefined ? target_date : existing.target_date,
      priority: priority || existing.priority,
      status: status || existing.status,
      updated_at: new Date().toISOString(),
    };

    db.projects[idx] = updated;
    logActivity(updated.id, 'Project Updated', actor, `Project details updated. Status: ${updated.status}`);
    saveDatabase(db);

    res.json({ success: true, project: enrichProject(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', requireManager, (req: Request, res: Response) => {
  try {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Cascading delete
    db.projects = db.projects.filter((p) => p.id !== req.params.id);
    const deletedTaskIds = db.tasks.filter((t) => t.project_id === req.params.id).map((t) => t.id);
    db.tasks = db.tasks.filter((t) => t.project_id !== req.params.id);
    db.task_progress_updates = db.task_progress_updates.filter((u) => !deletedTaskIds.includes(u.task_id));
    db.task_comments = db.task_comments.filter((c) => !deletedTaskIds.includes(c.task_id));
    db.project_activity = db.project_activity.filter((a) => a.project_id !== req.params.id);

    saveDatabase(db);
    res.json({ success: true, message: `Project "${project.name}" and associated tasks removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 4. Tasks Endpoints
app.get('/api/tasks', (req: Request, res: Response) => {
  try {
    const { project_id, assigned_to, status, priority, search } = req.query;
    let list = db.tasks.map(enrichTask);

    if (project_id && project_id !== 'All') {
      list = list.filter((t) => t.project_id === project_id);
    }
    if (assigned_to && assigned_to !== 'All') {
      list = list.filter((t) => t.assigned_to === assigned_to);
    }
    if (status && status !== 'All') {
      list = list.filter((t) => t.status === status);
    }
    if (priority && priority !== 'All') {
      list = list.filter((t) => t.priority === priority);
    }
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updates = db.task_progress_updates.filter((u) => u.task_id === task.id);
    const comments = db.task_comments.filter((c) => c.task_id === task.id);

    res.json({
      ...enrichTask(task),
      updates,
      comments,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve task' });
  }
});

app.post('/api/tasks', requireManager, (req: Request, res: Response) => {
  try {
    const { project_id, title, description = '', assigned_to, priority = 'Medium', deadline, status = 'Not Started', progress = 0 } = req.body;
    const actor = (req as any).user?.employee?.name || 'Manager';

    if (!project_id) return res.status(400).json({ error: 'Project ID is required.' });
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Task title is required (minimum 3 characters).' });
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id,
      title: title.trim(),
      description: description.trim(),
      assigned_to: assigned_to || undefined,
      priority: ['Low', 'Medium', 'High', 'Critical'].includes(priority) ? priority : 'Medium',
      deadline: deadline || undefined,
      status: ['Not Started', 'In Progress', 'Blocked', 'Completed'].includes(status) ? status : 'Not Started',
      progress: Math.max(0, Math.min(100, parseInt(progress, 10) || 0)),
      time_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);

    // Auto-update project status if not started
    const projIdx = db.projects.findIndex((p) => p.id === project_id);
    if (projIdx !== -1 && db.projects[projIdx].status === 'Planning') {
      db.projects[projIdx].status = 'In Progress';
      db.projects[projIdx].updated_at = new Date().toISOString();
    }

    logActivity(project_id, 'Task Created', actor, `Added task: "${newTask.title}"`, newTask.id);
    saveDatabase(db);

    res.status(201).json({ success: true, task: enrichTask(newTask) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireManager, (req: Request, res: Response) => {
  try {
    const idx = db.tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const actor = (req as any).user?.employee?.name || 'Manager';
    const existing = db.tasks[idx];
    const { title, description, assigned_to, priority, deadline, status, progress, time_spent } = req.body;

    const parsedProgress = progress !== undefined ? Math.max(0, Math.min(100, parseInt(progress, 10))) : existing.progress;
    let newStatus = status || existing.status;
    if (parsedProgress === 100) newStatus = 'Completed';
    else if (parsedProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

    const updated: Task = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      assigned_to: assigned_to !== undefined ? assigned_to : existing.assigned_to,
      priority: priority || existing.priority,
      deadline: deadline !== undefined ? deadline : existing.deadline,
      status: newStatus,
      progress: parsedProgress,
      time_spent: time_spent !== undefined ? parseFloat(time_spent) || 0 : existing.time_spent,
      updated_at: new Date().toISOString(),
    };

    db.tasks[idx] = updated;
    logActivity(updated.project_id, 'Task Updated', actor, `Updated task "${updated.title}" - Status: ${updated.status}`, updated.id);
    saveDatabase(db);

    res.json({ success: true, task: enrichTask(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireManager, (req: Request, res: Response) => {
  try {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
    db.task_progress_updates = db.task_progress_updates.filter((u) => u.task_id !== req.params.id);
    db.task_comments = db.task_comments.filter((c) => c.task_id !== req.params.id);

    saveDatabase(db);
    res.json({ success: true, message: `Task "${task.title}" deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// 5. Task Progress Update (Accessible by Employee & Manager)
app.post('/api/tasks/:id/progress', requireEmployeeOrManager, (req: Request, res: Response) => {
  try {
    const taskIdx = db.tasks.findIndex((t) => t.id === req.params.id);
    if (taskIdx === -1) return res.status(404).json({ error: 'Task not found' });

    const task = db.tasks[taskIdx];
    const user = (req as any).user as AuthenticatedUser;
    const actorName = user.employee?.name || 'Staff Member';

    const {
      progress,
      work_completed,
      work_remaining,
      challenges,
      next_steps,
      time_spent = 0,
      status,
    } = req.body;

    if (!work_completed || typeof work_completed !== 'string' || work_completed.trim().length < 3) {
      return res.status(400).json({ error: 'Please describe the work completed in this progress update.' });
    }

    const previous_progress = task.progress || 0;
    const new_progress = progress !== undefined ? Math.max(0, Math.min(100, parseInt(progress, 10))) : previous_progress;

    let computedStatus = status || task.status;
    if (new_progress === 100) computedStatus = 'Completed';
    else if (new_progress > 0 && computedStatus === 'Not Started') computedStatus = 'In Progress';
    if (challenges && challenges.trim().length > 3 && status === 'Blocked') computedStatus = 'Blocked';

    const additionalHours = parseFloat(time_spent) || 0;
    const updatedTimeSpent = Math.round(((task.time_spent || 0) + additionalHours) * 10) / 10;

    // Update task
    db.tasks[taskIdx] = {
      ...task,
      progress: new_progress,
      status: computedStatus,
      time_spent: updatedTimeSpent,
      updated_at: new Date().toISOString(),
    };

    // Log progress update record
    const updateRecord: TaskProgressUpdate = {
      id: `tpu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: task.id,
      employee_id: user.employee?.id,
      employee_name: actorName,
      previous_progress,
      new_progress,
      work_completed: work_completed.trim(),
      work_remaining: work_remaining ? work_remaining.trim() : undefined,
      challenges: challenges ? challenges.trim() : undefined,
      next_steps: next_steps ? next_steps.trim() : undefined,
      time_spent: additionalHours,
      created_at: new Date().toISOString(),
    };

    db.task_progress_updates.unshift(updateRecord);

    logActivity(
      task.project_id,
      'Progress Updated',
      actorName,
      `Task "${task.title}" progress updated: ${previous_progress}% → ${new_progress}%. Work: ${work_completed.trim().substring(0, 80)}`,
      task.id
    );

    saveDatabase(db);

    res.status(201).json({
      success: true,
      message: 'Task progress update recorded successfully.',
      task: enrichTask(db.tasks[taskIdx]),
      update: updateRecord,
      project_metrics: computeProjectProgress(task.project_id),
    });
  } catch (err) {
    console.error('Error updating task progress:', err);
    res.status(500).json({ error: 'Failed to record task progress' });
  }
});

// 6. Task Comments
app.post('/api/tasks/:id/comments', requireEmployeeOrManager, (req: Request, res: Response) => {
  try {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const user = (req as any).user as AuthenticatedUser;
    const { comment } = req.body;
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const newComment: TaskComment = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: task.id,
      employee_id: user.employee?.id,
      employee_name: user.employee?.name || 'Staff Member',
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    db.task_comments.push(newComment);
    saveDatabase(db);

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 7. Employees Endpoints (Initial 4: Hardik, Abhishek, Kaushik, Himanshu + Dynamic Additions)
app.get('/api/employees', (req: Request, res: Response) => {
  try {
    const enriched = db.employees.map((emp) => {
      const dept = db.departments.find((d) => d.id === emp.department_id);
      const assignedTasks = db.tasks.filter((t) => t.assigned_to === emp.id);
      const total_tasks = assignedTasks.length;
      let completed_tasks = 0;
      let in_progress_tasks = 0;
      let blocked_tasks = 0;
      let total_hours = 0;
      let sumProgress = 0;

      assignedTasks.forEach((t) => {
        sumProgress += t.progress || 0;
        total_hours += t.time_spent || 0;
        if (t.status === 'Completed' || t.progress === 100) completed_tasks++;
        else if (t.status === 'In Progress') in_progress_tasks++;
        else if (t.status === 'Blocked') blocked_tasks++;
      });

      const avg_progress = total_tasks > 0 ? Math.round(sumProgress / total_tasks) : 0;

      // Notice: Do NOT leak access_key in list responses
      const { access_key, ...safeEmp } = emp;

      return {
        ...safeEmp,
        department_name: dept?.name || 'Unassigned',
        total_tasks,
        completed_tasks,
        in_progress_tasks,
        blocked_tasks,
        avg_progress,
        total_hours: Math.round(total_hours * 10) / 10,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employees' });
  }
});

app.post('/api/employees', requireManager, (req: Request, res: Response) => {
  try {
    const { name, employee_id, department_id, designation, profile_image, joining_date, role = 'Employee', access_key, status = 'Active' } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Employee name is required (minimum 2 characters).' });
    }
    if (!employee_id || typeof employee_id !== 'string') {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }
    if (!designation || typeof designation !== 'string') {
      return res.status(400).json({ error: 'Designation is required.' });
    }

    const trimmedEmpId = employee_id.trim();
    if (db.employees.some((e) => e.employee_id.toLowerCase() === trimmedEmpId.toLowerCase())) {
      return res.status(409).json({ error: 'An employee with this Employee ID already exists.' });
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      employee_id: trimmedEmpId,
      department_id: department_id || undefined,
      designation: designation.trim(),
      profile_image: profile_image ? profile_image.trim() : undefined,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      role: role === 'Manager' ? 'Manager' : 'Employee',
      access_key: access_key ? access_key.trim() : Math.floor(1000 + Math.random() * 9000).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.employees.push(newEmp);
    saveDatabase(db);

    const { access_key: _, ...safeEmp } = newEmp;
    res.status(201).json({ success: true, employee: safeEmp });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

app.put('/api/employees/:id', requireManager, (req: Request, res: Response) => {
  try {
    const idx = db.employees.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    const existing = db.employees[idx];
    const { name, employee_id, department_id, designation, profile_image, joining_date, role, status, access_key } = req.body;

    const updated: Employee = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      employee_id: employee_id !== undefined ? employee_id.trim() : existing.employee_id,
      department_id: department_id !== undefined ? department_id : existing.department_id,
      designation: designation !== undefined ? designation.trim() : existing.designation,
      profile_image: profile_image !== undefined ? profile_image : existing.profile_image,
      joining_date: joining_date !== undefined ? joining_date : existing.joining_date,
      role: role !== undefined ? role : existing.role,
      status: status !== undefined ? status : existing.status,
      access_key: access_key !== undefined ? access_key.trim() : existing.access_key,
      updated_at: new Date().toISOString(),
    };

    db.employees[idx] = updated;
    saveDatabase(db);

    const { access_key: _, ...safeEmp } = updated;
    res.json({ success: true, employee: safeEmp });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', requireManager, (req: Request, res: Response) => {
  try {
    const emp = db.employees.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    // Safety: disallow deleting if it is the only remaining manager
    const managers = db.employees.filter((e) => e.role === 'Manager');
    if (emp.role === 'Manager' && managers.length <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last remaining Manager.' });
    }

    db.employees = db.employees.filter((e) => e.id !== req.params.id);
    // Unassign tasks assigned to this employee
    db.tasks.forEach((t) => {
      if (t.assigned_to === req.params.id) t.assigned_to = undefined;
    });

    saveDatabase(db);
    res.json({ success: true, message: `Employee "${emp.name}" removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove employee' });
  }
});

// 8. Departments Endpoints
app.get('/api/departments', (req: Request, res: Response) => {
  try {
    const list = db.departments.map((dept) => {
      const deptProjects = db.projects.filter((p) => p.department_id === dept.id);
      const deptTasks = db.tasks.filter((t) => {
        const p = db.projects.find((proj) => proj.id === t.project_id);
        return p?.department_id === dept.id;
      });

      const avg_progress = deptProjects.length > 0
        ? Math.round(deptProjects.reduce((sum, p) => sum + computeProjectProgress(p.id).progress, 0) / deptProjects.length)
        : 0;

      return {
        ...dept,
        project_count: deptProjects.length,
        task_count: deptTasks.length,
        avg_progress,
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve departments' });
  }
});

app.post('/api/departments', requireManager, (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const trimmedCode = (code || name.substring(0, 4)).trim().toUpperCase();
    if (db.departments.some((d) => d.code.toUpperCase() === trimmedCode)) {
      return res.status(409).json({ error: 'Department code already in use.' });
    }

    const newDept: Department = {
      id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      code: trimmedCode,
      description: description ? description.trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.departments.push(newDept);
    saveDatabase(db);

    res.status(201).json({ success: true, department: newDept });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create department' });
  }
});

app.put('/api/departments/:id', requireManager, (req: Request, res: Response) => {
  try {
    const idx = db.departments.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Department not found' });

    const existing = db.departments[idx];
    const { name, code, description } = req.body;

    const updated: Department = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      code: code !== undefined ? code.trim().toUpperCase() : existing.code,
      description: description !== undefined ? description.trim() : existing.description,
      updated_at: new Date().toISOString(),
    };

    db.departments[idx] = updated;
    saveDatabase(db);

    res.json({ success: true, department: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

app.delete('/api/departments/:id', requireManager, (req: Request, res: Response) => {
  try {
    const hasProjects = db.projects.some((p) => p.department_id === req.params.id);
    if (hasProjects) {
      return res.status(400).json({ error: 'Cannot delete department with active linked projects. Reassign projects first.' });
    }

    db.departments = db.departments.filter((d) => d.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true, message: 'Department removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// 9. Clean Database Baseline (Clean state with initial 4 employees, 0 demo projects)
app.post('/api/database/clean-baseline', requireManager, (req: Request, res: Response) => {
  try {
    db = {
      employees: INITIAL_FOUR_EMPLOYEES,
      departments: INITIAL_DEPARTMENTS,
      projects: [],
      tasks: [],
      task_progress_updates: [],
      task_comments: [],
      project_activity: [],
      master_access_key: DEFAULT_MASTER_KEY,
      last_updated: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json({
      success: true,
      message: 'Database reset to clean state with 4 initial employees and 0 demo projects.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// 10. Database Backup Download
app.get('/api/database/backup', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="esecurityin_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// ==============================================================================
// VITE STATIC & DEV SERVER INTEGRATION
// ==============================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[eSecurityIn] Project Management Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[eSecurityIn] Server startup failed:', err);
  process.exit(1);
});

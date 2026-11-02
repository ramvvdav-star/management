import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Department,
  Employee,
  Project,
  Task,
  TaskProgressUpdate,
  TaskComment,
  ProjectActivity,
  OverviewStats,
  UserRole,
  Priority,
  ProjectStatus,
  TaskStatus,
} from './types';

// ==============================================================================
// INITIAL 4 EMPLOYEES & CLEAN DEPARTMENTS BASELINE
// ==============================================================================

export const INITIAL_FOUR_EMPLOYEES: Employee[] = [
  {
    id: 'emp-hardik',
    name: 'Hardik',
    employee_id: 'ESI-1001',
    department_id: 'dept-cyber',
    department_name: 'Cybersecurity',
    designation: 'Lead Cybersecurity Architect & Delivery Head',
    profile_image: '',
    joining_date: '2025-01-15',
    status: 'Active',
    role: 'Manager',
    access_key: '1001',
    created_at: new Date('2025-01-15').toISOString(),
    updated_at: new Date('2025-01-15').toISOString(),
  },
  {
    id: 'emp-abhishek',
    name: 'Abhishek',
    employee_id: 'ESI-1002',
    department_id: 'dept-cyber',
    department_name: 'Cybersecurity',
    designation: 'Senior Security Systems & Infrastructure Manager',
    profile_image: '',
    joining_date: '2025-02-01',
    status: 'Active',
    role: 'Manager',
    access_key: '1002',
    created_at: new Date('2025-02-01').toISOString(),
    updated_at: new Date('2025-02-01').toISOString(),
  },
  {
    id: 'emp-kaushik',
    name: 'Kaushik',
    employee_id: 'ESI-1003',
    department_id: 'dept-dev',
    department_name: 'Development',
    designation: 'Full-Stack Security Software Engineer',
    profile_image: '',
    joining_date: '2025-03-10',
    status: 'Active',
    role: 'Employee',
    access_key: '1003',
    created_at: new Date('2025-03-10').toISOString(),
    updated_at: new Date('2025-03-10').toISOString(),
  },
  {
    id: 'emp-himanshu',
    name: 'Himanshu',
    employee_id: 'ESI-1004',
    department_id: 'dept-ops',
    department_name: 'Operations & DevSecOps',
    designation: 'DevSecOps & Platform Automation Engineer',
    profile_image: '',
    joining_date: '2025-03-15',
    status: 'Active',
    role: 'Employee',
    access_key: '1004',
    created_at: new Date('2025-03-15').toISOString(),
    updated_at: new Date('2025-03-15').toISOString(),
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cyber',
    name: 'Cybersecurity',
    code: 'CYBER',
    description: 'Threat Intelligence, Vulnerability Assessment, PenTesting, SOC Operations',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'dept-dev',
    name: 'Development',
    code: 'DEV',
    description: 'Core Product Engineering, Microservices Architecture, Secure APIs',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'dept-ops',
    name: 'Operations & DevSecOps',
    code: 'OPS',
    description: 'Cloud Infrastructure Hardening, CI/CD Pipelines, Kubernetes, SRE',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'dept-rd',
    name: 'Research & Labs',
    code: 'RD',
    description: 'Cryptographic Algorithms, Zero-Day Research, AI Security Models',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString(),
  },
];

export interface ClientDatabaseState {
  departments: Department[];
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  task_progress_updates: TaskProgressUpdate[];
  task_comments: TaskComment[];
  project_activity: ProjectActivity[];
  master_access_key: string;
  last_updated: string;
}

const STORAGE_KEY = 'esecurityin_local_db_v2';
const SUPABASE_CONFIG_KEY = 'esecurityin_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Read saved Supabase configuration from environment or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {}

  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  _supabaseClient = null; // force recreation
}

let _supabaseClient: SupabaseClient | null = null;

export function getDirectSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      _supabaseClient = createClient(config.url, config.anonKey);
      return _supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

// Get or initialize clean local state
export function getLocalDB(): ClientDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.employees) && data.employees.length > 0) {
        return data;
      }
    }
  } catch {}

  // Fallback to initial baseline
  const baseline: ClientDatabaseState = {
    departments: INITIAL_DEPARTMENTS,
    employees: INITIAL_FOUR_EMPLOYEES,
    projects: [],
    tasks: [],
    task_progress_updates: [],
    task_comments: [],
    project_activity: [],
    master_access_key: '9999',
    last_updated: new Date().toISOString(),
  };

  saveLocalDB(baseline);
  return baseline;
}

export function saveLocalDB(data: ClientDatabaseState) {
  data.last_updated = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Reset strictly to the 4 initial employees and 0 projects
export function resetLocalBaseline(): ClientDatabaseState {
  const cleanState: ClientDatabaseState = {
    departments: INITIAL_DEPARTMENTS,
    employees: INITIAL_FOUR_EMPLOYEES,
    projects: [],
    tasks: [],
    task_progress_updates: [],
    task_comments: [],
    project_activity: [],
    master_access_key: '9999',
    last_updated: new Date().toISOString(),
  };
  saveLocalDB(cleanState);
  return cleanState;
}

// ==============================================================================
// COMPUTED PROJECT METRICS ENGINE
// ==============================================================================

export function enrichProject(project: Project, tasks: Task[], employees: Employee[], departments: Department[]): Project {
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const total = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = projectTasks.filter((t) => t.status === 'In Progress').length;
  const pending = projectTasks.filter((t) => t.status === 'Not Started').length;
  const blocked = projectTasks.filter((t) => t.status === 'Blocked').length;
  const totalHours = projectTasks.reduce((acc, t) => acc + (Number(t.time_spent) || 0), 0);

  let progress = 0;
  if (total > 0) {
    const sumProgress = projectTasks.reduce((acc, t) => acc + (Number(t.progress) || 0), 0);
    progress = Math.round(sumProgress / total);
  }

  let health_status: 'On Track' | 'At Risk' | 'Overdue' | 'Completed' | 'Not Started' = 'Not Started';
  const now = new Date();
  const targetDate = project.target_date ? new Date(project.target_date) : null;
  const isOverdue = targetDate ? targetDate < now && progress < 100 : false;

  if (progress === 100 || project.status === 'Completed') {
    health_status = 'Completed';
  } else if (isOverdue) {
    health_status = 'Overdue';
  } else if (blocked > 0 || (targetDate && targetDate.getTime() - now.getTime() < 3 * 24 * 3600 * 1000 && progress < 70)) {
    health_status = 'At Risk';
  } else if (progress > 0 || inProgress > 0) {
    health_status = 'On Track';
  }

  const dept = departments.find((d) => d.id === project.department_id);
  const assigned = employees.filter((e) => (project.assigned_employee_ids || []).includes(e.id));

  return {
    ...project,
    department_name: dept ? dept.name : undefined,
    assigned_employees: assigned,
    progress,
    total_tasks: total,
    completed_tasks: completed,
    in_progress_tasks: inProgress,
    pending_tasks: pending,
    blocked_tasks: blocked,
    total_hours: totalHours,
    is_falling_behind: health_status === 'At Risk' || health_status === 'Overdue',
    is_progressing_well: health_status === 'On Track' && progress >= 40,
    health_status,
  };
}

export function enrichTask(task: Task, projects: Project[], employees: Employee[]): Task {
  const prj = projects.find((p) => p.id === task.project_id);
  const emp = employees.find((e) => e.id === task.assigned_to);
  const now = new Date();
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const is_overdue = deadlineDate ? deadlineDate < now && task.status !== 'Completed' : false;

  return {
    ...task,
    project_name: prj ? prj.name : 'Unknown Project',
    assigned_employee_name: emp ? emp.name : 'Unassigned',
    is_overdue,
  };
}

export function calculateOverview(db: ClientDatabaseState): OverviewStats {
  const enrichedProjects = db.projects.map((p) => enrichProject(p, db.tasks, db.employees, db.departments));
  const enrichedTasks = db.tasks.map((t) => enrichTask(t, db.projects, db.employees));

  const total_projects = enrichedProjects.length;
  const active_projects = enrichedProjects.filter((p) => p.status === 'In Progress').length;
  const completed_projects = enrichedProjects.filter((p) => p.status === 'Completed').length;
  const pending_projects = enrichedProjects.filter((p) => p.status === 'Not Started' || p.status === 'Planning').length;

  let overall_company_completion = 0;
  if (total_projects > 0) {
    overall_company_completion = Math.round(enrichedProjects.reduce((acc, p) => acc + p.progress, 0) / total_projects);
  }

  const total_tasks = enrichedTasks.length;
  const completed_tasks = enrichedTasks.filter((t) => t.status === 'Completed').length;
  const in_progress_tasks = enrichedTasks.filter((t) => t.status === 'In Progress').length;
  const pending_tasks = enrichedTasks.filter((t) => t.status === 'Not Started').length;
  const blocked_tasks = enrichedTasks.filter((t) => t.status === 'Blocked').length;

  const falling_behind_projects = enrichedProjects.filter((p) => p.is_falling_behind);
  const progressing_well_projects = enrichedProjects.filter((p) => p.is_progressing_well);

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

  const recent_activity = db.project_activity.slice(0, 15).map((act) => {
    const p = db.projects.find((proj) => proj.id === act.project_id);
    return {
      ...act,
      project_name: p?.name || 'Project',
    };
  });

  return {
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
  };
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ProjectStatus = 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
export type UserRole = 'Manager' | 'Employee';
export type EmployeeStatus = 'Active' | 'Inactive';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
  project_count?: number;
  task_count?: number;
  avg_progress?: number;
}

export interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department_id?: string;
  department_name?: string;
  designation: string;
  profile_image?: string;
  joining_date?: string;
  status: EmployeeStatus;
  role: UserRole;
  access_key?: string; // used for PIN/Key authentication
  created_at: string;
  updated_at: string;
  // Computed metrics
  total_tasks?: number;
  completed_tasks?: number;
  in_progress_tasks?: number;
  blocked_tasks?: number;
  avg_progress?: number;
  total_hours?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department_id?: string;
  department_name?: string;
  assigned_employee_ids: string[];
  assigned_employees?: Employee[];
  start_date: string;
  target_date?: string;
  priority: Priority;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  // Computed metrics from actual tasks
  progress: number; // 0-100 calculated from tasks
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number; // Not Started
  blocked_tasks: number;
  total_hours: number;
  is_falling_behind: boolean;
  is_progressing_well: boolean;
  health_status: 'On Track' | 'At Risk' | 'Overdue' | 'Completed' | 'Not Started';
}

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  assigned_to?: string;
  assigned_employee_name?: string;
  priority: Priority;
  deadline?: string;
  status: TaskStatus;
  progress: number; // 0-100
  time_spent: number; // hours
  is_overdue?: boolean;
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
  project_name?: string;
  task_id?: string;
  action: string;
  actor_name: string;
  details: string;
  created_at: string;
}

export interface DepartmentProgressItem {
  id: string;
  name: string;
  code: string;
  project_count: number;
  task_count: number;
  avg_progress: number;
}

export interface OverviewStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  pending_projects: number;
  overall_company_completion: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  pending_tasks: number;
  falling_behind_count: number;
  progressing_well_count: number;
  projects: Project[];
  falling_behind_projects: Project[];
  progressing_well_projects: Project[];
  recent_activity: ProjectActivity[];
  department_progress: DepartmentProgressItem[];
}

export interface AuthSession {
  role: UserRole;
  employeeId?: string;
  employeeName?: string;
  isAuthenticated: boolean;
  accessKey?: string;
}

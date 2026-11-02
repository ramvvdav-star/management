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

// Helper for passing access key in headers
function getHeaders(accessKey?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (accessKey) {
    headers['X-Access-Key'] = accessKey;
  }
  return headers;
}

// 1. Auth & Verification
export async function verifyAccessKey(key: string): Promise<{
  isAuthenticated: boolean;
  role: UserRole;
  employeeId?: string;
  employeeName?: string;
  designation?: string;
  isMaster: boolean;
}> {
  const res = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid access key');
  return data;
}

// 2. Overview Analytics
export async function fetchOverview(): Promise<OverviewStats> {
  const res = await fetch('/api/overview');
  if (!res.ok) throw new Error('Failed to fetch overview analytics');
  return res.json();
}

// 3. Projects API
export interface FetchProjectsParams {
  department_id?: string;
  status?: string;
  priority?: string;
  search?: string;
  sort?: string;
}

export async function fetchProjects(params: FetchProjectsParams = {}): Promise<Project[]> {
  const query = new URLSearchParams();
  if (params.department_id && params.department_id !== 'All') query.set('department_id', params.department_id);
  if (params.status && params.status !== 'All') query.set('status', params.status);
  if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);

  const res = await fetch(`/api/projects?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProjectDetails(id: string): Promise<Project & { tasks: Task[]; activity: ProjectActivity[] }> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project details');
  return res.json();
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  department_id?: string;
  assigned_employee_ids?: string[];
  start_date?: string;
  target_date?: string;
  priority?: Priority;
  status?: ProjectStatus;
}

export async function createProject(payload: CreateProjectPayload, accessKey?: string): Promise<{ success: boolean; project: Project }> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create project');
  return data;
}

export async function updateProject(id: string, payload: Partial<CreateProjectPayload>, accessKey?: string): Promise<{ success: boolean; project: Project }> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update project');
  return data;
}

export async function deleteProject(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete project');
  return data;
}

// 4. Tasks API
export interface FetchTasksParams {
  project_id?: string;
  assigned_to?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export async function fetchTasks(params: FetchTasksParams = {}): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params.project_id && params.project_id !== 'All') query.set('project_id', params.project_id);
  if (params.assigned_to && params.assigned_to !== 'All') query.set('assigned_to', params.assigned_to);
  if (params.status && params.status !== 'All') query.set('status', params.status);
  if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`/api/tasks?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchTaskDetails(id: string): Promise<Task & { updates: TaskProgressUpdate[]; comments: TaskComment[] }> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error('Failed to fetch task details');
  return res.json();
}

export interface CreateTaskPayload {
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: Priority;
  deadline?: string;
  status?: TaskStatus;
  progress?: number;
}

export async function createTask(payload: CreateTaskPayload, accessKey?: string): Promise<{ success: boolean; task: Task }> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create task');
  return data;
}

export async function updateTask(id: string, payload: Partial<CreateTaskPayload & { time_spent?: number }>, accessKey?: string): Promise<{ success: boolean; task: Task }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to edit task');
  return data;
}

export async function deleteTask(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete task');
  return data;
}

// 5. Task Progress Update Submission
export interface SubmitTaskProgressPayload {
  progress: number;
  work_completed: string;
  work_remaining?: string;
  challenges?: string;
  next_steps?: string;
  time_spent: number;
  status?: TaskStatus;
}

export async function submitTaskProgress(
  taskId: string,
  payload: SubmitTaskProgressPayload,
  accessKey?: string
): Promise<{ success: boolean; message: string; task: Task; update: TaskProgressUpdate }> {
  const res = await fetch(`/api/tasks/${taskId}/progress`, {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit progress update');
  return data;
}

// 6. Task Comments
export async function addTaskComment(taskId: string, comment: string, accessKey?: string): Promise<{ success: boolean; comment: TaskComment }> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify({ comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add comment');
  return data;
}

// 7. Employees API
export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

export interface CreateEmployeePayload {
  name: string;
  employee_id: string;
  department_id?: string;
  designation: string;
  profile_image?: string;
  joining_date?: string;
  role?: UserRole;
  access_key?: string;
  status?: 'Active' | 'Inactive';
}

export async function createEmployee(payload: CreateEmployeePayload, accessKey?: string): Promise<{ success: boolean; employee: Employee }> {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create employee');
  return data;
}

export async function updateEmployee(id: string, payload: Partial<CreateEmployeePayload>, accessKey?: string): Promise<{ success: boolean; employee: Employee }> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update employee');
  return data;
}

export async function deleteEmployee(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove employee');
  return data;
}

// 8. Departments API
export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch('/api/departments');
  if (!res.ok) throw new Error('Failed to fetch departments');
  return res.json();
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
  description?: string;
}

export async function createDepartment(payload: CreateDepartmentPayload, accessKey?: string): Promise<{ success: boolean; department: Department }> {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create department');
  return data;
}

export async function updateDepartment(id: string, payload: CreateDepartmentPayload, accessKey?: string): Promise<{ success: boolean; department: Department }> {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update department');
  return data;
}

export async function deleteDepartment(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete department');
  return data;
}

// 9. Reset to Clean Baseline
export async function resetCleanBaseline(accessKey?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/database/clean-baseline', {
    method: 'POST',
    headers: getHeaders(accessKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset clean baseline');
  return data;
}

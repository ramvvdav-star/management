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
import {
  getLocalDB,
  saveLocalDB,
  resetLocalBaseline,
  enrichProject,
  enrichTask,
  calculateOverview,
  getDirectSupabaseClient,
  INITIAL_FOUR_EMPLOYEES,
  INITIAL_DEPARTMENTS,
} from './clientStorage';

// Tracks whether the backend Express /api is healthy or if we are running in static/serverless Vercel fallback mode
let backendReachable: boolean | null = null;

// Safe API Fetcher: Never throws JSON parse errors on HTML 404 pages (Vercel edge responses)
async function requestApi<T>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (backendReachable === false) {
    return { ok: false, error: 'Static host mode (backend offline)' };
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (like Vercel "The page could not be found" 404 page)
    if (!contentType.includes('application/json')) {
      backendReachable = false;
      return { ok: false, error: `Backend returned non-JSON (${res.status}). Switching to in-browser/Supabase engine.` };
    }

    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.error || `HTTP error ${res.status}` };
    }

    backendReachable = true;
    return { ok: true, data: json };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    backendReachable = false;
    return { ok: false, error: message };
  }
}

function getHeaders(accessKey?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (accessKey) {
    headers['X-Access-Key'] = accessKey;
  }
  return headers;
}

// Background sync helper for Supabase Postgrest queries
function syncSupabase(promiseLike: PromiseLike<unknown>) {
  Promise.resolve(promiseLike).catch((err: unknown) => {
    console.warn('Supabase sync background notice:', err);
  });
}

// ==============================================================================
// 1. Auth & Verification
// ==============================================================================

export async function verifyAccessKey(key: string): Promise<{
  isAuthenticated: boolean;
  role: UserRole;
  employeeId?: string;
  employeeName?: string;
  designation?: string;
  isMaster: boolean;
}> {
  const result = await requestApi<{
    isAuthenticated: boolean;
    role: UserRole;
    employeeId?: string;
    employeeName?: string;
    designation?: string;
    isMaster: boolean;
  }>('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  // Fallback: Verify against client database & initial 4 core staff
  const db = getLocalDB();
  const trimmedKey = (key || '').trim();

  if (trimmedKey === db.master_access_key || trimmedKey === '9999' || trimmedKey === 'admin') {
    return {
      isAuthenticated: true,
      role: 'Manager',
      isMaster: true,
      employeeName: 'Executive Admin',
      designation: 'Security Director',
    };
  }

  const emp = db.employees.find((e) => e.access_key === trimmedKey || e.employee_id === trimmedKey);
  if (emp && emp.status === 'Active') {
    return {
      isAuthenticated: true,
      role: emp.role,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      isMaster: false,
    };
  }

  throw new Error('Invalid Access Key or PIN. For testing: Hardik (1001), Abhishek (1002), Kaushik (1003), Himanshu (1004), Master (9999)');
}

// ==============================================================================
// 2. Overview Analytics
// ==============================================================================

export async function fetchOverview(): Promise<OverviewStats> {
  const result = await requestApi<OverviewStats>('/api/overview');
  if (result.ok && result.data) {
    return result.data;
  }

  // Direct Supabase or Local Client Fallback
  const supabase = getDirectSupabaseClient();
  if (supabase) {
    try {
      const [pRes, tRes, eRes, dRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('departments').select('*'),
      ]);

      if (!pRes.error && !tRes.error && !eRes.error && !dRes.error) {
        const db = getLocalDB();
        db.projects = pRes.data || [];
        db.tasks = tRes.data || [];
        db.employees = (eRes.data && eRes.data.length > 0) ? eRes.data : INITIAL_FOUR_EMPLOYEES;
        db.departments = (dRes.data && dRes.data.length > 0) ? dRes.data : INITIAL_DEPARTMENTS;
        saveLocalDB(db);
        return calculateOverview(db);
      }
    } catch (e) {
      console.warn('Supabase overview query fallback to local:', e);
    }
  }

  const db = getLocalDB();
  return calculateOverview(db);
}

// ==============================================================================
// 3. Projects API
// ==============================================================================

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

  const result = await requestApi<Project[]>(`/api/projects?${query.toString()}`);
  if (result.ok && result.data) {
    return result.data;
  }

  // Fallback client query
  const supabase = getDirectSupabaseClient();
  const db = getLocalDB();

  if (supabase) {
    try {
      let q = supabase.from('projects').select('*');
      if (params.department_id && params.department_id !== 'All') q = q.eq('department_id', params.department_id);
      if (params.status && params.status !== 'All') q = q.eq('status', params.status);
      if (params.priority && params.priority !== 'All') q = q.eq('priority', params.priority);
      if (params.search) q = q.ilike('name', `%${params.search}%`);

      const { data, error } = await q;
      if (!error && data) {
        db.projects = data;
        saveLocalDB(db);
      }
    } catch {}
  }

  let list = db.projects.map((p) => enrichProject(p, db.tasks, db.employees, db.departments));

  if (params.department_id && params.department_id !== 'All') {
    list = list.filter((p) => p.department_id === params.department_id);
  }
  if (params.status && params.status !== 'All') {
    list = list.filter((p) => p.status === params.status);
  }
  if (params.priority && params.priority !== 'All') {
    list = list.filter((p) => p.priority === params.priority);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
  }

  if (params.sort === 'priority') {
    const order: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    list.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
  } else if (params.sort === 'progress') {
    list.sort((a, b) => b.progress - a.progress);
  } else if (params.sort === 'deadline') {
    list.sort((a, b) => new Date(a.target_date || '9999').getTime() - new Date(b.target_date || '9999').getTime());
  } else {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return list;
}

export async function fetchProjectDetails(id: string): Promise<Project & { tasks: Task[]; activity: ProjectActivity[] }> {
  const result = await requestApi<Project & { tasks: Task[]; activity: ProjectActivity[] }>(`/api/projects/${id}`);
  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const rawProject = db.projects.find((p) => p.id === id);
  if (!rawProject) throw new Error('Project not found');

  const project = enrichProject(rawProject, db.tasks, db.employees, db.departments);
  const tasks = db.tasks.filter((t) => t.project_id === id).map((t) => enrichTask(t, db.projects, db.employees));
  const activity = db.project_activity.filter((a) => a.project_id === id);

  return {
    ...project,
    tasks,
    activity,
  };
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
  const result = await requestApi<{ success: boolean; project: Project }>('/api/projects', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  // Client Fallback
  const db = getLocalDB();
  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: payload.name.trim(),
    description: (payload.description || '').trim(),
    department_id: payload.department_id || undefined,
    assigned_employee_ids: payload.assigned_employee_ids || [],
    start_date: payload.start_date || new Date().toISOString().split('T')[0],
    target_date: payload.target_date || undefined,
    priority: payload.priority || 'Medium',
    status: payload.status || 'In Progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress: 0,
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    pending_tasks: 0,
    blocked_tasks: 0,
    total_hours: 0,
    is_falling_behind: false,
    is_progressing_well: false,
    health_status: 'Not Started',
  };

  db.projects.unshift(newProject);

  db.project_activity.unshift({
    id: `act-${Date.now()}`,
    project_id: newProject.id,
    action: 'Project Created',
    actor_name: accessKey === '1001' ? 'Hardik' : accessKey === '1002' ? 'Abhishek' : 'Manager',
    details: `Initiated enterprise project "${newProject.name}"`,
    created_at: new Date().toISOString(),
  });

  saveLocalDB(db);

  // Sync to direct Supabase if configured
  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('projects').insert([{
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        department_id: newProject.department_id,
        assigned_employee_ids: newProject.assigned_employee_ids,
        start_date: newProject.start_date,
        target_date: newProject.target_date,
        priority: newProject.priority,
        status: newProject.status,
      }])
    );
  }

  const enriched = enrichProject(newProject, db.tasks, db.employees, db.departments);
  return { success: true, project: enriched };
}

export async function updateProject(id: string, payload: Partial<CreateProjectPayload>, accessKey?: string): Promise<{ success: boolean; project: Project }> {
  const result = await requestApi<{ success: boolean; project: Project }>(`/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');

  db.projects[idx] = {
    ...db.projects[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  };

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('projects').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    );
  }

  const enriched = enrichProject(db.projects[idx], db.tasks, db.employees, db.departments);
  return { success: true, project: enriched };
}

export async function deleteProject(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const result = await requestApi<{ success: boolean; message: string }>(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.tasks = db.tasks.filter((t) => t.project_id !== id);
  db.project_activity = db.project_activity.filter((a) => a.project_id !== id);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('projects').delete().eq('id', id));
  }

  return { success: true, message: 'Project removed successfully' };
}

// ==============================================================================
// 4. Tasks API
// ==============================================================================

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

  const result = await requestApi<Task[]>(`/api/tasks?${query.toString()}`);
  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const supabase = getDirectSupabaseClient();

  if (supabase) {
    try {
      let q = supabase.from('tasks').select('*');
      if (params.project_id && params.project_id !== 'All') q = q.eq('project_id', params.project_id);
      if (params.assigned_to && params.assigned_to !== 'All') q = q.eq('assigned_to', params.assigned_to);
      const { data, error } = await q;
      if (!error && data) {
        db.tasks = data;
        saveLocalDB(db);
      }
    } catch {}
  }

  let list = db.tasks.map((t) => enrichTask(t, db.projects, db.employees));

  if (params.project_id && params.project_id !== 'All') {
    list = list.filter((t) => t.project_id === params.project_id);
  }
  if (params.assigned_to && params.assigned_to !== 'All') {
    list = list.filter((t) => t.assigned_to === params.assigned_to);
  }
  if (params.status && params.status !== 'All') {
    list = list.filter((t) => t.status === params.status);
  }
  if (params.priority && params.priority !== 'All') {
    list = list.filter((t) => t.priority === params.priority);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(s) || (t.description && t.description.toLowerCase().includes(s)));
  }

  return list;
}

export async function fetchTaskDetails(id: string): Promise<Task & { updates: TaskProgressUpdate[]; comments: TaskComment[] }> {
  const result = await requestApi<Task & { updates: TaskProgressUpdate[]; comments: TaskComment[] }>(`/api/tasks/${id}`);
  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new Error('Task not found');

  const enriched = enrichTask(task, db.projects, db.employees);
  const updates = db.task_progress_updates.filter((u) => u.task_id === id);
  const comments = db.task_comments.filter((c) => c.task_id === id);

  return {
    ...enriched,
    updates,
    comments,
  };
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
  const result = await requestApi<{ success: boolean; task: Task }>('/api/tasks', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const prj = db.projects.find((p) => p.id === payload.project_id);
  if (!prj) throw new Error('Parent project does not exist');

  const newTask: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    project_id: payload.project_id,
    title: payload.title.trim(),
    description: (payload.description || '').trim(),
    assigned_to: payload.assigned_to || undefined,
    priority: payload.priority || 'Medium',
    deadline: payload.deadline || undefined,
    status: payload.status || 'Not Started',
    progress: payload.progress || 0,
    time_spent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);

  db.project_activity.unshift({
    id: `act-${Date.now()}`,
    project_id: newTask.project_id,
    task_id: newTask.id,
    action: 'Task Created',
    actor_name: accessKey === '1001' ? 'Hardik' : accessKey === '1002' ? 'Abhishek' : 'Manager',
    details: `Added new task "${newTask.title}"`,
    created_at: new Date().toISOString(),
  });

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('tasks').insert([{
        id: newTask.id,
        project_id: newTask.project_id,
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        priority: newTask.priority,
        deadline: newTask.deadline,
        status: newTask.status,
        progress: newTask.progress,
        time_spent: 0,
      }])
    );
  }

  const enriched = enrichTask(newTask, db.projects, db.employees);
  return { success: true, task: enriched };
}

export async function updateTask(
  id: string,
  payload: Partial<CreateTaskPayload & { time_spent?: number }>,
  accessKey?: string
): Promise<{ success: boolean; task: Task }> {
  const result = await requestApi<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');

  db.tasks[idx] = {
    ...db.tasks[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  };

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('tasks').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    );
  }

  const enriched = enrichTask(db.tasks[idx], db.projects, db.employees);
  return { success: true, task: enriched };
}

export async function deleteTask(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const result = await requestApi<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  db.task_progress_updates = db.task_progress_updates.filter((u) => u.task_id !== id);
  db.task_comments = db.task_comments.filter((c) => c.task_id !== id);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('tasks').delete().eq('id', id));
  }

  return { success: true, message: 'Task deleted successfully' };
}

// ==============================================================================
// 5. Task Progress Update Submission
// ==============================================================================

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
  const result = await requestApi<{ success: boolean; message: string; task: Task; update: TaskProgressUpdate }>(
    `/api/tasks/${taskId}/progress`,
    {
      method: 'POST',
      headers: getHeaders(accessKey),
      body: JSON.stringify(payload),
    }
  );

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) throw new Error('Task not found');

  const currentTask = db.tasks[taskIndex];
  const prevProgress = currentTask.progress;
  const newProg = Math.max(0, Math.min(100, Number(payload.progress) || 0));

  let newStatus: TaskStatus = payload.status || currentTask.status;
  if (newProg === 100) newStatus = 'Completed';
  else if (newProg > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

  const additionalHours = Math.max(0, Number(payload.time_spent) || 0);

  // Identify worker
  let workerName = 'Employee';
  let workerId = currentTask.assigned_to;
  if (accessKey) {
    const matched = db.employees.find((e) => e.access_key === accessKey || e.employee_id === accessKey);
    if (matched) {
      workerName = matched.name;
      workerId = matched.id;
    }
  }

  const updateRecord: TaskProgressUpdate = {
    id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    task_id: taskId,
    employee_id: workerId,
    employee_name: workerName,
    previous_progress: prevProgress,
    new_progress: newProg,
    work_completed: payload.work_completed.trim(),
    work_remaining: payload.work_remaining ? payload.work_remaining.trim() : undefined,
    challenges: payload.challenges ? payload.challenges.trim() : undefined,
    next_steps: payload.next_steps ? payload.next_steps.trim() : undefined,
    time_spent: additionalHours,
    created_at: new Date().toISOString(),
  };

  db.task_progress_updates.unshift(updateRecord);

  // Update Task
  db.tasks[taskIndex] = {
    ...currentTask,
    progress: newProg,
    status: newStatus,
    time_spent: (Number(currentTask.time_spent) || 0) + additionalHours,
    updated_at: new Date().toISOString(),
  };

  // Add project activity
  db.project_activity.unshift({
    id: `act-${Date.now()}`,
    project_id: currentTask.project_id,
    task_id: taskId,
    action: `Progress Updated to ${newProg}%`,
    actor_name: workerName,
    details: payload.work_completed.substring(0, 120),
    created_at: new Date().toISOString(),
  });

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('task_progress_updates').insert([updateRecord]));
    syncSupabase(
      supabase.from('tasks').update({
        progress: newProg,
        status: newStatus,
        time_spent: db.tasks[taskIndex].time_spent,
        updated_at: new Date().toISOString(),
      }).eq('id', taskId)
    );
  }

  const enriched = enrichTask(db.tasks[taskIndex], db.projects, db.employees);
  return {
    success: true,
    message: 'Work progress submitted successfully',
    task: enriched,
    update: updateRecord,
  };
}

// ==============================================================================
// 6. Task Comments
// ==============================================================================

export async function addTaskComment(taskId: string, comment: string, accessKey?: string): Promise<{ success: boolean; comment: TaskComment }> {
  const result = await requestApi<{ success: boolean; comment: TaskComment }>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify({ comment }),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('Task not found');

  let commenterName = 'Team Member';
  let commenterId: string | undefined = undefined;
  if (accessKey) {
    const matched = db.employees.find((e) => e.access_key === accessKey || e.employee_id === accessKey);
    if (matched) {
      commenterName = matched.name;
      commenterId = matched.id;
    }
  }

  const commentRecord: TaskComment = {
    id: `cmt-${Date.now()}`,
    task_id: taskId,
    employee_id: commenterId,
    employee_name: commenterName,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  };

  db.task_comments.unshift(commentRecord);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('task_comments').insert([commentRecord]));
  }

  return { success: true, comment: commentRecord };
}

// ==============================================================================
// 7. Employees API (Initial 4 Core Staff Hardik, Abhishek, Kaushik, Himanshu)
// ==============================================================================

export async function fetchEmployees(): Promise<Employee[]> {
  const result = await requestApi<Employee[]>('/api/employees');
  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const supabase = getDirectSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data && data.length > 0) {
        db.employees = data;
        saveLocalDB(db);
      }
    } catch {}
  }

  return db.employees.map((emp) => {
    const dept = db.departments.find((d) => d.id === emp.department_id);
    const empTasks = db.tasks.filter((t) => t.assigned_to === emp.id);
    const total = empTasks.length;
    const completed = empTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = empTasks.filter((t) => t.status === 'In Progress').length;
    const blocked = empTasks.filter((t) => t.status === 'Blocked').length;
    const avgProg = total > 0 ? Math.round(empTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total) : 0;
    const hours = empTasks.reduce((acc, t) => acc + (Number(t.time_spent) || 0), 0);

    return {
      ...emp,
      department_name: dept ? dept.name : undefined,
      total_tasks: total,
      completed_tasks: completed,
      in_progress_tasks: inProgress,
      blocked_tasks: blocked,
      avg_progress: avgProg,
      total_hours: hours,
    };
  });
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
  const result = await requestApi<{ success: boolean; employee: Employee }>('/api/employees', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const newEmp: Employee = {
    id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: payload.name.trim(),
    employee_id: payload.employee_id.trim(),
    department_id: payload.department_id || undefined,
    designation: payload.designation.trim(),
    profile_image: payload.profile_image || undefined,
    joining_date: payload.joining_date || new Date().toISOString().split('T')[0],
    role: payload.role || 'Employee',
    access_key: payload.access_key ? payload.access_key.trim() : '1234',
    status: payload.status || 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.employees.push(newEmp);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('employees').insert([newEmp]));
  }

  return { success: true, employee: newEmp };
}

export async function updateEmployee(id: string, payload: Partial<CreateEmployeePayload>, accessKey?: string): Promise<{ success: boolean; employee: Employee }> {
  const result = await requestApi<{ success: boolean; employee: Employee }>(`/api/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const idx = db.employees.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Employee not found');

  db.employees[idx] = {
    ...db.employees[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  };

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('employees').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    );
  }

  return { success: true, employee: db.employees[idx] };
}

export async function deleteEmployee(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const result = await requestApi<{ success: boolean; message: string }>(`/api/employees/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  db.employees = db.employees.filter((e) => e.id !== id);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('employees').delete().eq('id', id));
  }

  return { success: true, message: 'Employee removed successfully' };
}

// ==============================================================================
// 8. Departments API
// ==============================================================================

export async function fetchDepartments(): Promise<Department[]> {
  const result = await requestApi<Department[]>('/api/departments');
  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const supabase = getDirectSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('departments').select('*');
      if (!error && data && data.length > 0) {
        db.departments = data;
        saveLocalDB(db);
      }
    } catch {}
  }

  return db.departments.map((dept) => {
    const deptProjects = db.projects.filter((p) => p.department_id === dept.id);
    const pCount = deptProjects.length;
    let avgProg = 0;
    if (pCount > 0) {
      const enriched = deptProjects.map((p) => enrichProject(p, db.tasks, db.employees, db.departments));
      avgProg = Math.round(enriched.reduce((acc, p) => acc + p.progress, 0) / pCount);
    }
    return {
      ...dept,
      project_count: pCount,
      avg_progress: avgProg,
    };
  });
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
  description?: string;
}

export async function createDepartment(payload: CreateDepartmentPayload, accessKey?: string): Promise<{ success: boolean; department: Department }> {
  const result = await requestApi<{ success: boolean; department: Department }>('/api/departments', {
    method: 'POST',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const newDept: Department = {
    id: `dept-${Date.now()}`,
    name: payload.name.trim(),
    code: (payload.code || payload.name.substring(0, 4).toUpperCase()).trim(),
    description: (payload.description || '').trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.departments.push(newDept);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('departments').insert([newDept]));
  }

  return { success: true, department: newDept };
}

export async function updateDepartment(id: string, payload: CreateDepartmentPayload, accessKey?: string): Promise<{ success: boolean; department: Department }> {
  const result = await requestApi<{ success: boolean; department: Department }>(`/api/departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessKey),
    body: JSON.stringify(payload),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  const idx = db.departments.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Department not found');

  db.departments[idx] = {
    ...db.departments[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  };

  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(
      supabase.from('departments').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    );
  }

  return { success: true, department: db.departments[idx] };
}

export async function deleteDepartment(id: string, accessKey?: string): Promise<{ success: boolean; message: string }> {
  const result = await requestApi<{ success: boolean; message: string }>(`/api/departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessKey),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  const db = getLocalDB();
  db.departments = db.departments.filter((d) => d.id !== id);
  saveLocalDB(db);

  const supabase = getDirectSupabaseClient();
  if (supabase) {
    syncSupabase(supabase.from('departments').delete().eq('id', id));
  }

  return { success: true, message: 'Department deleted successfully' };
}

// ==============================================================================
// 9. Reset to Clean Baseline
// ==============================================================================

export async function resetCleanBaseline(accessKey?: string): Promise<{ success: boolean; message: string }> {
  const result = await requestApi<{ success: boolean; message: string }>('/api/database/clean-baseline', {
    method: 'POST',
    headers: getHeaders(accessKey),
  });

  if (result.ok && result.data) {
    return result.data;
  }

  resetLocalBaseline();
  return {
    success: true,
    message: 'Database reset to clean baseline (4 core employees Hardik, Abhishek, Kaushik, Himanshu, 0 projects).',
  };
}

export function isBackendConnected(): boolean {
  return backendReachable === true;
}

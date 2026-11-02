import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Task, Project, Employee, TaskStatus, Priority } from '../types';
import { fetchTasks, deleteTask } from '../api';

interface TasksPageProps {
  projects: Project[];
  employees: Employee[];
  onOpenCreateTask: () => void;
  onOpenTaskProgress: (task: Task) => void;
  onOpenEditTask: (task: Task) => void;
  accessKey?: string;
  isManager: boolean;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  projects,
  employees,
  onOpenCreateTask,
  onOpenTaskProgress,
  onOpenEditTask,
  accessKey,
  isManager,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTasks({
        project_id: selectedProject,
        assigned_to: selectedEmployee,
        status: selectedStatus,
        priority: selectedPriority,
        search: searchQuery,
      });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [searchQuery, selectedProject, selectedEmployee, selectedStatus, selectedPriority]);

  const handleDeleteTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await deleteTask(task.id, accessKey);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tasks Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational deliverables across all initiatives. Click any task to update progress (0-100%) or log work hours.
          </p>
        </div>

        {isManager && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or scope..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Assignees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1 flex items-center justify-end text-slate-400 text-xs">
            <span>{tasks.length} total tasks</span>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No tasks found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a task and assign it to a team member to track progress and deliverables.
            </p>
          </div>
          {isManager && (
            <button
              onClick={onOpenCreateTask}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onOpenTaskProgress(task)}
              className="bg-[#0e1628] hover:bg-[#111b30] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-md"
            >
              {/* Task Title & Project */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-cyan-400">{task.project_name}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">
                    Assignee: <strong className="text-slate-200">{task.assigned_employee_name || 'Unassigned'}</strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span
                    className={
                      task.priority === 'Critical'
                        ? 'text-red-400 font-bold'
                        : task.priority === 'High'
                        ? 'text-amber-400 font-semibold'
                        : 'text-slate-400'
                    }
                  >
                    {task.priority} Priority
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Progress & Status Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                {/* Progress bar pill */}
                <div className="w-36 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-mono tabular-nums font-bold text-cyan-400">
                      {task.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${task.progress}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.status === 'Completed'
                          ? 'bg-emerald-400'
                          : task.status === 'Blocked'
                          ? 'bg-red-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Status pill */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    task.status === 'Completed'
                      ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                      : task.status === 'In Progress'
                      ? 'text-blue-400 bg-blue-950/80 border border-blue-800/60'
                      : task.status === 'Blocked'
                      ? 'text-red-400 bg-red-950/80 border border-red-800/60'
                      : 'text-slate-400 bg-slate-900 border border-slate-800'
                  }`}
                >
                  {task.status}
                </span>

                {/* Deadlines & Hours */}
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span className="block">{task.deadline ? `Due: ${task.deadline}` : 'No deadline'}</span>
                  <span className="text-slate-500">{task.time_spent}h spent</span>
                </div>

                {/* Manager actions */}
                {isManager && (
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditTask(task);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTask(e, task)}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/50 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Columns3,
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import { Task, Project, Employee, TaskStatus } from '../types';
import { fetchTasks, updateTask } from '../api';

interface KanbanBoardPageProps {
  projects: Project[];
  employees: Employee[];
  onOpenCreateTask: () => void;
  onOpenTaskProgress: (task: Task) => void;
  accessKey?: string;
  isManager: boolean;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'Not Started', label: 'Not Started', color: 'border-slate-700 text-slate-300' },
  { id: 'In Progress', label: 'In Progress', color: 'border-blue-600/80 text-blue-300' },
  { id: 'Blocked', label: 'Blocked', color: 'border-red-600/80 text-red-300' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-600/80 text-emerald-300' },
];

export const KanbanBoardPage: React.FC<KanbanBoardPageProps> = ({
  projects,
  employees,
  onOpenCreateTask,
  onOpenTaskProgress,
  accessKey,
  isManager,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('All');

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTasks({ project_id: selectedProject });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks for kanban:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const handleQuickMove = async (e: React.MouseEvent, taskId: string, newStatus: TaskStatus) => {
    e.stopPropagation();
    let newProgress = newStatus === 'Completed' ? 100 : newStatus === 'Not Started' ? 0 : 50;

    try {
      await updateTask(taskId, { status: newStatus, progress: newProgress }, accessKey);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to move task status');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Kanban Task Board</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual workflow pipeline. Click any card to log granular progress (0-100%) or move stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {isManager && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="bg-[#0b1222] border border-slate-800/80 rounded-2xl p-3 flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-800/80 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.id === 'Completed' ? 'bg-emerald-400' : col.id === 'Blocked' ? 'bg-red-400' : col.id === 'In Progress' ? 'bg-blue-400' : 'bg-slate-500'}`} />
                  <h3 className="font-bold text-xs text-white">{col.label}</h3>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 overflow-y-auto p-1 space-y-3 mt-3">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs italic border border-dashed border-slate-800/60 rounded-xl">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskProgress(task)}
                      className="bg-[#0e1628] hover:bg-[#121c32] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer shadow-md group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-cyan-400 truncate max-w-[140px]">
                          {task.project_name}
                        </span>
                        <span
                          className={
                            task.priority === 'Critical'
                              ? 'text-red-400 font-bold'
                              : task.priority === 'High'
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-400'
                          }
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors leading-snug">
                        {task.title}
                      </h4>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Progress</span>
                          <span className="font-mono tabular-nums font-bold text-cyan-400">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${task.progress}%` }}
                            className={`h-full rounded-full ${
                              task.status === 'Completed'
                                ? 'bg-emerald-400'
                                : task.status === 'Blocked'
                                ? 'bg-red-400'
                                : 'bg-cyan-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-300 font-medium">
                          {task.assigned_employee_name || 'Unassigned'}
                        </span>
                        <span className="font-mono">
                          {task.deadline ? task.deadline.substring(5) : '—'}
                        </span>
                      </div>

                      {/* Quick Move stage selector */}
                      <div className="pt-1 flex items-center justify-end gap-1">
                        {COLUMNS.filter((c) => c.id !== task.status).map((targetCol) => (
                          <button
                            key={targetCol.id}
                            onClick={(e) => handleQuickMove(e, task.id, targetCol.id)}
                            className="px-1.5 py-0.5 text-[9px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800"
                            title={`Move to ${targetCol.label}`}
                          >
                            → {targetCol.label.substring(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

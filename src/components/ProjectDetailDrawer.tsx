import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Calendar,
  Users,
  Timer,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Project, Task, ProjectActivity } from '../types';
import { fetchProjectDetails, deleteProject } from '../api';

interface ProjectDetailDrawerProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask: (projectId: string) => void;
  onOpenTaskProgress: (task: Task) => void;
  onEditProject: (project: Project) => void;
  onProjectDeleted: () => void;
  accessKey?: string;
  isManager: boolean;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  projectId,
  isOpen,
  onClose,
  onOpenCreateTask,
  onOpenTaskProgress,
  onEditProject,
  onProjectDeleted,
  accessKey,
  isManager,
}) => {
  if (!isOpen || !projectId) return null;

  const [projectData, setProjectData] = useState<(Project & { tasks: Task[]; activity: ProjectActivity[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'activity'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'All' | 'Not Started' | 'In Progress' | 'Blocked' | 'Completed'>('All');

  useEffect(() => {
    loadDetails();
  }, [projectId]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjectDetails(projectId);
      setProjectData(data);
    } catch (err) {
      console.error('Error fetching project details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete project "${projectData?.name}" and all its tasks? This action is permanent.`)) {
      return;
    }

    try {
      await deleteProject(projectId, accessKey);
      onProjectDeleted();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const filteredTasks = (projectData?.tasks || []).filter((t) =>
    taskFilter === 'All' ? true : t.status === taskFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl h-full bg-[#0e1628] border-l border-slate-800 shadow-2xl flex flex-col text-xs animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0a0f1d] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                {projectData?.department_name || 'Project'}
              </span>
              <span className="text-slate-600">·</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                  projectData?.health_status === 'Completed'
                    ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                    : projectData?.health_status === 'Overdue'
                    ? 'text-red-400 bg-red-950/80 border border-red-800/60'
                    : projectData?.health_status === 'At Risk'
                    ? 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                    : 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                }`}
              >
                {projectData?.health_status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{projectData?.name}</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {projectData?.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isManager && projectData && (
              <>
                <button
                  onClick={() => onEditProject(projectData)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="Edit project settings"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/50 cursor-pointer"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Milestone Strip */}
        <div className="p-5 border-b border-slate-800 bg-[#0c1322] shrink-0 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Overall Task Completion</span>
            <span className="font-mono tabular-nums text-base font-bold text-cyan-400">
              {projectData?.progress ?? 0}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${projectData?.progress ?? 0}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Tasks</span>
              <span className="font-mono tabular-nums font-bold text-slate-100">{projectData?.total_tasks ?? 0}</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Completed</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">
                {projectData?.completed_tasks ?? 0}
              </span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">In Progress</span>
              <span className="font-mono tabular-nums font-bold text-blue-400">
                {projectData?.in_progress_tasks ?? 0}
              </span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Blocked</span>
              <span className="font-mono tabular-nums font-bold text-red-400">
                {projectData?.blocked_tasks ?? 0}
              </span>
            </div>
          </div>

          {/* Meta Dates & Assigned */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-3">
              <span>Start: <strong className="text-slate-300">{projectData?.start_date}</strong></span>
              <span>Deadline: <strong className="text-slate-300">{projectData?.target_date || 'None'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Assigned:</span>
              <span className="text-cyan-300 font-medium">
                {projectData?.assigned_employees?.map((e) => e.name).join(', ') || 'None assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'tasks' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Task Breakdown ({projectData?.tasks.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'activity' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Activity Stream ({projectData?.activity.length ?? 0})
            </button>
          </div>

          {activeTab === 'tasks' && isManager && (
            <button
              onClick={() => onOpenCreateTask(projectId)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-900/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'tasks' ? (
            <>
              {/* Task Status Filter Pills */}
              <div className="flex gap-1.5 pb-2 overflow-x-auto">
                {['All', 'Not Started', 'In Progress', 'Blocked', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTaskFilter(st as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      taskFilter === st
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <p>No tasks match this filter in this project.</p>
                  {isManager && (
                    <button
                      onClick={() => onOpenCreateTask(projectId)}
                      className="text-cyan-400 hover:underline cursor-pointer font-medium"
                    >
                      + Add the first task to {projectData?.name}
                    </button>
                  )}
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTaskProgress(t)}
                    className="p-3.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            t.status === 'Completed'
                              ? 'text-emerald-400'
                              : t.status === 'In Progress'
                              ? 'text-blue-400'
                              : t.status === 'Blocked'
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-medium text-slate-300">
                          {t.assigned_employee_name || 'Unassigned'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums font-bold text-cyan-400">{t.progress}%</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <h4 className="font-bold text-white text-xs">{t.title}</h4>
                    {t.description && <p className="text-slate-400 line-clamp-2 text-[11px]">{t.description}</p>}

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${t.progress}%` }}
                        className={`h-full rounded-full ${
                          t.status === 'Completed'
                            ? 'bg-emerald-400'
                            : t.status === 'Blocked'
                            ? 'bg-red-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Priority: <strong className="text-slate-400">{t.priority}</strong></span>
                      <span>Deadline: <strong className="text-slate-400">{t.deadline || 'None'}</strong></span>
                      <span>Time: <strong className="text-slate-400">{t.time_spent}h</strong></span>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              {projectData?.activity.length === 0 ? (
                <p className="text-slate-400 text-center py-10 italic">No activity recorded yet.</p>
              ) : (
                projectData?.activity.map((act) => (
                  <div key={act.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-cyan-400">{act.action}</span>
                      <span className="font-mono">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{act.details}</p>
                    <span className="text-[10px] text-slate-500 block">By: {act.actor_name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

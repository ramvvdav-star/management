import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Users,
  Timer,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckSquare,
} from 'lucide-react';
import { OverviewStats, Project } from '../types';

interface OverviewPageProps {
  stats: OverviewStats | null;
  isLoading: boolean;
  onOpenProjectDetail: (projectId: string) => void;
  onOpenCreateProject: () => void;
  onNavigateToProjects: () => void;
  onNavigateToTasks: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stats,
  isLoading,
  onOpenProjectDetail,
  onOpenCreateProject,
  onNavigateToProjects,
  onNavigateToTasks,
}) => {
  if (isLoading || !stats) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-xl animate-pulse border border-slate-800/60" />
          ))}
        </div>
        <div className="h-44 bg-slate-900/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* High-Level Attention Banner */}
      <div className="bg-gradient-to-r from-[#0c1527] via-[#0f1b33] to-[#0a1224] border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Briefcase className="w-4 h-4" />
              <span>eSecurityIn Projects Dashboard</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Company-Wide Project & Milestone Progress
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time project health, task completions, and employee deliverables. All completion percentages are calculated automatically from actual operational tasks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenCreateProject}
              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              + Create New Project
            </button>
            <button
              onClick={onNavigateToProjects}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              All Projects ({stats.total_projects})
            </button>
          </div>
        </div>
      </div>

      {/* Top 7 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Running Projects */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Running</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {stats.active_projects}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active initiatives</div>
        </div>

        {/* 2. Completed Projects */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {stats.completed_projects}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Delivered goals</div>
        </div>

        {/* 3. Pending Projects */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-300">
            {stats.pending_projects}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Planning / queued</div>
        </div>

        {/* 4. Tasks Completed */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Tasks Done</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {stats.completed_tasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Of {stats.total_tasks} total tasks</div>
        </div>

        {/* 5. Tasks In Progress */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">In Progress</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-300">
            {stats.in_progress_tasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active tasks</div>
        </div>

        {/* 6. Blocked Tasks */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Blocked</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-400">
            {stats.blocked_tasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Requires triage</div>
        </div>

        {/* 7. Overall Company Completion */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Avg Completion</span>
            <Timer className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-cyan-300">
            {stats.overall_company_completion}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">All project scope</div>
        </div>
      </div>

      {/* Falling Behind & Progressing Well Diagnostic Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Falling Behind Banner */}
        <div className="bg-[#0e1628] border border-red-950/60 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-red-950/80 rounded-lg text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-xs">Projects Falling Behind</h3>
              <span className="font-mono text-[11px] font-bold text-red-400">
                ({stats.falling_behind_count})
              </span>
            </div>
            {stats.falling_behind_projects.length === 0 ? (
              <p className="text-slate-400 text-xs">No projects are currently overdue or at critical schedule risk.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {stats.falling_behind_projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProjectDetail(p.id)}
                    className="px-2.5 py-1 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-md text-[11px] font-medium cursor-pointer"
                  >
                    {p.name} ({p.progress}%)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progressing Well Banner */}
        <div className="bg-[#0e1628] border border-emerald-950/60 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-950/80 rounded-lg text-emerald-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-xs">Projects Progressing Well</h3>
              <span className="font-mono text-[11px] font-bold text-emerald-400">
                ({stats.progressing_well_count})
              </span>
            </div>
            {stats.progressing_well_projects.length === 0 ? (
              <p className="text-slate-400 text-xs">Projects are early-stage or awaiting initial task progress updates.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {stats.progressing_well_projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProjectDetail(p.id)}
                    className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-md text-[11px] font-medium cursor-pointer"
                  >
                    {p.name} ({p.progress}%)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Section: Prominent Project Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Active Projects Portfolio</h3>
            <p className="text-xs text-slate-400">Click any project to view its complete task breakdown and progress history.</p>
          </div>

          <button
            onClick={onNavigateToProjects}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Projects</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {stats.projects.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mx-auto">
              <Briefcase className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-white">No Projects in Database</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start tracking by creating your company's first enterprise project. You can assign Hardik, Abhishek, Kaushik or Himanshu and break work into measurable tasks.
              </p>
            </div>
            <button
              onClick={onOpenCreateProject}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          /* Prominent Project Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onOpenProjectDetail(project.id)}
                className="bg-[#0e1628] hover:bg-[#111b30] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-150 cursor-pointer group shadow-lg shadow-black/20"
              >
                <div className="space-y-3">
                  {/* Top Status & Department Line */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {project.department_name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        project.health_status === 'Completed'
                          ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                          : project.health_status === 'Overdue'
                          ? 'text-red-400 bg-red-950/80 border border-red-800/60'
                          : project.health_status === 'At Risk'
                          ? 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                          : 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                      }`}
                    >
                      {project.health_status}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {project.name}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {project.description || 'Enterprise project registered for delivery tracking.'}
                  </p>

                  {/* Assigned Team Avatars */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center -space-x-1.5">
                      {project.assigned_employees && project.assigned_employees.length > 0 ? (
                        project.assigned_employees.map((emp) => (
                          <div
                            key={emp.id}
                            title={`${emp.name} (${emp.designation})`}
                            className="w-7 h-7 rounded-full bg-slate-800 border-2 border-[#0e1628] flex items-center justify-center font-bold text-[10px] text-cyan-300"
                          >
                            {emp.name.charAt(0)}
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No assigned staff</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {project.target_date ? `Deadline: ${project.target_date}` : 'No deadline'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Numeric Breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Completion</span>
                    <span className="font-mono tabular-nums font-bold text-cyan-400">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${project.progress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                    />
                  </div>

                  {/* Tasks status count row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      <strong className="text-slate-200">{project.total_tasks}</strong> tasks
                    </span>
                    <span className="text-emerald-400 font-mono font-medium">
                      ✓ {project.completed_tasks} done
                    </span>
                    <span className="text-blue-400 font-mono font-medium">
                      ↻ {project.in_progress_tasks} active
                    </span>
                    {project.blocked_tasks > 0 && (
                      <span className="text-red-400 font-mono font-medium">
                        ! {project.blocked_tasks} blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row: Department Breakdown & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Department Progress */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Department Project Progress</h3>
            <span className="text-xs text-slate-400">Overall Deliverables</span>
          </div>

          <div className="space-y-3">
            {stats.department_progress.map((dept) => (
              <div key={dept.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{dept.name}</span>
                  <span className="font-mono tabular-nums font-bold text-cyan-400">{dept.avg_progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${dept.avg_progress}%` }}
                    className="h-full bg-cyan-400 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{dept.project_count} projects</span>
                  <span>{dept.task_count} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Project Activity Timeline</h3>
            <span className="text-xs text-slate-400">Audit Stream</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {stats.recent_activity.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-10 text-center">
                No activity recorded yet. Creating a project or updating task progress will populate this stream.
              </p>
            ) : (
              stats.recent_activity.map((act) => (
                <div key={act.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-cyan-400">{act.project_name}</span>
                    <span className="font-mono">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{act.details}</p>
                  <span className="text-[10px] text-slate-500 block">By: {act.actor_name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

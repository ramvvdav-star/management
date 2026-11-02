import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Timer,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Project, Department, Employee, Priority, ProjectStatus } from '../types';
import { fetchProjects, deleteProject } from '../api';

interface ProjectsPageProps {
  departments: Department[];
  employees: Employee[];
  onOpenProjectDetail: (projectId: string) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: (project: Project) => void;
  accessKey?: string;
  isManager: boolean;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  departments,
  employees,
  onOpenProjectDetail,
  onOpenCreateProject,
  onOpenEditProject,
  accessKey,
  isManager,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjects({
        department_id: selectedDept,
        status: selectedStatus,
        priority: selectedPriority,
        search: searchQuery,
        sort: sortOrder,
      });
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [searchQuery, selectedDept, selectedStatus, selectedPriority, sortOrder]);

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!window.confirm(`Delete project "${project.name}" and all its tasks? This action is permanent.`)) {
      return;
    }

    try {
      await deleteProject(project.id, accessKey);
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Projects Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, configure, and track company initiatives. Progress percentages reflect actual task completions.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
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
              placeholder="Search projects by title or description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 text-xs">
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

          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="progress_desc">Sort: Highest Progress</option>
              <option value="progress_asc">Sort: Lowest Progress</option>
              <option value="deadline">Sort: Upcoming Deadline</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1 flex items-center justify-end text-slate-400 text-xs">
            <span>{projects.length} matching projects</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No projects found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a project to assign tasks to Hardik, Abhishek, Kaushik, or Himanshu.
            </p>
          </div>
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProjectDetail(project.id)}
              className="bg-[#0e1628] hover:bg-[#111b30] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-150 cursor-pointer group shadow-lg shadow-black/20"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      {project.department_name}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-0.5">
                      {project.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
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

                    {isManager && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditProject(project);
                        }}
                        className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {project.description || 'Enterprise project registered for delivery tracking.'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
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

                  <div className="text-[11px] font-mono">
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

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform font-medium flex items-center gap-1">
                    View Task Breakdown <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  {isManager && (
                    <button
                      onClick={(e) => handleDelete(e, project)}
                      className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PasskeyModal } from './components/PasskeyModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskProgressModal } from './components/TaskProgressModal';
import { ProjectDetailDrawer } from './components/ProjectDetailDrawer';
import { NotificationToast, ToastNotification } from './components/NotificationToast';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { KanbanBoardPage } from './pages/KanbanBoardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// API & Types
import { fetchOverview, fetchProjects, fetchTasks, fetchEmployees, fetchDepartments } from './api';
import {
  OverviewStats,
  Project,
  Task,
  Employee,
  Department,
  AuthSession,
} from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authorization Session (Default starts in Manager mode for seamless initial setup, or authenticated)
  const [session, setSession] = useState<AuthSession>({
    role: 'Manager',
    employeeId: 'emp-hardik',
    employeeName: 'Hardik',
    isAuthenticated: true,
    accessKey: '1001',
  });

  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);

  // App-wide data caches
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskDefaultProjectId, setTaskDefaultProjectId] = useState<string | undefined>(undefined);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isTaskProgressModalOpen, setIsTaskProgressModalOpen] = useState(false);
  const [activeTaskForProgress, setActiveTaskForProgress] = useState<Task | null>(null);

  const [selectedProjectIdForDrawer, setSelectedProjectIdForDrawer] = useState<string | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadAllData = useCallback(async (showNotice = false) => {
    setIsRefreshing(true);
    try {
      const [overviewData, projectsData, tasksData, employeesData, deptsData] = await Promise.all([
        fetchOverview(),
        fetchProjects(),
        fetchTasks(),
        fetchEmployees(),
        fetchDepartments(),
      ]);

      setOverviewStats(overviewData);
      setProjects(projectsData);
      setTasks(tasksData);
      setEmployees(employeesData);
      setDepartments(deptsData);

      if (showNotice) {
        addToast('info', 'Data Synchronized', 'All project and task metrics refreshed.');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      if (showNotice) {
        addToast('error', 'Sync Failed', 'Could not fetch latest updates from server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleOpenProjectDetail = (projectId: string) => {
    setSelectedProjectIdForDrawer(projectId);
  };

  const handleOpenCreateTask = (projectId?: string) => {
    setTaskDefaultProjectId(projectId);
    setTaskToEdit(null);
    setIsCreateTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskDefaultProjectId(task.project_id);
    setIsCreateTaskModalOpen(true);
  };

  const handleOpenTaskProgress = (task: Task) => {
    setActiveTaskForProgress(task);
    setIsTaskProgressModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setProjectToEdit(proj);
    setIsCreateProjectModalOpen(true);
  };

  const handleProjectSuccess = (savedProject: Project) => {
    addToast('success', 'Project Saved', `Project "${savedProject.name}" recorded.`);
    loadAllData();
  };

  const handleTaskSuccess = (savedTask: Task) => {
    addToast('success', 'Task Saved', `Task "${savedTask.title}" updated.`);
    loadAllData();
  };

  const handleProgressSuccess = (updatedTask: Task) => {
    addToast(
      'success',
      'Progress Updated',
      `Task "${updatedTask.title}" is now at ${updatedTask.progress}% completion.`
    );
    loadAllData();
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'overview':
        return 'Overview Dashboard';
      case 'projects':
        return 'Projects Portfolio';
      case 'tasks':
        return 'Tasks & Deliverables';
      case 'kanban':
        return 'Kanban Workflow';
      case 'employees':
        return 'Employee Directory';
      case 'departments':
        return 'Departments & Teams';
      case 'reports':
        return 'Reports & Data Export';
      case 'settings':
        return 'Platform Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenCreateProject={() => {
            setProjectToEdit(null);
            setIsCreateProjectModalOpen(true);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          session={session}
          onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
          activeProjectCount={overviewStats?.active_projects ?? projects.length}
          totalTaskCount={overviewStats?.total_tasks ?? tasks.length}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Header */}
          <Header
            currentPageTitle={getPageTitle(currentPage)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenCreateProject={() => {
              setProjectToEdit(null);
              setIsCreateProjectModalOpen(true);
            }}
            onOpenCreateTask={() => handleOpenCreateTask()}
            onRefreshData={() => loadAllData(true)}
            isRefreshing={isRefreshing}
            session={session}
            onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
          />

          {/* Navigation Routing */}
          <main className="flex-1 pb-16">
            {currentPage === 'overview' && (
              <OverviewPage
                stats={overviewStats}
                isLoading={isLoading}
                onOpenProjectDetail={handleOpenProjectDetail}
                onOpenCreateProject={() => {
                  setProjectToEdit(null);
                  setIsCreateProjectModalOpen(true);
                }}
                onNavigateToProjects={() => setCurrentPage('projects')}
                onNavigateToTasks={() => setCurrentPage('tasks')}
              />
            )}

            {currentPage === 'projects' && (
              <ProjectsPage
                departments={departments}
                employees={employees}
                onOpenProjectDetail={handleOpenProjectDetail}
                onOpenCreateProject={() => {
                  setProjectToEdit(null);
                  setIsCreateProjectModalOpen(true);
                }}
                onOpenEditProject={handleOpenEditProject}
                accessKey={session.accessKey}
                isManager={session.role === 'Manager'}
              />
            )}

            {currentPage === 'tasks' && (
              <TasksPage
                projects={projects}
                employees={employees}
                onOpenCreateTask={() => handleOpenCreateTask()}
                onOpenTaskProgress={handleOpenTaskProgress}
                onOpenEditTask={handleOpenEditTask}
                accessKey={session.accessKey}
                isManager={session.role === 'Manager'}
              />
            )}

            {currentPage === 'kanban' && (
              <KanbanBoardPage
                projects={projects}
                employees={employees}
                onOpenCreateTask={() => handleOpenCreateTask()}
                onOpenTaskProgress={handleOpenTaskProgress}
                accessKey={session.accessKey}
                isManager={session.role === 'Manager'}
              />
            )}

            {currentPage === 'employees' && (
              <EmployeesPage
                departments={departments}
                accessKey={session.accessKey}
                isManager={session.role === 'Manager'}
                currentEmployeeId={session.employeeId}
                onSelectEmployeeSession={(key) => {
                  const emp = employees.find((e) => e.access_key === key || e.employee_id === key);
                  if (emp) {
                    setSession({
                      role: emp.role,
                      employeeId: emp.id,
                      employeeName: emp.name,
                      isAuthenticated: true,
                      accessKey: emp.access_key || key,
                    });
                    addToast('info', 'Active User Switched', `Switched session to ${emp.name} (${emp.role})`);
                  }
                }}
              />
            )}

            {currentPage === 'departments' && (
              <DepartmentsPage
                accessKey={session.accessKey}
                isManager={session.role === 'Manager'}
                onSelectDepartmentFilter={(deptId) => {
                  setCurrentPage('projects');
                }}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage
                projects={projects}
                tasks={tasks}
                employees={employees}
                departments={departments}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                session={session}
                onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
                onRefreshData={() => loadAllData(false)}
                isManager={session.role === 'Manager'}
                accessKey={session.accessKey}
              />
            )}
          </main>
        </div>
      </div>

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        projectId={selectedProjectIdForDrawer}
        isOpen={!!selectedProjectIdForDrawer}
        onClose={() => setSelectedProjectIdForDrawer(null)}
        onOpenCreateTask={(projId) => handleOpenCreateTask(projId)}
        onOpenTaskProgress={handleOpenTaskProgress}
        onEditProject={handleOpenEditProject}
        onProjectDeleted={() => {
          setSelectedProjectIdForDrawer(null);
          loadAllData();
        }}
        accessKey={session.accessKey}
        isManager={session.role === 'Manager'}
      />

      {/* Create / Edit Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={handleProjectSuccess}
        departments={departments}
        employees={employees}
        accessKey={session.accessKey}
        projectToEdit={projectToEdit}
      />

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={handleTaskSuccess}
        projects={projects}
        employees={employees}
        defaultProjectId={taskDefaultProjectId}
        accessKey={session.accessKey}
        taskToEdit={taskToEdit}
      />

      {/* Granular Task Progress Modal (0-100%, work remaining, blockers, history) */}
      <TaskProgressModal
        task={activeTaskForProgress}
        isOpen={isTaskProgressModalOpen}
        onClose={() => setIsTaskProgressModalOpen(false)}
        onSuccess={handleProgressSuccess}
        accessKey={session.accessKey}
        currentEmployeeName={session.employeeName}
        onRequireAuth={() => setIsPasskeyModalOpen(true)}
      />

      {/* Passkey / Authorization Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onSuccess={(newSession) => {
          setSession(newSession);
          addToast('success', 'Session Authorized', `Signed in as ${newSession.employeeName || newSession.role}`);
        }}
        currentSession={session}
      />

      {/* Toast Notifications */}
      <NotificationToast notifications={toasts} onDismiss={dismissToast} />
    </div>
  );
}
